const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const { Firestore } = require('@google-cloud/firestore');

const app = express();
const port = 3000;

// --- Firestore 初始化 ---
const db = new Firestore({ databaseId: 'linanschedule' });
const peopleCollection = db.collection('people');
const schedulesCollection = db.collection('schedules');

// ！！！請將您的 Channel Access Token 填寫在這裡！！！
const CHANNEL_ACCESS_TOKEN = 'YOUR_CHANNEL_ACCESS_TOKEN_HERE';
const LINE_API_URL = 'https://api.line.me/v2/bot/message/push';

app.use(cors());
app.use(bodyParser.json());

// --- API 端點 ---

// People API
app.get('/api/people', async (req, res) => {
  try {
    const snapshot = await peopleCollection.get();
    const people = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(people);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch people' });
  }
});

app.post('/api/people', async (req, res) => {
  try {
    const newPerson = req.body;
    // Firestore 會自動產生 ID，所以我們不需要手動設定
    const docRef = await peopleCollection.add(newPerson);
    res.status(201).json({ id: docRef.id, ...newPerson });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add person' });
  }
});

app.put('/api/people/:id', async (req, res) => {
  try {
    const personId = req.params.id;
    const updatedPersonData = req.body;
    const personRef = peopleCollection.doc(personId);
    
    await personRef.set(updatedPersonData, { merge: true }); // merge: true 只更新有的欄位
    
    res.json({ id: personId, ...updatedPersonData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update person' });
  }
});

app.delete('/api/people/:id', async (req, res) => {
  try {
    const personId = req.params.id;
    await peopleCollection.doc(personId).delete();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete person' });
  }
});


// Schedules API
app.get('/api/schedules', async (req, res) => {
    try {
        const snapshot = await schedulesCollection.orderBy('date').get();
        const schedules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(schedules);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch schedules' });
    }
});

// 一次性替換所有排班 (用於生成排班表)
app.post('/api/schedules', async (req, res) => {
    const newSchedules = req.body;
    try {
        // 刪除所有舊的排班
        const snapshot = await schedulesCollection.get();
        const batch = db.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        // 新增所有新的排班
        const addBatch = db.batch();
        newSchedules.forEach(schedule => {
            // Firestore 會自動產生 ID，所以我們從前端的資料中移除 id
            const { id, ...scheduleData } = schedule;
            const docRef = schedulesCollection.doc(); // 產生一個新的文件引用
            addBatch.set(docRef, scheduleData);
        });
        await addBatch.commit();

        // 回傳新增後的完整排班列表
        const finalSnapshot = await schedulesCollection.orderBy('date').get();
        const finalSchedules = finalSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(201).json(finalSchedules);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate schedules' });
    }
});

app.put('/api/schedules/:id', async (req, res) => {
    try {
        const scheduleId = req.params.id;
        const { id, ...updatedScheduleData } = req.body; // 移除 id 避免寫入
        const scheduleRef = schedulesCollection.doc(scheduleId);
        await scheduleRef.set(updatedScheduleData, { merge: true });
        res.json({ id: scheduleId, ...updatedScheduleData });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update schedule' });
    }
});

app.delete('/api/schedules/:id', async (req, res) => {
    try {
        const scheduleId = req.params.id;
        await schedulesCollection.doc(scheduleId).delete();
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete schedule' });
    }
});

// --- LINE Messaging API 功能 ---

const sendLineMessage = async (userId, messagePayload) => {
    if (!CHANNEL_ACCESS_TOKEN || CHANNEL_ACCESS_TOKEN === 'YOUR_CHANNEL_ACCESS_TOKEN_HERE') {
        console.error('錯誤：Channel Access Token 尚未設定！');
        return;
    }
    try {
        await axios.post(LINE_API_URL, { to: userId, messages: messagePayload }, {
            headers: { 'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}` }
        });
    } catch (error) {
        console.error(`發送訊息失敗 (userId: ${userId}):`, error.response ? error.response.data : error.message);
    }
};

app.post('/send-push-message', async (req, res) => {
  const { userId, message } = req.body;
  if (!userId || !message) return res.status(400).json({ error: 'userId and message are required.' });
  
  await sendLineMessage(userId, [{ type: 'text', text: message }]);
  res.status(200).json({ success: true });
});

app.post('/webhook', async (req, res) => {
  console.log('收到 LINE Webhook 事件:', JSON.stringify(req.body, null, 2));
  res.sendStatus(200);

  for (const event of req.body.events) {
    const userId = event.source.userId;
    if (!userId) continue;

    if (event.type === 'follow') {
      await sendLineMessage(userId, [{ type: 'text', text: '歡迎使用輪班通知服務！\n為了將您的 LINE 帳號與排班系統綁定，請直接回覆您在排班系統中的「姓名」。' }]);
    }

    if (event.type === 'message' && event.message.type === 'text') {
      const userName = event.message.text.trim();
      const query = peopleCollection.where('name', '==', userName);
      const snapshot = await query.get();

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        await doc.ref.update({ lineId: userId, enableLineNotify: true });
        console.log(`成功將 userId ${userId} 綁定至 ${userName}`);
        await sendLineMessage(userId, [{ type: 'text', text: `帳號綁定成功！您現在是「${userName}」，未來將會收到排班通知。` }]);
      } else {
        await sendLineMessage(userId, [{ type: 'text', text: `找不到姓名為「${userName}」的人員。請確認您輸入的姓名與排班系統中的姓名完全一致。` }]);
      }
    }
  }
});

app.listen(port, () => {
  console.log(`後端伺服器正在監聽 http://localhost:${port}`);
});
