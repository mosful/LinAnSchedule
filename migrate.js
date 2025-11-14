const { Firestore } = require('@google-cloud/firestore');
const fs = require('fs').promises;
const path = require('path');

// 初始化 Firestore
const db = new Firestore({ databaseId: 'linanschedule' });
const peopleCollection = db.collection('people');

const DB_PATH = path.join(__dirname, 'database.json');

async function migrate() {
  try {
    console.log('正在讀取 database.json...');
    const data = await fs.readFile(DB_PATH, 'utf-8');
    const jsonData = JSON.parse(data);

    if (!jsonData.people || jsonData.people.length === 0) {
      console.log('database.json 中沒有人員資料可遷移。');
      return;
    }

    console.log(`找到 ${jsonData.people.length} 筆人員資料，準備遷移至 Firestore...`);

    const batch = db.batch();
    let count = 0;

    for (const person of jsonData.people) {
      // Firestore 會自動產生文件 ID，我們不需要從 JSON 檔案中傳入 id
      const { id, ...personData } = person;
      
      // 建立一個新的文件引用 (這不會立即寫入)
      const docRef = peopleCollection.doc(); 
      
      // 將寫入操作加入到批次中
      batch.set(docRef, personData);
      count++;
    }

    // 一次性提交所有寫入操作
    await batch.commit();
    console.log(`成功！ ${count} 筆人員資料已成功遷移至 Firestore 的 'people' collection 中。`);
    console.log('您可以前往 Google Cloud Console 的 Firestore 頁面查看資料。');

  } catch (error) {
    console.error('遷移過程中發生錯誤:', error);
    console.error('請檢查您的 GCP 認證是否已設定 (gcloud auth application-default login)，以及 Firestore 資料庫是否已建立。');
  }
}

migrate();
