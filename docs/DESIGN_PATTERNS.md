# 設計模式與架構說明

## Design Patterns 應用

為了實現「高內聚低耦合」的架構，專案中應用了多種設計模式：

### **Repository Pattern (倉庫模式)**
- **位置**: `repositories/CardRepository.ts`
- **目的**: 統一資料存取邏輯，隔離 API 實作細節
- **好處**: 要換 API 只需修改 Repository，組件完全不受影響

### **Builder Pattern (建造者模式)**
- **位置**: `builders/NotificationBuilder.ts`
- **目的**: 建立複雜的通知物件，提供流暢的 API
- **使用**: `NotificationBuilder.success('操作成功').setDuration(3000).build()`

### **Strategy Pattern (策略模式)**
- **位置**: `validators/ValidationStrategy.ts`
- **目的**: 分離不同的驗證邏輯，易於擴展和測試
- **好處**: 新增驗證規則不影響現有程式碼

### **Observer Pattern (觀察者模式)**
- **位置**: `events/EventBus.ts`
- **目的**: 組件間鬆散耦合的事件通訊
- **使用**: `eventBus.emit('card:created', data)` / `eventBus.on('card:created', callback)`

### **Factory Pattern (工廠模式)**
- **位置**: `factories/EntityFactory.ts`
- **目的**: 統一實體建立邏輯，確保資料一致性
- **好處**: 集中管理 ID 生成、預設值設定等邏輯

## 🏠 高內聚低耦合的十歲小朋友解釋

### **🔗 高內聚 = 房間裡的東西很相關**
- 廚房裡放的都是煮飯用具（鍋子、盤子、爐子）
- 浴室裡放的都是洗澡用具（毛巾、肥皂、牙刷）
- 不會在廚房裡放床，也不會在浴室裡放電視

### **🔗 低耦合 = 房間之間不會互相干擾**
- 裝修廚房不會影響到浴室
- 浴室壞了也不會讓廚房不能用
- 每個房間都可以獨立運作

### **🎯 在我們專案中的實現：**
- **高內聚**:
  - 驗證檔案只處理檢查邏輯
  - 通知檔案只處理訊息顯示
  - 工廠檔案只處理物件建立
- **低耦合**:
  - 組件不直接跟 API 講話（透過 Repository）
  - 組件之間不直接溝通（透過 EventBus）
  - 複雜邏輯不寫在組件裡（透過 Composables）

### **💡 簡單記憶法：**
- 高內聚 = 相關的東西放一起
- 低耦合 = 不相關的東西分開住