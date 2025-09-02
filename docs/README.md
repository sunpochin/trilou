# 📚 Trello Clone 技術文件

這個資料夾包含 Trello Clone 專案的詳細技術文件。

## 📖 文件目錄

### 🏗️ 架構與設計
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - 完整的技術架構說明
  - Repository Pattern 詳細解釋（十歲小朋友版本）
  - Event Bus vs defineEventHandler 的差異
  - 實際程式碼範例和最佳實務

### 🔧 開發相關
- **[firefox-compatibility.md](./firefox-compatibility.md)** - Firefox 手機版相容性問題
  - 🦊 寬度計算差異的原因和解決方案
  - 十歲小朋友版本的技術解釋
  - 設計哲學：簡單 vs 完美

### 🧪 測試
- **[testing.md](./testing.md)** - 測試策略和設定
  - 單元測試、整合測試設定
  - 測試最佳實務

### 🤖 AI 整合
- **[mcp-server-prompt-example.md](./mcp-server-prompt-example.md)** - MCP Server 設定範例
  - AI 任務分解的 Prompt 範例
  - 狀態標籤分配邏輯

## 🎯 使用指南

### 新手開發者
1. 先讀 [ARCHITECTURE.md](./ARCHITECTURE.md) 了解整體架構
2. 查看 [firefox-compatibility.md](./firefox-compatibility.md) 了解跨瀏覽器相容性
3. 參考 [testing.md](./testing.md) 設定開發環境

### 進階開發者
- 直接查看特定主題的文件
- 參考架構文件中的設計模式部分
- 查看最佳實務範例

## 🔄 文件更新原則

當你修改專案時：
1. **新功能** → 更新 ARCHITECTURE.md
2. **跨瀏覽器問題** → 更新 firefox-compatibility.md
3. **測試變更** → 更新 testing.md
4. **AI 功能** → 更新 mcp-server-prompt-example.md

## 📝 文件風格指南

我們使用「十歲小朋友也能懂」的解釋風格：
- ✅ 用簡單比喻（外送員 = Repository）
- ✅ 用 emoji 增加可讀性
- ✅ 提供具體的程式碼範例
- ✅ 說明「為什麼」而不只是「怎麼做」

## 🤝 貢獻文件

歡迎改進文件！請確保：
- 保持簡單易懂的語言
- 提供實際範例
- 更新相關的目錄和連結