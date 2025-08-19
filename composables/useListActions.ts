/**
 * 🎮 useListActions = 遊戲控制器 (列表操作專用 Composable)
 * 
 * 🎯 這個檔案負責什麼？
 * - 封裝所有列表相關的操作邏輯（新增、刪除列表）
 * - 處理用戶互動（確認對話框、輸入提示）
 * - 整合通知系統和事件發布
 * - 錯誤處理和狀態管理
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
 * 📋 主要功能：
 * 1. deleteList() - 刪除列表（含確認對話框）
 * 2. addList() - 新增列表（含輸入驗證）
 * 3. 統一的錯誤處理和通知系統
 * 4. 事件發布機制（Observer Pattern）
 * 
 * 🔄 呼叫流程：
 * Component → useListActions → boardStore → API → Supabase
 * 
 * 💡 設計模式應用：
 * - Strategy Pattern: ValidationStrategy 驗證輸入
 * - Builder Pattern: NotificationBuilder 建立通知
 * - Observer Pattern: EventBus 事件通訊
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
    console.log('🗑️ [COMPOSABLE] deleteList 被呼叫，參數:', { listId })
    
    // 顯示確認對話框
    console.log('💬 [COMPOSABLE] 顯示刪除確認對話框...')
    if (!confirm('確定要刪除這個列表嗎？此操作無法撤銷。')) {
      console.log('❌ [COMPOSABLE] 用戶取消刪除操作')
      return
    }
    
    console.log('✅ [COMPOSABLE] 用戶確認刪除，開始執行刪除流程...')

    try {
      console.log('📤 [COMPOSABLE] 呼叫 boardStore.removeList()...')
      await boardStore.removeList(listId)
      console.log('✅ [COMPOSABLE] boardStore.removeList() 執行成功')
      
      // 發布事件
      console.log('📢 [COMPOSABLE] 發布 list:deleted 事件...')
      eventBus.emit('list:deleted', { listId })
      
      console.log('🎉 [COMPOSABLE] 建立成功通知...')
      const notification = NotificationBuilder
        .success('列表已成功刪除')
        .build()
      
      console.log('📱 [COMPOSABLE] 顯示成功通知:', notification)
      showNotification(notification)
      
      console.log('✅ [COMPOSABLE] 列表刪除流程完成')
      
    } catch (error) {
      console.error('❌ [COMPOSABLE] 刪除列表過程中發生錯誤:')
      console.error('  🔍 錯誤類型:', typeof error)
      console.error('  🔍 錯誤內容:', error)
      
      if (error && typeof error === 'object') {
        console.error('  🔍 錯誤詳情:', {
          message: (error as any).message,
          statusCode: (error as any).statusCode,
          statusMessage: (error as any).statusMessage,
          data: (error as any).data
        })
      }
      
      console.log('🚨 [COMPOSABLE] 建立錯誤通知...')
      const errorNotification = NotificationBuilder
        .error('刪除列表失敗，請稍後再試')
        .build()
      
      console.log('📱 [COMPOSABLE] 顯示錯誤通知:', errorNotification)
      showNotification(errorNotification)
      
      console.log('📢 [COMPOSABLE] 發布 error:occurred 事件...')
      eventBus.emit('error:occurred', {
        error: error as Error,
        context: 'deleteList'
      })
      
      console.log('💥 [COMPOSABLE] 錯誤處理完成')
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