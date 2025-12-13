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

### 1.3 特殊配對規則
- **陳俊亨** (音控手) 和 **郭嘉玲** (投影手) 必須配對
- 配對條件：
  - 兩人必須在同一天
  - 兩人必須都分配到第一堂（無論是聯合或分堂）
  - 如果其中任何一人在該日期無法服事，則取消配對，分別分配

---

## 2. 自動排班邏輯 (`autoAssign`)

### 2.1 聯合排班 (`isJoint = true`)

```
檢查陳俊亨和郭嘉玲是否都可在該日期服事
  ↓
YES → 強制配對分配到第一堂
      service1: { projector: 郭嘉玲, sound: 陳俊亨 }
      service2: { projector: null, sound: null }
  ↓
NO  → 正常分配（隨機選擇）
      1. 選擇投影手（service1，排除第二堂工作人員）
      2. 選擇音控手（service1，排除已選的投影手和第二堂工作人員）
      service1: { projector: 隨機投影手, sound: 隨機音控手 }
      service2: { projector: null, sound: null }
```

### 2.2 分堂排班 (`isJoint = false`)

```
檢查陳俊亨和郭嘉玲是否都可在該日期服事
  ↓
YES → 強制配對分配到第一堂，第二堂獨立分配
      service1: { projector: 郭嘉玲, sound: 陳俊亨 }
      service2:
        1. 選擇投影手（排除第一堂工作人員和service1已分配的人）
        2. 選擇音控手（排除第一堂工作人員和已分配的人）
  ↓
NO  → 正常分配（隨機選擇）
      service1:
        1. 選擇投影手（排除第二堂工作人員）
        2. 選擇音控手（排除第二堂工作人員和service1投影手）
      service2:
        1. 選擇投影手（排除第一堂工作人員和service1已分配的人）
        2. 選擇音控手（排除第一堂工作人員和已分配的人）
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
符合條件的人員中，**隨機選擇一人**

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
| 陳+郭必須配對 | ✅ 強制 | ⚠️ 提示（下拉選單會顯示） | 同一天、同一堂 |
| 第一堂限制 | ✅ 檢查 | ✅ 下拉過濾 | 排除第二堂工作人員 |
| 第二堂限制 | ✅ 檢查 | ✅ 下拉過濾 | 排除第一堂工作人員 |
| 排除日期 | ✅ 檢查 | ✅ 下拉過濾 | 不可服事的日期 |
| 不重複分配 | ✅ 檢查 | ⚠️ 允許（需人工控制） | 同一堂不能有兩個角色 |

---

## 7. 常見情況處理

### 情況A：陳俊亨和郭嘉玲都可在2025-12-20服事
**結果**：自動排班時，無論聯合或分堂，都會在第一堂分配他們
```
service1: { projector: 郭嘉玲, sound: 陳俊亨 }
```

### 情況B：陳俊亨在2025-12-20有排除日期，郭嘉玲可服事
**結果**：自動排班不強制配對，各自分配
```
service1: { projector: 隨機投影手, sound: 隨機音控手 }
// 郭嘉玲可能被分配，也可能不被分配（取決於隨機選擇）
```

### 情況C：用戶手動選擇 Service1 投影手
**下拉選單只會顯示**：
- 擁有 `投影手` 角色的人
- 不在該日期排除列表的人
- **不包含** 只有 `第二堂工作人員` 角色的人

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
結果：符合條件的人員列表
  ↓
隨機選擇：Math.random() 一人
```

---

## 9. 新增需求或修改指南

如需修改排班邏輯，請檢查以下位置：

| 功能 | 檔案位置 | 函數 |
|------|---------|------|
| 自動排班核心邏輯 | `index.html` | `autoAssign()` (行 274-365) |
| 人員篩選 | `index.html` | `getAvailablePerson()` (行 253-271) |
| Service1 投影手下拉 | `index.html` | 行 ~1135-1147 |
| Service1 音控手下拉 | `index.html` | 行 ~1150-1162 |
| Service2 投影手下拉 | `index.html` | 行 ~1185-1197 |
| Service2 音控手下拉 | `index.html` | 行 ~1200-1212 |
| 陳+郭配對檢查 | `index.html` | `autoAssign()` 內部 (行 285-330) |

---

**最後更新**：2025-12-13
