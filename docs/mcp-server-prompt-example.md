# MCP Server Prompt 建議

## 請更新你的 MCP Server 來返回豐富的狀態信息

當收到 `expand-tasks` 請求時，請分析每個任務並分配適當的狀態標籤：

### 請求格式：
```json
{
  "userInput": "準備產品發表會的所有相關工作",
  "requestStatusInfo": true,
  "statusTypes": [
    "urgent", "high-priority", "medium-priority", "low-priority",
    "due-today", "due-tomorrow", "quick-task", "complex-task",
    "research-needed", "meeting-required", "waiting-approval"
  ]
}
```

### 期望回應格式：
```json
{
  "cards": [
    {
      "title": "準備產品展示簡報",
      "description": "製作包含產品功能、市場定位和競爭優勢的簡報",
      "status": "high-priority"
    },
    {
      "title": "確認會場和設備",
      "description": "聯繫場地供應商，確認投影設備、音響和網路",
      "status": "urgent"
    },
    {
      "title": "研究競爭對手最新動態",
      "description": "收集並分析主要競爭對手的產品資訊",
      "status": "research-needed"
    },
    {
      "title": "設計邀請函",
      "description": "製作吸引人的邀請函設計",
      "status": "quick-task"
    },
    {
      "title": "安排與行銷團隊會議",
      "description": "討論宣傳策略和媒體聯繫計畫",
      "status": "meeting-required"
    },
    {
      "title": "申請場地使用許可",
      "description": "向相關單位申請活動許可證",
      "status": "waiting-approval"
    }
  ]
}
```

### 狀態分配邏輯建議：

#### 優先級相關：
- `urgent` 🔥：必須立即處理，影響關鍵路徑
- `high-priority` ⚡：重要且緊急，需要優先安排
- `medium-priority` 📋：一般重要性，正常安排
- `low-priority` 📝：可以延後處理

#### 時間相關：
- `due-today` ⏰：今天必須完成
- `due-tomorrow` 📅：明天截止
- `overdue` 🚨：已經過期的任務

#### 難度相關：
- `quick-task` ⚡：15-30分鐘可以完成
- `complex-task` 🧠：需要深度思考和規劃
- `research-needed` 🔍：需要資料收集和研究

#### 依賴關係：
- `waiting-approval` 👑：需要上級批准
- `waiting-others` 👥：等待他人完成
- `prerequisites` 📌：有前置條件

#### 特殊狀態：
- `meeting-required` 🤝：需要開會討論
- `external-dependency` 🌐：依賴外部資源
- `one-time` 🎯：一次性任務
- `recurring` 🔄：重複性任務

### OpenAI Prompt 範例：

```
你是一個專業的任務管理助理。當用戶描述一個項目或目標時，請將其分解為具體的可執行任務，並為每個任務分配適當的狀態標籤。

請根據以下標準分配狀態：
- 考慮任務的緊急程度（urgent, high-priority, medium-priority, low-priority）
- 考慮完成難度（quick-task, complex-task, research-needed）
- 考慮是否需要協作（meeting-required, waiting-approval, waiting-others）
- 考慮時間限制（due-today, due-tomorrow）

回應格式必須是 JSON，包含 cards 陣列，每個任務包含 title, description, status 欄位。

用戶輸入：{userInput}
```