# Trilou - 整合 MCP server 的 Trello clone

Demo: https://trilou.vercel.app/

[![Demo](https://img.shields.io/badge/Demo-Live-success)](https://trilou.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Built with Nuxt](https://img.shields.io/badge/Built%20with-Nuxt%203-00C58E.svg)](https://nuxt.com/)

## 🎮 功能亮點

### 核心看板功能

- **多列表管理**：建立、編輯、刪除和重新排序列表
- **卡片操作**：完整的增刪改查操作，具備樂觀更新
- **拖放功能**：列表內順暢重排和跨列表移動
- **即時更新**：立即的 UI 回饋，具備錯誤回滾機制

### AI 驅動的任務生成

- **MCP 伺服器整合**：連接 AI 服務進行任務生成
- **智慧狀態映射**：自動優先級和狀態分配
- **批量任務建立**：一次生成多個相關任務
- **描述支援**：來自 AI 的豐富任務描述

### 驗證系統

- **Google OAuth**：快速社交登入
- **Magic Email 連結**：無密碼驗證
- **會話管理**：安全的使用者會話處理
- **自動更新**：無縫的 token 管理

### 進階架構

- **樂觀 UI**：即時使用者回饋，具備智慧錯誤處理
- **依賴反轉**：關注點的清晰分離
- **Repository 模式**：抽象化的資料存取
- **事件驅動**：鬆散耦合的元件通訊

## 🏗️ 架構原則

### SOLID 原則實作

- **S - 單一職責**：每個元件都有一個明確的目的
- **O - 開放封閉**：易於擴展而無需修改現有程式碼
- **L - 里氏替換**：介面可以適當地替換
- **I - 介面隔離**：小而專注的介面
- **D - 依賴反轉**：依賴抽象而非具體實作

### 設計模式

- **Repository Pattern**：`repositories/` - 資料存取抽象化
- **Builder Pattern**：`builders/` - 複雜物件建立
- **Strategy Pattern**：`validators/` - 靈活的驗證
- **Observer Pattern**：`events/` - 事件驅動通訊
- **Factory Pattern**：`factories/` - 一致的實體建立

## 📊 資料庫架構

### 核心資料表

- **users**：使用者資料和身份驗證
- **lists**：看板列表與位置資訊
- **cards**：任務卡片與豐富的元資料

### 主要特色

- **UUID 主鍵**：安全、分散式友善的識別碼
- **軟性定位**：基於整數的排序，便於流暢重排
- **豐富元資料**：支援描述、到期日和狀態
- **使用者隔離**：多租戶支援的行級安全性

## 📚 技術文件

完整的技術文件請參考：**[docs/](./docs/)** 資料夾

### 快速導覽
- **[架構說明](./docs/ARCHITECTURE.md)** - Repository Pattern、Event Bus 等核心概念
- **[Firefox 相容性](./docs/firefox-compatibility.md)** - 跨瀏覽器寬度計算問題解決方案
- **[測試指南](./docs/testing.md)** - 測試策略和設定
- **[AI 整合](./docs/mcp-server-prompt-example.md)** - MCP Server 設定範例

## 🔧 開發指南

### 程式碼風格

- **TypeScript 優先**：所有新程式碼必須適當的型別化
- **中文註解**：業務邏輯註解使用中文，便於團隊理解
- **路徑別名**：使用 `@/` 進行乾淨的匯入
- **Composition API**：所有元件使用 Vue 3 composition API

### 快速開始

```bash
# 安裝依賴
yarn install

# 開發模式
yarn dev

# 建置專案
yarn build
```

---

**開發時間**：2025年8月