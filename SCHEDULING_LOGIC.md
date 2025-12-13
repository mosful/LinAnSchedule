# 教會排班系統邏輯說明

## 1. 核心概念

### 1.1 排班類型
- **聯合 (Joint)**：只有第一堂，第二堂為空
- **分堂 (Non-Joint)**：有第一堂和第二堂兩個禮拜

### 1.2 服事角色
- **投影手** (`投影手`)：負責投影機操作
- **音控手** (`音控手`)：負責音響控制
- **第一堂工作人員** (`第一堂工作人員`)：只能在第一堂服事
- **第二堂工作人員** (`第二堂工作人員`)：只能在第二堂服事

### 1.3 輪流分配機制 ✨ (新增)
- **核心原則**：優先分配給最久沒有被分配過的人
- **目的**：確保每位同工都有公平的服事機會，而不是總是同一批人
- **運作方式**：
  1. 檢查現有排班記錄
  2. 計算每位同工的「最後被分配日期」
  3. 優先選擇最久沒被分配的人（或從未被分配過的人）

---

## 2. 自動排班邏輯 (`autoAssign`) - 輪流分配版本

### 2.1 聯合排班 (`isJoint = true`)

```
選擇投影手（service1，排除第二堂工作人員）
  ↓ 優先分配給最久沒被分配的人
選擇投影手
  ↓
選擇音控手（service1，排除已選的投影手和第二堂工作人員）
  ↓ 優先分配給最久沒被分配的人（除投影手外）
選擇音控手
  ↓
結果：
service1: { projector: 投影手, sound: 音控手 }
service2: { projector: null, sound: null }
```

### 2.2 分堂排班 (`isJoint = false`)

```
【第一堂】
選擇投影手（排除第二堂工作人員）
  ↓ 優先分配給最久沒被分配的人
選擇投影手
  ↓
選擇音控手（排除第二堂工作人員和service1投影手）
  ↓ 優先分配給最久沒被分配的人（除投影手外）
選擇音控手
  ↓
【第二堂】
選擇投影手（排除第一堂工作人員和service1已分配的人）
  ↓ 優先分配給最久沒被分配的人
選擇投影手
  ↓
選擇音控手（排除第一堂工作人員和已分配的人）
  ↓ 優先分配給最久沒被分配的人
選擇音控手
  ↓
結果：
service1: { projector: 投影手1, sound: 音控手1 }
service2: { projector: 投影手2, sound: 音控手2 }
```

---

## 3. 人員篩選邏輯 (`getAvailablePerson`)

### 3.1 篩選條件

```javascript
function getAvailablePerson(role, date, excludeIds, service)
```

**必須滿足所有條件：**
1. ✅ 具有指定角色（例如：`投影手` 或 `音控手`）
2. ✅ 未被列入該日期的「不可服事日期」
3. ✅ 不在排除名單 (`excludeIds`) 中
4. ✅ **Service 限制** （新增）：
   - 如果分配到 `service1`，則排除標記為 `第二堂工作人員` 的人
   - 如果分配到 `service2`，則排除標記為 `第一堂工作人員` 的人

### 3.2 選擇方式
符合條件的人員中，**按最後被分配日期排序**，優先選擇**最久沒被分配的人**
- 從未被分配過 → 優先級最高
- 最後被分配在很久以前 → 優先級次高
- 最近剛被分配 → 優先級最低

---

## 4. 手動選擇邏輯（下拉選單）

### 4.1 Service1 投影手下拉選單

```javascript
people.filter(p => {
  if (!p.roles.includes('投影手')) return false;           // 必須是投影手
  if (p.excludeDates?.includes(date)) return false;       // 不在排除日期
  if (p.roles.includes('第二堂工作人員')) return false;    // 排除第二堂專用人員
  return true;
})
```

### 4.2 Service1 音控手下拉選單

```javascript
people.filter(p => {
  if (!p.roles.includes('音控手')) return false;           // 必須是音控手
  if (p.excludeDates?.includes(date)) return false;       // 不在排除日期
  if (p.roles.includes('第二堂工作人員')) return false;    // 排除第二堂專用人員
  return true;
})
```

### 4.3 Service2 投影手下拉選單

```javascript
people.filter(p => {
  if (!p.roles.includes('投影手')) return false;           // 必須是投影手
  if (p.excludeDates?.includes(date)) return false;       // 不在排除日期
  if (p.roles.includes('第一堂工作人員')) return false;    // 排除第一堂專用人員
  return true;
})
```

### 4.4 Service2 音控手下拉選單

```javascript
people.filter(p => {
  if (!p.roles.includes('音控手')) return false;           // 必須是音控手
  if (p.excludeDates?.includes(date)) return false;       // 不在排除日期
  if (p.roles.includes('第一堂工作人員')) return false;    // 排除第一堂專用人員
  return true;
})
```

---

## 5. 人員角色配置範例

### 郭嘉玲 (投影手)
```
roles: ['第一堂工作人員', '投影手']
excludeDates: []
```
**說明**：可以在第一堂服事，擁有投影手技能

### 陳俊亨 (音控手)
```
roles: ['第一堂工作人員', '音控手']
excludeDates: []
```
**說明**：可以在第一堂服事，擁有音控手技能

### 蔡依錠 (第二堂專用)
```
roles: ['第二堂工作人員', '投影手']
excludeDates: []
```
**說明**：只能在第二堂服事，擁有投影手技能

### 馮小鳳 (通用)
```
roles: ['投影手', '音控手']
excludeDates: ['2025-12-20']  // 這一天無法服事
```
**說明**：兩堂都可服事（無服事堂限制），但12月20日不可

---

## 6. 業務規則總結

| 規則 | 自動排班 | 手動選擇 | 說明 |
|------|---------|---------|------|
| 輪流分配 | ✅ 優先最久沒被分配 | ⚠️ 不適用（手動自由選擇） | 自動排班時公平輪流 |
| 第一堂限制 | ✅ 檢查 | ✅ 下拉過濾 | 排除第二堂工作人員 |
| 第二堂限制 | ✅ 檢查 | ✅ 下拉過濾 | 排除第一堂工作人員 |
| 排除日期 | ✅ 檢查 | ✅ 下拉過濾 | 不可服事的日期 |
| 不重複分配 | ✅ 檢查 | ⚠️ 允許（需人工控制） | 同一堂不能有兩個角色 |

---

## 7. 常見情況處理

### 情況A：首次自動排班（無前期排班記錄）
**結果**：所有人的「最後被分配日期」都是 1900-01-01，系統將隨機選擇其中一人（因為都是同樣古老的日期）
```
例：第一次排班時，可能分配任何符合條件的人
```

### 情況B：已有多週排班記錄
**結果**：優先 最久沒有被分配過的人
```
假設：
- 上週：林建良和馮小鳳被分配 (2025-12-06)
- 本週：應優先分配 陳俊亨、陳信明、謝欣樺 等未出現過的人
- 即使 林建良 符合條件，也會被排到後面
```

### 情況C：用戶手動選擇 Service1 投影手
**下拉選單顯示**：所有符合條件的投影手（無排序）
```
因為手動選擇，系統不干涉用戶的決定
```

### 情況D：聯合排班自動分配
**第二堂必定為空**：`{ projector: null, sound: null }`

---

## 8. 技術實現細節

### 資料結構
```javascript
// 排班記錄
{
  id: "...",
  date: "2025-12-20",
  isJoint: true,  // true=聯合, false=分堂
  assignments: {
    service1: { 
      projector: "personId1",  // 郭嘉玲的ID
      sound: "personId2"        // 陳俊亨的ID
    },
    service2: { 
      projector: null,
      sound: null
    }
  }
}

// 人員記錄
{
  id: "uniqueId",
  name: "郭嘉玲",
  roles: ['第一堂工作人員', '投影手'],
  excludeDates: ['2025-12-25']
}
```

### 篩選流程圖
```
輸入：role, date, excludeIds, service
  ↓
過濾1: 檢查角色 (role.includes())
  ↓
過濾2: 檢查排除日期 (excludeDates.includes())
  ↓
過濾3: 檢查排除人員 (excludeIds.includes())
  ↓
過濾4: 檢查服事堂次限制
  - service1 → 排除第二堂工作人員
  - service2 → 排除第一堂工作人員
  ↓
【輪流分配邏輯】
計算每人最後被分配日期
  ↓
按最後被分配日期排序（最早的優先）
  ↓
結果：符合條件且最久沒被分配的人
  ↓
選擇：取列表中第一人（最久沒被分配）
```

---

## 9. 新增需求或修改指南

如需修改排班邏輯，請檢查以下位置：

| 功能 | 檔案位置 | 函數 |
|------|---------|------|
| 自動排班核心邏輯 | `index.html` | `autoAssign()` (行 293-320) |
| 輪流分配機制 | `index.html` | `getLastAssignmentDate()` (行 254-268) |
| 人員篩選 | `index.html` | `getAvailablePerson()` (行 270-296) |
| Service1 投影手下拉 | `index.html` | 行 ~1135-1147 |
| Service1 音控手下拉 | `index.html` | 行 ~1150-1162 |
| Service2 投影手下拉 | `index.html` | 行 ~1185-1197 |
| Service2 音控手下拉 | `index.html` | 行 ~1200-1212 |
| 陳+郭配對檢查 | `index.html` | `autoAssign()` 內部 (行 285-330) |

---

**最後更新**：2025-12-13
**版本**：2.0 - 輪流分配機制版本

### 版本歷史
- v1.0 (2025-12-13 早期)：強制配對陳俊亨和郭嘉玲
- v2.0 (2025-12-13 當前)：實現輪流分配，公平分配給每位同工
