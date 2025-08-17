/**
 * 🎮 useListActions = 遊戲控制器
 * 
 * 🤔 想像你在玩電視遊戲：
 * 
 * ❌ 沒有控制器的世界：
 * - 你要直接伸手進電視裡移動角色（組件直接操作 store）
 * - 每個遊戲的操作方式都不一樣，很難學
 * - 要換新遊戲，要重新學所有操作
 * 
 * ✅ 有控制器的世界：
 * - 按 A 鍵就是跳，按 B 鍵就是攻擊
 * - 不管玩什麼遊戲，控制器都一樣
 * - 遊戲內部怎麼動？你不用知道，按按鈕就對了
 * 
 * 🎯 這個檔案就是「列表操作的控制器」：
 * - 組件想新增卡片？按 addCard() 按鈕
 * - 組件想刪除列表？按 deleteList() 按鈕  
 * - 底層怎麼跟 API 溝通？組件不用知道
 * 
 * 🔧 現在還加上了「超級功能」：
 * - 自動檢查輸入是否正確（用 Validator）
 * - 自動顯示漂亮的通知（用 NotificationBuilder）
 * - 自動廣播消息給其他組件（用 EventBus）
 * 
 * 💡 簡單說：讓組件只要按按鈕，不用管底層怎麼運作
 */
import { useBoardStore } from '@/stores/boardStore'

// 引入新的 design patterns
import { Validator } from '@/validators/ValidationStrategy'
import { NotificationBuilder } from '@/builders/NotificationBuilder'
import { eventBus } from '@/events/EventBus'

export const useListActions = () => {
  const boardStore = useBoardStore()

  // 新增卡片功能 - 使用 Strategy Pattern 驗證
  const addCard = async (listId: string) => {
    const cardTitle = prompt('請輸入卡片標題：')
    
    if (!cardTitle) return
    
    // 使用驗證策略
    const validation = Validator.validateCardTitle(cardTitle)
    if (!validation.isValid) {
      // 使用建造者模式建立錯誤通知
      const notification = NotificationBuilder
        .error(`卡片標題不符合規範：${validation.errors.join(', ')}`)
        .build()
      
      showNotification(notification)
      return
    }

    try {
      await boardStore.addCard(listId, cardTitle.trim())
      
      // 發布事件通知其他組件
      eventBus.emit('card:created', {
        cardId: 'temp-id', // 實際應該從 API 回應取得
        listId,
        title: cardTitle.trim()
      })

      // 顯示成功通知
      const successNotification = NotificationBuilder
        .success('卡片已成功新增')
        .build()
      
      showNotification(successNotification)
      
    } catch (error) {
      // 統一錯誤處理
      const errorNotification = NotificationBuilder
        .error('新增卡片失敗，請稍後再試')
        .build()
      
      showNotification(errorNotification)
      
      // 發布錯誤事件
      eventBus.emit('error:occurred', {
        error: error as Error,
        context: 'addCard'
      })
    }
  }

  // 刪除列表功能 - 使用觀察者模式通知
  const deleteList = async (listId: string) => {
    if (!confirm('確定要刪除這個列表嗎？此操作無法撤銷。')) {
      return
    }

    try {
      await boardStore.removeList(listId)
      
      // 發布事件
      eventBus.emit('list:deleted', { listId })
      
      const notification = NotificationBuilder
        .success('列表已成功刪除')
        .build()
      
      showNotification(notification)
      
    } catch (error) {
      const errorNotification = NotificationBuilder
        .error('刪除列表失敗，請稍後再試')
        .build()
      
      showNotification(errorNotification)
      
      eventBus.emit('error:occurred', {
        error: error as Error,
        context: 'deleteList'
      })
    }
  }

  // 新增列表功能 - 使用驗證策略
  const addList = async () => {
    const listTitle = prompt('請輸入列表標題：')
    
    if (!listTitle) return
    
    // 驗證列表標題
    const validation = Validator.validateListTitle(listTitle)
    if (!validation.isValid) {
      const notification = NotificationBuilder
        .error(`列表標題不符合規範：${validation.errors.join(', ')}`)
        .build()
      
      showNotification(notification)
      return
    }

    try {
      await boardStore.addList(listTitle.trim())
      
      eventBus.emit('list:created', {
        listId: 'temp-id',
        title: listTitle.trim()
      })

      const notification = NotificationBuilder
        .success('列表已成功新增')
        .build()
      
      showNotification(notification)
      
    } catch (error) {
      const errorNotification = NotificationBuilder
        .error('新增列表失敗，請稍後再試')
        .build()
      
      showNotification(errorNotification)
      
      eventBus.emit('error:occurred', {
        error: error as Error,
        context: 'addList'
      })
    }
  }

  // 私有方法：顯示通知（這裡簡化實作，實際應該整合到 UI 系統）
  const showNotification = (notification: any) => {
    console.log(`[${notification.type.toUpperCase()}] ${notification.title}: ${notification.message}`)
    // 實際實作會顯示在 UI 上
  }

  return {
    addCard,
    deleteList,
    addList
  }
}