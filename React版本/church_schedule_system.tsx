import React, { useState, useEffect } from 'react';
import { Calendar, Users, Plus, Trash2, Edit2, Save, X } from 'lucide-react';

const ChurchScheduleSystem = () => {
  const [people, setPeople] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [showPeopleManagement, setShowPeopleManagement] = useState(false);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [showDateRange, setShowDateRange] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [editData, setEditData] = useState(null);
  const [previewDates, setPreviewDates] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  const [showPeopleList, setShowPeopleList] = useState(false);
  
  // 新增人員表單狀態
  const [newPerson, setNewPerson] = useState({
    name: '',
    roles: [],
    excludeDates: [],
    lineId: '',
    enableLineNotify: false
  });
  
  // 日期區間狀態
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
    customDates: ''
  });

  // 載入儲存的資料
  useEffect(() => {
    const loadData = async () => {
      try {
        const [peopleResult, schedulesResult] = await Promise.all([
          window.storage.get('church-people'),
          window.storage.get('church-schedules')
        ]);
        
        if (peopleResult) {
          setPeople(JSON.parse(peopleResult.value));
        } else {
          // 初始化預設人員（含 LINE 設定）
          const defaultPeople = [
            { id: 1, name: '林淑芬', roles: ['投影手', '音控手'], excludeDates: [], lineId: '', enableLineNotify: false },
            { id: 2, name: '張明華', roles: ['投影手'], excludeDates: [], lineId: '', enableLineNotify: false },
            { id: 3, name: '王建國', roles: ['音控手'], excludeDates: [], lineId: '', enableLineNotify: false },
            { id: 4, name: '陳雅婷', roles: ['投影手', '音控手'], excludeDates: [], lineId: '', enableLineNotify: false },
            { id: 5, name: '李志強', roles: ['音控手'], excludeDates: [], lineId: '', enableLineNotify: false },
            { id: 6, name: '黃美玲', roles: ['投影手'], excludeDates: [], lineId: '', enableLineNotify: false }
          ];
          setPeople(defaultPeople);
          await window.storage.set('church-people', JSON.stringify(defaultPeople));
        }
        
        if (schedulesResult) setSchedules(JSON.parse(schedulesResult.value));
      } catch (error) {
        console.log('首次使用，載入預設資料');
        const defaultPeople = [
          { id: 1, name: '林淑芬', roles: ['投影手', '音控手'], excludeDates: [], lineId: '', enableLineNotify: false },
          { id: 2, name: '張明華', roles: ['投影手'], excludeDates: [], lineId: '', enableLineNotify: false },
          { id: 3, name: '王建國', roles: ['音控手'], excludeDates: [], lineId: '', enableLineNotify: false },
          { id: 4, name: '陳雅婷', roles: ['投影手', '音控手'], excludeDates: [], lineId: '', enableLineNotify: false },
          { id: 5, name: '李志強', roles: ['音控手'], excludeDates: [], lineId: '', enableLineNotify: false },
          { id: 6, name: '黃美玲', roles: ['投影手'], excludeDates: [], lineId: '', enableLineNotify: false }
        ];
        setPeople(defaultPeople);
      }
    };
    loadData();
  }, []);

  // 儲存資料
  const saveData = async (newPeople, newSchedules) => {
    try {
      await Promise.all([
        window.storage.set('church-people', JSON.stringify(newPeople)),
        window.storage.set('church-schedules', JSON.stringify(newSchedules))
      ]);
    } catch (error) {
      console.error('儲存失敗:', error);
    }
  };

  // 新增人員
  const addPerson = () => {
    if (!newPerson.name || newPerson.roles.length === 0) {
      setAlertMessage('請填寫姓名並至少選擇一個角色');
      return;
    }
    
    const person = {
      id: Date.now(),
      ...newPerson,
      excludeDates: newPerson.excludeDates.filter(d => d)
    };
    
    const updatedPeople = [...people, person];
    setPeople(updatedPeople);
    saveData(updatedPeople, schedules);
    
    setNewPerson({ name: '', roles: [], excludeDates: [], lineId: '', enableLineNotify: false });
    setShowAddPerson(false);
  };

  // 刪除人員
  const deletePerson = async (id) => {
    if (confirm('確定要刪除此人員嗎？')) {
      const updatedPeople = people.filter(p => p.id !== id);
      setPeople(updatedPeople);
      await saveData(updatedPeople, schedules);
    }
  };

  // 開始編輯人員
  const startEditPerson = (person) => {
    setEditingPerson(person.id);
    setEditData({
      name: person.name,
      roles: [...person.roles],
      excludeDates: [...person.excludeDates],
      lineId: person.lineId || '',
      enableLineNotify: person.enableLineNotify || false
    });
  };

  // 儲存編輯
  const saveEditPerson = () => {
    if (!editData.name.trim()) {
      setAlertMessage('姓名不能為空');
      return;
    }
    if (editData.roles.length === 0) {
      setAlertMessage('請至少選擇一個角色');
      return;
    }
    const updatedPeople = people.map(p => 
      p.id === editingPerson ? { ...p, ...editData } : p
    );
    setPeople(updatedPeople);
    saveData(updatedPeople, schedules);
    setEditingPerson(null);
    setEditData(null);
  };

  // 取消編輯
  const cancelEditPerson = () => {
    setEditingPerson(null);
    setEditData(null);
  };

  // 切換編輯角色
  const toggleEditRole = (role) => {
    setEditData(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  // 新增編輯排除日期
  const addEditExcludeDate = (date) => {
    if (date && !editData.excludeDates.includes(date)) {
      setEditData(prev => ({
        ...prev,
        excludeDates: [...prev.excludeDates, date]
      }));
    }
  };

  // 刪除編輯排除日期
  const removeEditExcludeDate = (date) => {
    setEditData(prev => ({
      ...prev,
      excludeDates: prev.excludeDates.filter(d => d !== date)
    }));
  };

  // 切換角色
  const toggleRole = (role) => {
    setNewPerson(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  // 生成排班日期
  const previewScheduleDates = () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      setAlertMessage('請選擇日期區間');
      return;
    }

    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    const dates = [];

    // 如果有自訂日期
    if (dateRange.customDates) {
      const customDatesArray = dateRange.customDates.split(',').map(d => d.trim());
      customDatesArray.forEach(dateStr => {
        const date = new Date(dateStr);
        if (date >= start && date <= end) {
          dates.push(date.toISOString().split('T')[0]);
        }
      });
    } else {
      // 預設每週日
      let current = new Date(start);
      while (current <= end) {
        if (current.getDay() === 0) { // 週日
          dates.push(current.toISOString().split('T')[0]);
        }
        current.setDate(current.getDate() + 1);
      }
    }

    setPreviewDates(dates.map(date => ({ date, isJoint: false })));
  };

  // 確認生成排班
  const confirmGenerateSchedules = () => {
    // 先清除現有排班
    setSchedules([]);
    
    const newSchedules = previewDates.map(item => ({
      id: Date.now() + Math.random(),
      date: item.date,
      isJoint: item.isJoint,
      assignments: {
        service1: { projector: null, sound: null },
        service2: { projector: null, sound: null }
      }
    }));

    const sortedSchedules = newSchedules.sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
    
    setSchedules(sortedSchedules);
    saveData(people, sortedSchedules);
    setShowDateRange(false);
    setDateRange({ startDate: '', endDate: '', customDates: '' });
    setPreviewDates([]);
  };

  // 切換預覽日期的聯合禮拜
  const togglePreviewJoint = (date) => {
    setPreviewDates(prev => prev.map(item => 
      item.date === date ? { ...item, isJoint: !item.isJoint } : item
    ));
  };

  // 自動排班
  const autoAssign = () => {
    if (schedules.length === 0) {
      setAlertMessage('請先新增排班日期');
      return;
    }
    
    const updatedSchedules = schedules.map(schedule => {
      if (schedule.isJoint) {
        // 聯合禮拜：只需一組
        const projector = getAvailablePerson('投影手', schedule.date, []);
        const sound = getAvailablePerson('音控手', schedule.date, [projector?.id]);
        
        return {
          ...schedule,
          assignments: {
            service1: { projector: projector?.id || null, sound: sound?.id || null },
            service2: { projector: null, sound: null }
          }
        };
      } else {
        // 非聯合禮拜：需要兩組
        const proj1 = getAvailablePerson('投影手', schedule.date, []);
        const sound1 = getAvailablePerson('音控手', schedule.date, [proj1?.id]);
        const proj2 = getAvailablePerson('投影手', schedule.date, [proj1?.id, sound1?.id]);
        const sound2 = getAvailablePerson('音控手', schedule.date, [proj1?.id, sound1?.id, proj2?.id]);
        
        return {
          ...schedule,
          assignments: {
            service1: { projector: proj1?.id || null, sound: sound1?.id || null },
            service2: { projector: proj2?.id || null, sound: sound2?.id || null }
          }
        };
      }
    });
    
    setSchedules(updatedSchedules);
    saveData(people, updatedSchedules);
  };

  // 取得可用人員
  const getAvailablePerson = (role, date, excludeIds) => {
    const available = people.filter(p => 
      p.roles.includes(role) && 
      !p.excludeDates.includes(date) &&
      !excludeIds.includes(p.id)
    );
    
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
  };

  // 切換聯合禮拜
  const toggleJoint = (scheduleId) => {
    const updatedSchedules = schedules.map(s => 
      s.id === scheduleId ? { ...s, isJoint: !s.isJoint } : s
    );
    setSchedules(updatedSchedules);
    saveData(people, updatedSchedules);
  };

  // 更新排班人員
  const updateAssignment = (scheduleId, service, role, personId) => {
    const updatedSchedules = schedules.map(s => {
      if (s.id === scheduleId) {
        return {
          ...s,
          assignments: {
            ...s.assignments,
            [service]: {
              ...s.assignments[service],
              [role]: personId === 'null' ? null : parseInt(personId)
            }
          }
        };
      }
      return s;
    });
    setSchedules(updatedSchedules);
    saveData(people, updatedSchedules);
  };

  // 刪除排班
  const deleteSchedule = (id) => {
    setConfirmDelete({ type: 'schedule', id });
  };

  const confirmDeleteSchedule = () => {
    if (!confirmDelete) return;
    
    const updatedSchedules = schedules.filter(s => s.id !== confirmDelete.id);
    setSchedules(updatedSchedules);
    saveData(people, updatedSchedules);
    setConfirmDelete(null);
  };

  // 依月份分組排班
  const groupSchedulesByMonth = () => {
    const grouped = {};
    schedules.forEach(schedule => {
      const date = new Date(schedule.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(schedule);
    });
    return grouped;
  };

  const schedulesByMonth = groupSchedulesByMonth();
  const roles = ['管理者', '第一堂工作人員', '第二堂工作人員', '投影手', '音控手'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* 標題 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-indigo-900 flex items-center gap-3">
            <Calendar className="w-8 h-8" />
            教會音控服事輪值
          </h1>
          <p className="text-gray-600 mt-2">管理音控與投影服事人員輪值</p>
        </div>

        {/* 功能按鈕 */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => setShowPeopleManagement(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-lg shadow-md flex items-center gap-2 transition"
          >
            <Users className="w-5 h-5" />
            維護人員
          </button>
          <button
            onClick={() => setShowDateRange(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg shadow-md flex items-center gap-2 transition"
          >
            <Calendar className="w-5 h-5" />
            新增排班日期
          </button>
          <button
            onClick={autoAssign}
            className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-lg shadow-md flex items-center gap-2 transition"
          >
            <Users className="w-5 h-5" />
            自動排班
          </button>
        </div>

        {/* 維護人員管理頁面 */}
        {showPeopleManagement && (
          <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
            <div className="max-w-6xl mx-auto p-6">
              {/* 標題列 */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Users className="w-7 h-7" />
                  維護人員
                </h2>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAddPerson(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                  >
                    <Plus className="w-5 h-5" />
                    新增人員
                  </button>
                  <button
                    onClick={() => setShowPeopleManagement(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition"
                  >
                    <X className="w-5 h-5" />
                    關閉
                  </button>
                </div>
              </div>

              {/* 人員列表 */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">姓名</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">角色</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">LINE 通知</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">排除日期</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {people.map(person => (
                        <tr key={person.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-800">
                            {editingPerson === person.id ? (
                              <input
                                type="text"
                                value={editData.name}
                                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                className="px-2 py-1 border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 w-full"
                                autoFocus
                              />
                            ) : (
                              person.name
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingPerson === person.id ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={editData.lineId}
                                  onChange={(e) => setEditData({ ...editData, lineId: e.target.value })}
                                  placeholder="LINE ID"
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                />
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={editData.enableLineNotify}
                                    onChange={(e) => setEditData({ ...editData, enableLineNotify: e.target.checked })}
                                    className="w-3 h-3 text-green-600 rounded"
                                  />
                                  <span className="text-xs text-gray-700">啟用通知</span>
                                </label>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                {person.enableLineNotify ? (
                                  <>
                                    <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                                    </svg>
                                    <span className="text-xs text-gray-700">{person.lineId || '未設定'}</span>
                                  </>
                                ) : (
                                  <span className="text-xs text-gray-400">未啟用</span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingPerson === person.id ? (
                              <div className="space-y-1">
                                {roles.map(role => (
                                  <label key={role} className="flex items-center gap-2 cursor-pointer text-xs">
                                    <input
                                      type="checkbox"
                                      checked={editData.roles.includes(role)}
                                      onChange={() => toggleEditRole(role)}
                                      className="w-3 h-3 text-indigo-600 rounded"
                                    />
                                    <span className="text-gray-700">{role}</span>
                                  </label>
                                ))}
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {person.roles.map(role => (
                                  <span key={role} className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs">
                                    {role}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingPerson === person.id ? (
                              <div>
                                <input
                                  type="date"
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      addEditExcludeDate(e.target.value);
                                      e.target.value = '';
                                    }
                                  }}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs mb-2"
                                />
                                <div className="flex flex-wrap gap-1">
                                  {editData.excludeDates.map((date, idx) => (
                                    <span key={idx} className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs flex items-center gap-1">
                                      {date}
                                      <X
                                        className="w-3 h-3 cursor-pointer"
                                        onClick={() => removeEditExcludeDate(date)}
                                      />
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {person.excludeDates.map((date, idx) => (
                                  <span key={idx} className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">
                                    {date}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {editingPerson === person.id ? (
                                <>
                                  <button
                                    onClick={saveEditPerson}
                                    className="text-green-600 hover:text-green-800"
                                    title="儲存"
                                  >
                                    <Save className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={cancelEditPerson}
                                    className="text-gray-600 hover:text-gray-800"
                                    title="取消"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => startEditPerson(person)}
                                    className="text-blue-600 hover:text-blue-800"
                                    title="編輯"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => deletePerson(person.id)}
                                    className="text-red-600 hover:text-red-800"
                                    title="刪除"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {people.length === 0 && (
                    <p className="text-center text-gray-500 py-8">尚無人員資料，請點擊「新增人員」開始建立</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 提示訊息對話框 */}
        {alertMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-bold text-gray-800 mb-4">提示</h3>
              <p className="text-gray-600 mb-6">{alertMessage}</p>
              <button
                onClick={() => setAlertMessage(null)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition"
              >
                確定
              </button>
            </div>
          </div>
        )}

        {/* 刪除確認對話框 */}
        {confirmDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-bold text-gray-800 mb-4">確認刪除</h3>
              <p className="text-gray-600 mb-6">
                {confirmDelete.type === 'person' ? '確定要刪除此人員嗎？' : '確定要刪除此排班嗎？'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={confirmDelete.type === 'person' ? confirmDeletePerson : confirmDeleteSchedule}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
                >
                  確認刪除
                </button>
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 新增人員對話框 */}
        {showAddPerson && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">新增人員</h2>
              
              <input
                type="text"
                placeholder="姓名"
                value={newPerson.name}
                onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">角色（可多選）</label>
                <div className="space-y-2">
                  {roles.map(role => (
                    <label key={role} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newPerson.roles.includes(role)}
                        onChange={() => toggleRole(role)}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span className="text-gray-700">{role}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">排除日期（可選）</label>
                <input
                  type="date"
                  onChange={(e) => {
                    if (e.target.value) {
                      setNewPerson({ ...newPerson, excludeDates: [...newPerson.excludeDates, e.target.value] });
                      e.target.value = '';
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {newPerson.excludeDates.map((date, idx) => (
                    <span key={idx} className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                      {date}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => setNewPerson({
                          ...newPerson,
                          excludeDates: newPerson.excludeDates.filter((_, i) => i !== idx)
                        })}
                      />
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="mb-4 border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                  </svg>
                  <span className="text-sm font-medium text-gray-700">LINE 通知設定</span>
                </div>
                
                <div className="mb-3">
                  <label className="block text-sm text-gray-700 mb-1">LINE ID</label>
                  <input
                    type="text"
                    value={newPerson.lineId}
                    onChange={(e) => setNewPerson({ ...newPerson, lineId: e.target.value })}
                    placeholder="例如：user123"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newPerson.enableLineNotify}
                    onChange={(e) => setNewPerson({ ...newPerson, enableLineNotify: e.target.checked })}
                    className="w-4 h-4 text-green-600 rounded"
                  />
                  <span className="text-sm text-gray-700">啟用 LINE 通知</span>
                </label>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={addPerson}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition"
                >
                  確認
                </button>
                <button
                  onClick={() => {
                    setShowAddPerson(false);
                    setNewPerson({ name: '', roles: [], excludeDates: [] });
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 新增日期區間對話框 */}
        {showDateRange && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">新增排班日期</h2>
              
              {previewDates.length === 0 ? (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">開始日期</label>
                    <input
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">結束日期</label>
                    <input
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      自訂日期（選填，用逗號分隔，例如：2024-12-25,2025-01-01）
                    </label>
                    <input
                      type="text"
                      value={dateRange.customDates}
                      onChange={(e) => setDateRange({ ...dateRange, customDates: e.target.value })}
                      placeholder="2024-12-25,2025-01-01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">留空則預設為每週日</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={previewScheduleDates}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                    >
                      下一步：設定聯合禮拜
                    </button>
                    <button
                      onClick={() => {
                        setShowDateRange(false);
                        setDateRange({ startDate: '', endDate: '', customDates: '' });
                      }}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition"
                    >
                      取消
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-4">
                    共 {previewDates.length} 個排班日期，請勾選聯合禮拜的日期
                  </p>
                  
                  <div className="space-y-2 mb-4 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {previewDates.map(item => (
                      <label key={item.date} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.isJoint}
                          onChange={() => togglePreviewJoint(item.date)}
                          className="w-5 h-5 text-purple-600 rounded"
                        />
                        <span className="text-gray-800 flex-1">{item.date}</span>
                        {item.isJoint && (
                          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">
                            聯合禮拜
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={confirmGenerateSchedules}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
                    >
                      確認生成排班
                    </button>
                    <button
                      onClick={() => setPreviewDates([])}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition"
                    >
                      上一步
                    </button>
                    <button
                      onClick={() => {
                        setShowDateRange(false);
                        setDateRange({ startDate: '', endDate: '', customDates: '' });
                        setPreviewDates([]);
                      }}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition"
                    >
                      取消
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* 人員列表 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowPeopleList(!showPeopleList)}
          >
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Users className="w-6 h-6" />
              人員列表 ({people.length} 人)
            </h2>
            <div className="flex items-center gap-3">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPeopleManagement(true);
                }}
                className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-1"
              >
                <Edit2 className="w-4 h-4" />
                維護
              </button>
              <button className="text-gray-600 hover:text-gray-800 transition">
                {showPeopleList ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          {showPeopleList && (
            <div className="overflow-x-auto mt-4">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">姓名</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">角色</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">排除日期</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {people.map(person => (
                    <tr key={person.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-800">{person.name}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {person.roles.map(role => (
                            <span key={role} className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs">
                              {role}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {person.excludeDates.map((date, idx) => (
                            <span key={idx} className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">
                              {date}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {people.length === 0 && (
                <p className="text-center text-gray-500 py-8">尚無人員資料</p>
              )}
            </div>
          )}
        </div>

        {/* 排班表 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            輪值表
          </h2>
          
          {Object.keys(schedulesByMonth).length === 0 ? (
            <p className="text-center text-gray-500 py-8">尚無輪值資料</p>
          ) : (
            <div className="space-y-6">
              {Object.keys(schedulesByMonth).sort().map(monthKey => {
                const [year, month] = monthKey.split('-');
                const monthSchedules = schedulesByMonth[monthKey];
                
                return (
                  <div key={monthKey} className="border-2 border-gray-300 rounded-lg overflow-hidden">
                    <div className="bg-indigo-600 text-white p-3">
                      <h3 className="text-lg font-bold text-center">
                        臨安教會音控輪值表 {year} 年 {month} 月
                      </h3>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <tbody>
                          <tr className="bg-gray-100">
                            {monthSchedules.map(schedule => {
                              const date = new Date(schedule.date);
                              const dayOfWeek = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
                              return (
                                <td key={schedule.id} className="border border-gray-300 p-2 text-center font-semibold min-w-[120px]">
                                  {month}/{date.getDate()}
                                  <div className="text-xs text-gray-600">週{dayOfWeek}</div>
                                </td>
                              );
                            })}
                          </tr>
                          
                          <tr>
                            {monthSchedules.map(schedule => (
                              <td key={schedule.id} className="border border-gray-300 p-2 align-top bg-blue-50">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-semibold text-blue-900">
                                      {schedule.isJoint ? '聯合' : '第一堂'}
                                    </span>
                                    <button
                                      onClick={() => deleteSchedule(schedule.id)}
                                      className="text-red-500 hover:text-red-700"
                                      title="刪除"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                  
                                  <div>
                                    <div className="text-xs text-gray-600">投影</div>
                                    <select
                                      value={schedule.assignments.service1.projector || 'null'}
                                      onChange={(e) => updateAssignment(schedule.id, 'service1', 'projector', e.target.value)}
                                      className="w-full text-xs p-1 border border-gray-300 rounded"
                                    >
                                      <option value="null">-</option>
                                      {people.filter(p => p.roles.includes('投影手') && !p.excludeDates.includes(schedule.date)).map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                  
                                  <div>
                                    <div className="text-xs text-gray-600">音控</div>
                                    <select
                                      value={schedule.assignments.service1.sound || 'null'}
                                      onChange={(e) => updateAssignment(schedule.id, 'service1', 'sound', e.target.value)}
                                      className="w-full text-xs p-1 border border-gray-300 rounded"
                                    >
                                      <option value="null">-</option>
                                      {people.filter(p => p.roles.includes('音控手') && !p.excludeDates.includes(schedule.date)).map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                  
                                  <label className="flex items-center gap-1 text-xs cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={schedule.isJoint}
                                      onChange={() => toggleJoint(schedule.id)}
                                      className="w-3 h-3"
                                    />
                                    <span>聯合</span>
                                  </label>
                                </div>
                              </td>
                            ))}
                          </tr>
                          
                          {monthSchedules.some(s => !s.isJoint) && (
                            <tr>
                              {monthSchedules.map(schedule => (
                                <td key={schedule.id} className="border border-gray-300 p-2 align-top bg-green-50">
                                  {!schedule.isJoint ? (
                                    <div className="space-y-2">
                                      <div className="text-xs font-semibold text-green-900 mb-1">第二堂</div>
                                      
                                      <div>
                                        <div className="text-xs text-gray-600">投影</div>
                                        <select
                                          value={schedule.assignments.service2.projector || 'null'}
                                          onChange={(e) => updateAssignment(schedule.id, 'service2', 'projector', e.target.value)}
                                          className="w-full text-xs p-1 border border-gray-300 rounded"
                                        >
                                          <option value="null">-</option>
                                          {people.filter(p => p.roles.includes('投影手') && !p.excludeDates.includes(schedule.date)).map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                          ))}
                                        </select>
                                      </div>
                                      
                                      <div>
                                        <div className="text-xs text-gray-600">音控</div>
                                        <select
                                          value={schedule.assignments.service2.sound || 'null'}
                                          onChange={(e) => updateAssignment(schedule.id, 'service2', 'sound', e.target.value)}
                                          className="w-full text-xs p-1 border border-gray-300 rounded"
                                        >
                                          <option value="null">-</option>
                                          {people.filter(p => p.roles.includes('音控手') && !p.excludeDates.includes(schedule.date)).map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="h-full bg-gray-100"></div>
                                  )}
                                </td>
                              ))}
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChurchScheduleSystem;