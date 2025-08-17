/**
 * 🧱 Builder Pattern = 樂高積木說明書
 * 
 * 🤔 想像你要蓋一個樂高城堡：
 * 
 * ❌ 沒有說明書的世界：
 * - 一次要記住所有零件要放哪裡
 * - 容易搞混順序，蓋出奇怪的東西
 * - 參數太多：buildCastle(紅磚, 藍磚, 門, 窗, 旗子, 護城河...)
 * 
 * ✅ 有說明書的世界：
 * - 一步一步來：先放地基 → 蓋牆壁 → 放屋頂 → 插旗子
 * - 每一步都很清楚，不會搞錯
 * - 想要不一樣的城堡？調整某幾個步驟就好
 * 
 * 🎯 這個檔案就是「通知的說明書」：
 * - 一步步建立通知：設標題 → 設訊息 → 設顏色 → 設時間
 * - 想要成功通知？用綠色、3秒消失
 * - 想要錯誤通知？用紅色、5秒消失
 * 
 * 📝 使用方式：
 * NotificationBuilder
 *   .success('卡片新增成功')  // 設定成功樣式
 *   .setDuration(3000)       // 3秒後消失
 *   .build()                 // 完成！
 * 
 * 💡 簡單說：複雜的東西一步步組裝，不要一次塞一堆參數
 */

type NotificationType = 'success' | 'error' | 'warning' | 'info'

interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  duration: number
  timestamp: Date
  actions?: Array<{
    label: string
    action: () => void
  }>
}

export class NotificationBuilder {
  private notification: Partial<Notification> = {
    id: this.generateId(),
    type: 'info',
    duration: 5000,
    timestamp: new Date()
  }

  setTitle(title: string): NotificationBuilder {
    this.notification.title = title
    return this
  }

  setMessage(message: string): NotificationBuilder {
    this.notification.message = message
    return this
  }

  setType(type: NotificationType): NotificationBuilder {
    this.notification.type = type
    return this
  }

  setDuration(duration: number): NotificationBuilder {
    this.notification.duration = duration
    return this
  }

  addAction(label: string, action: () => void): NotificationBuilder {
    if (!this.notification.actions) {
      this.notification.actions = []
    }
    this.notification.actions.push({ label, action })
    return this
  }

  // 快速建立常用類型的通知
  static success(message: string): NotificationBuilder {
    return new NotificationBuilder()
      .setType('success')
      .setTitle('操作成功')
      .setMessage(message)
      .setDuration(3000)
  }

  static error(message: string): NotificationBuilder {
    return new NotificationBuilder()
      .setType('error')
      .setTitle('操作失敗')
      .setMessage(message)
      .setDuration(5000)
  }

  build(): Notification {
    if (!this.notification.title || !this.notification.message) {
      throw new Error('通知必須包含標題和訊息')
    }
    return this.notification as Notification
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
}