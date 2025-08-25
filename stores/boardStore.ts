// 看板狀態管理 Store
import type { CardUI, ListUI, BoardUI } from '@/types'
import { cardRepository } from '@/repositories/CardRepository'
import { listRepository } from '@/repositories/ListRepository'

// 使用統一的型別定義
type Card = CardUI
type List = ListUI  
type Board = BoardUI

// 匯出看板狀態管理 Store
export const useBoardStore = defineStore('board', {
  // 定義 Store 的狀態
  state: (): { board: Board; isLoading: boolean; openMenuId: string | null; pendingAiCards: number; isCreatingDefaultLists: boolean } => ({
    board: {
      id: 'board-1',
      title: 'My Board',
      // 初始列表為空，將從 API 獲取
      lists: []
    },
    // 載入狀態，用於顯示 loading spinner
    isLoading: false,
    // 目前開啟的選單 ID，同時只能有一個選單開啟
    openMenuId: null,
    // 目前正在生成中的 AI 卡片數量（用於顯示 countdown）
    pendingAiCards: 0,
    // 防止重複建立預設列表的標記
    isCreatingDefaultLists: false
  }),
  // Getters: 計算派生狀態
  getters: {
    // 動態計算下一個可用的卡片 ID
    // 用於生成新卡片的唯一識別碼
    nextCardId: (state) => {
      let maxId = 0
      // 遍歷所有列表的所有卡片，找出最大的數字 ID
      for (const list of state.board.lists) {
        for (const card of list.cards) {
          // 提取 card-X 中的數字部分
          const match = card.id.match(/^card-(\d+)$/)
          if (match) {
            const cardNum = parseInt(match[1], 10)
            if (cardNum > maxId) {
              maxId = cardNum
            }
          }
        }
      }
      return maxId + 1
    },

    // 動態計算下一個可用的列表 ID
    // 用於生成新列表的唯一識別碼
    nextListId: (state) => {
      let maxId = 0
      // 遍歷所有列表，找出最大的數字 ID
      for (const list of state.board.lists) {
        // 提取 list-X 中的數字部分
        const match = list.id.match(/^list-(\d+)$/)
        if (match) {
          const listNum = parseInt(match[1], 10)
          if (listNum > maxId) {
            maxId = listNum
          }
        }
      }
      return maxId + 1
    }
  },
  // Actions: 定義可以修改狀態的操作
  actions: {
    // 🔙 恢復穩定的分開查詢 - 簡單可靠的資料獲取
    // 使用分開的 API 調用，確保排序邏輯正確且易於除錯
    async fetchBoard() {
      // 🔒 防止重複呼叫：如果已經在載入中，直接返回
      if (this.isLoading) {
        console.log('⚠️ [STORE] fetchBoard 已在執行中，跳過重複呼叫')
        return
      }
      
      // 開始載入時設定 loading 狀態
      this.isLoading = true
      const startTime = Date.now()
      
      try {
        console.log('🚀 [STORE] 開始獲取看板資料...')
        
        // 為了更好地展示載入效果，添加一點延遲（僅在開發環境）
        if (import.meta.dev) {
          await new Promise(resolve => setTimeout(resolve, 800))
        }
        
        // 🎯 使用 Repository 模式：透過 Repository 層獲取資料
        const [listsResponse, cardsResponse] = await Promise.all([
          listRepository.getAllLists(),
          cardRepository.getAllCards()
        ])

        const fetchTime = Date.now() - startTime
        console.log(`⚡ [STORE] API 調用完成，耗時: ${fetchTime}ms`)

        // 建立卡片 ID 到列表 ID 的映射
        // Repository 已經轉換好格式，直接使用
        const cardsByListId: { [listId: string]: Card[] } = {}
        
        if (cardsResponse) {
          console.log(`📋 [STORE] 處理 ${cardsResponse.length} 張卡片`)
          cardsResponse.forEach((card: Card) => {
            if (!cardsByListId[card.listId]) {
              cardsByListId[card.listId] = []
            }
            cardsByListId[card.listId].push(card)
          })
          
          // 🎯 確保每個列表的卡片都按 position 排序
          Object.keys(cardsByListId).forEach(listId => {
            cardsByListId[listId].sort((a, b) => (a.position || 0) - (b.position || 0))
            console.log(`📝 [STORE] 列表 ${listId} 的卡片排序:`)
            cardsByListId[listId].forEach((card, index) => {
              console.log(`  ${index}: "${card.title}" (position: ${card.position})`)
            })
          })
        }

        // 將列表和對應的卡片組合起來
        // Repository 已經轉換好格式，但我們再次確保排序正確
        if (listsResponse) {
          console.log(`📈 [STORE] 處理 ${listsResponse.length} 個列表`)
          
          // 🎯 組合列表和卡片，並確保按 position 排序
          const listsWithCards: List[] = listsResponse.map((list: List) => ({
            ...list,
            cards: cardsByListId[list.id] || [] // 如果列表沒有卡片則使用空陣列
          }))
          
          // 🔄 按 position 排序，確保重新載入後順序一致
          // 雖然 Repository 已經排序，但為了絕對確保一致性，我們再次排序
          this.board.lists = listsWithCards.sort((a, b) => (a.position || 0) - (b.position || 0))
          
          console.log('📋 [STORE] 列表已按 position 排序:')
          this.board.lists.forEach((list, index) => {
            console.log(`  ${index}: "${list.title}" (position: ${list.position})`)
          })
          
          // 統計載入的資料
          const listsCount = this.board.lists.length
          const cardsCount = this.board.lists.reduce((total, list) => total + list.cards.length, 0)
          
          console.log('📊 [STORE] 載入統計:')
          console.log(`  📋 ${listsCount} 個列表`)
          console.log(`  🎯 ${cardsCount} 張卡片`)
          console.log(`  ⚡ 總耗時: ${Date.now() - startTime}ms`)
          
          // 🎯 檢測新用戶：如果沒有任何列表，自動建立預設列表
          // 使用 isCreatingDefaultLists 標記防止重複建立
          if (listsCount === 0 && !this.isCreatingDefaultLists) {
            console.log('👤 [STORE] 檢測到新用戶，建立預設列表...')
            this.isCreatingDefaultLists = true // 上鎖：防止重複建立
            try {
              await this.createDefaultListsForNewUser()
            } finally {
              // 使用 finally 確保無論成功或失敗都會解鎖
              this.isCreatingDefaultLists = false
            }
          } else if (listsCount === 0 && this.isCreatingDefaultLists) {
            console.log('⚠️ [STORE] 正在建立預設列表中，跳過重複建立')
          } else {
            console.log('✅ [STORE] 看板資料載入完成')
          }
        } else {
          console.warn('⚠️ [STORE] listsResponse 為空或 undefined')
          this.board.lists = []
        }
        
      } catch (error) {
        const errorTime = Date.now() - startTime
        console.error(`❌ [STORE] 獲取看板資料失敗，耗時: ${errorTime}ms`)
        console.error('  🔍 錯誤詳情:', error)
        
        // 設定預設空看板以避免 UI 錯誤
        this.board.lists = []
        
      } finally {
        // 無論成功或失敗，都要關閉 loading 狀態
        this.isLoading = false
        const totalTime = Date.now() - startTime
        console.log(`🏁 [STORE] fetchBoard 完成，總耗時: ${totalTime}ms`)
      }
    },
    // 🚀 新增列表到看板 - 使用樂觀 UI 更新
    // 
    // 🎯 樂觀 UI 更新 = 先改 UI，再打 API
    // 就像你先把新房間畫在地圖上，再問政府可不可以蓋
    // 這樣 UI 感覺超快，用戶體驗更好！
    //
    // 🔄 流程：
    // 1. 立即建立暫時列表並顯示在 UI 上
    // 2. 同時在背景呼叫 API
    // 3. API 成功：更新暫時列表為真實 ID
    // 4. API 失敗：移除暫時列表，顯示錯誤訊息
    async addList(title: string) {
      console.log('🏪 [STORE] addList 被呼叫，參數:', { title })
      
      // 🎯 步驟1：建立暫時列表（立即顯示在 UI）
      // 使用時間戳作為暫時 ID，確保唯一性
      const tempId = `temp-list-${Date.now()}-${Math.random()}`
      const optimisticList: List = {
        id: tempId,
        title: title.trim(),
        position: this.board.lists.length, // 放在最後一個位置
        cards: [] // 新列表初始沒有卡片
      }

      // 🚀 樂觀更新：立即加入本地狀態（用戶立刻看到）
      this.board.lists.push(optimisticList)
      console.log('⚡ [STORE] 樂觀更新：立即顯示暫時列表', optimisticList)
      
      try {
        // 🎯 步驟2：背景呼叫 API（用戶感受不到等待）
        console.log('📤 [STORE] 背景呼叫 API 建立真實列表...')
        const response = await $fetch('/api/lists', {
          method: 'POST',
          body: { title: title.trim() }
        })
        
        console.log('📥 [STORE] API 回應:', response)
        
        // 🎯 步驟3：成功時，用真實列表替換暫時列表
        const listIndex = this.board.lists.findIndex(list => list.id === tempId)
        if (listIndex !== -1) {
          const realList: List = {
            ...response,
            cards: [] // 新列表初始沒有卡片
          }
          this.board.lists[listIndex] = realList
          console.log('✅ [STORE] 成功：用真實列表替換暫時列表', realList)
        }
        
      } catch (error) {
        // 🎯 步驟4：失敗時，回滾樂觀更新（移除暫時列表）
        console.error('❌ [STORE] API 失敗，執行回滾...')
        const listIndex = this.board.lists.findIndex(list => list.id === tempId)
        if (listIndex !== -1) {
          this.board.lists.splice(listIndex, 1)
          console.log('🔄 [STORE] 回滾完成：已移除暫時列表')
        }
        
        // 顯示更詳細的錯誤資訊，協助除錯
        if (error && typeof error === 'object') {
          console.error('📋 [STORE] 錯誤詳情:', {
            message: (error as any).message,
            statusCode: (error as any).statusCode,
            statusMessage: (error as any).statusMessage,
            data: (error as any).data
          })
        }
        
        // 重新拋出錯誤，讓 UI 層顯示錯誤訊息
        throw error
      }
    },
    
    // 🚀 刪除指定的列表 - 使用樂觀 UI 更新
    // 
    // 🎯 樂觀 UI 更新 = 先改 UI，再打 API
    // 就像你先把房間從地圖上擦掉，再問政府可不可以拆
    // 這樣 UI 感覺超快，用戶體驗更好！
    //
    // 🔄 流程：
    // 1. 立即從 UI 移除列表（但保存備份）
    // 2. 同時在背景呼叫 API
    // 3. API 成功：完成刪除
    // 4. API 失敗：恢復列表，顯示錯誤訊息
    async removeList(listId: string) {
      console.log('🗑️ [STORE] removeList 被呼叫，參數:', { listId })
      
      // 🎯 步驟1：找到要刪除的列表並記錄完整狀態
      const listIndex = this.board.lists.findIndex(list => list.id === listId)
      if (listIndex === -1) {
        console.warn('⚠️ [STORE] 警告: 找不到要刪除的列表 ID:', listId)
        return
      }
      
      // 保存完整的列表狀態（包含位置），用於可能的回滾
      const targetList = { ...this.board.lists[listIndex] }
      const originalIndex = listIndex
      console.log('📋 [STORE] 找到要刪除的列表:', {
        id: targetList.id,
        title: targetList.title,
        cardsCount: targetList.cards.length,
        position: originalIndex
      })

      // 🚀 樂觀更新：立即從本地狀態移除（用戶立刻看到）
      this.board.lists.splice(listIndex, 1)
      console.log('⚡ [STORE] 樂觀更新：立即移除列表，剩餘列表數量:', this.board.lists.length)
      
      try {
        // 🎯 步驟2：背景呼叫 API（用戶感受不到等待）
        console.log('📤 [STORE] 背景呼叫 DELETE API 請求到:', `/api/lists/${listId}`)
        
        await $fetch(`/api/lists/${listId}`, {
          method: 'DELETE'
        })
        
        console.log('✅ [STORE] API 刪除請求成功，列表已永久刪除')
        
      } catch (error) {
        // 🎯 步驟3：失敗時，回滾樂觀更新（恢復列表）
        console.error('❌ [STORE] API 失敗，執行回滾...')
        
        // 將列表恢復到原始位置
        this.board.lists.splice(originalIndex, 0, targetList)
        console.log('🔄 [STORE] 回滾完成：已恢復列表到原始位置')
        
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
        
        // 重新拋出錯誤，讓 UI 層顯示錯誤訊息
        throw error
      }
    },
    
    // 🚀 新增卡片到指定列表 - 使用樂觀 UI 更新
    // 
    // 🎯 樂觀 UI 更新 = 先改 UI，再打 API
    // 就像你先把積木放上去，再問媽媽可不可以放
    // 這樣 UI 感覺超快，用戶體驗更好！
    //
    // 🔄 流程：
    // 1. 立即建立暫時卡片並顯示在 UI 上
    // 2. 同時在背景呼叫 API
    // 3. API 成功：更新暫時卡片為真實 ID
    // 4. API 失敗：移除暫時卡片，顯示錯誤訊息
    async addCard(listId: string, title: string, status?: string, description?: string) {
      // 🎯 步驟1：找到目標列表
      const list = this.board.lists.find(list => list.id === listId)
      if (!list) {
        console.error('❌ [STORE] 找不到指定的列表:', listId)
        throw new Error('找不到指定的列表')
      }

      // 🎯 步驟2：建立暫時卡片（立即顯示在 UI）
      // 使用時間戳作為暫時 ID，確保唯一性
      console.log('🏷️ [STORE] 建立暫時卡片，標題:', title, '列表 ID:', listId, '狀態:', status, '描述', description)
      const tempId = `temp-${Date.now()}-${Math.random()}`
      const optimisticCard: CardUI = {
        id: tempId,
        title: title.trim(),
        description: description?.trim() || '',
        listId: listId,
        position: list.cards.length, // 放在最後一個位置
        status: status, // AI 生成任務的狀態標籤
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // 🚀 樂觀更新：立即加入本地狀態（用戶立刻看到）
      list.cards.push(optimisticCard)
      console.log('⚡ [STORE] 樂觀更新：立即顯示暫時卡片', optimisticCard)

      try {
        // 🎯 步驟3：背景呼叫 API（用戶感受不到等待）
        console.log('📤 [STORE] 背景呼叫 API 建立真實卡片...')
        const realCard = await cardRepository.createCard(title, listId, description, status)
        
        // 🎯 步驟4：成功時，用真實卡片替換暫時卡片
        const cardIndex = list.cards.findIndex(card => card.id === tempId)
        if (cardIndex !== -1) {
          list.cards[cardIndex] = realCard
          console.log('✅ [STORE] 成功：用真實卡片替換暫時卡片', realCard)
        }

      } catch (error) {
        // 🎯 步驟5：失敗時，回滾樂觀更新（移除暫時卡片）
        console.error('❌ [STORE] API 失敗，執行回滾...')
        const cardIndex = list.cards.findIndex(card => card.id === tempId)
        if (cardIndex !== -1) {
          list.cards.splice(cardIndex, 1)
          console.log('🔄 [STORE] 回滾完成：已移除暫時卡片')
        }
        
        // 重新拋出錯誤，讓 UI 層顯示錯誤訊息
        console.error('💥 [STORE] 新增卡片失敗:', error)
        throw error
      }
    },

    // 儲存列表位置順序到資料庫
    // 透過 Repository 模式處理列表位置更新
    async saveListPositions() {
      try {
        console.log('🚀 [STORE] 開始儲存列表位置順序...')
        
        // 準備更新資料：將每個列表的當前位置收集起來
        const updates = this.board.lists.map((list, index) => {
          console.log(`📝 [STORE] 列表 "${list.title}" 位置: ${index}`)
          return {
            id: list.id,
            position: index
          }
        })
        
        // 🎯 使用 Repository 模式：透過 ListRepository 批量更新
        await listRepository.batchUpdateListPositions(updates)
        
        // 🔄 同步本地 position 屬性，方便之後的排序邏輯
        this.board.lists.forEach((list, index) => {
          list.position = index
        })
        
        console.log('✅ [STORE] 列表位置順序已儲存並同步')
        
      } catch (error) {
        console.error('❌ [STORE] 儲存列表位置失敗:', error)
        throw error // 重新拋出錯誤讓組件可以處理
      }
    },
    
    // 從指定列表中刪除卡片
    // 發送 API 請求刪除卡片，成功後從本地狀態移除
    async removeCard(listId: string, cardId: string) {
      try {
        await $fetch(`/api/cards/${cardId}`, {
          method: 'DELETE'
        })
        
        // 從本地狀態中移除對應的卡片
        const list = this.board.lists.find(list => list.id === listId)
        if (list) {
          const cardIndex = list.cards.findIndex(card => card.id === cardId)
          if (cardIndex !== -1) {
            list.cards.splice(cardIndex, 1)
          }
        }
      } catch (error) {
        console.error('刪除卡片錯誤:', error)
      }
    },
    
    // 🎯 方案B：完整的卡片移動 + 排序業務邏輯（單一職責）
    // Vue Draggable 已經更新了 UI 狀態，這個函數只負責：
    // 1. 重新計算所有受影響列表的 position
    // 2. 批次更新到資料庫
    // 3. 錯誤處理和資料一致性
    async moveCardAndReorder(affectedListIds: string[]) {
      console.log(`🚀 [STORE] 開始重新整理受影響列表的 position:`, affectedListIds)
      
      try {
        const updates: Array<{id: string, listId: string, position: number}> = []
        
        // 🎯 重新整理所有受影響列表的卡片 position
        for (const listId of affectedListIds) {
          const list = this.board.lists.find(l => l.id === listId)
          if (!list) {
            console.warn(`⚠️ [STORE] 找不到列表 ${listId}`)
            continue
          }
          
          console.log(`📝 [STORE] 重新整理列表 "${list.title}" 的 ${list.cards.length} 張卡片`)
          
          // 為每張卡片重新分配連續的 position 值 (0, 1, 2, 3...)
          list.cards.forEach((card, index) => {
            const newPosition = index
            console.log(`  📌 [STORE] 卡片 "${card.title}" 新位置: ${newPosition}`)
            
            // 收集所有需要更新的卡片資訊
            updates.push({
              id: card.id,
              listId: listId,
              position: newPosition
            })
          })
        }
        
        console.log(`📤 [STORE] 準備批次更新 ${updates.length} 張卡片的位置...`)
        
        // 🎯 使用 Repository 模式：透過 CardRepository 批次更新
        await cardRepository.batchUpdateCards(updates)
        
        console.log(`✅ [STORE] 成功重新整理所有受影響列表的位置`)
        
      } catch (error) {
        console.error('❌ [STORE] 重新整理卡片位置失敗:', error)
        console.error('🔄 [STORE] 建議重新載入看板資料以確保一致性')
        throw error
      }
    },

    // 更新指定卡片的標題
    // 遍歷所有列表找到對應的卡片並更新其標題
    updateCardTitle(cardId: string, newTitle: string) {
      for (const list of this.board.lists) {
        const card = list.cards.find(card => card.id === cardId)
        if (card) {
          card.title = newTitle
          break // 找到後立即停止搜尋
        }
      }
    },

    // 更新指定卡片的描述
    // 遍歷所有列表找到對應的卡片並更新其描述
    updateCardDescription(cardId: string, newDescription: string) {
      for (const list of this.board.lists) {
        const card = list.cards.find(card => card.id === cardId)
        if (card) {
          card.description = newDescription
          break // 找到後立即停止搜尋
        }
      }
    },

    // 更新指定列表的標題（帶回滾，避免後端失敗時前端狀態髒掉）
    // 1) 先做輸入清理與存在性檢查  2) 樂觀更新  3) 失敗回滾
    async updateListTitle(listId: string, newTitle: string) {
      // ✂️ 先修剪標題，避免空白字串
      const title = newTitle.trim()
      if (!title) {
        console.warn('⚠️ [STORE] newTitle 為空，已略過更新')
        return
      }
      
      // 🔍 找到目標列表
      const list = this.board.lists.find(l => l.id === listId)
      if (!list) {
        console.warn('⚠️ [STORE] 找不到列表，無法更新標題:', listId)
        return
      }

      const prevTitle = list.title
      console.log(`🔄 [STORE] 開始更新列表標題: "${prevTitle}" → "${title}"`)
      
      // ✅ 樂觀更新前端狀態（立即顯示給用戶，提升體驗）
      list.title = title
      
      try {
        // 🎯 使用 Repository 模式：透過 ListRepository 更新資料庫
        await listRepository.updateListTitle(listId, title)
        console.log(`✅ [STORE] 成功更新列表標題: "${title}"`)
      } catch (error) {
        // 🔄 失敗回滾：恢復原始標題，確保 UI 與後端一致
        list.title = prevTitle
        console.error('❌ [STORE] 更新列表標題失敗，已回滾至原標題:', prevTitle)
        console.error('  🔍 錯誤詳情:', error)
        throw error
      }
    },

    // 設定開啟的選單 ID，關閉其他所有選單
    // 實現「同時只能有一個選單開啟」的全域狀態控制
    setOpenMenu(listId: string | null) {
      this.openMenuId = listId
    },

    // 切換指定選單的開啟狀態
    // 如果該選單已開啟則關閉，如果其他選單開啟則切換到該選單
    toggleMenu(listId: string) {
      if (this.openMenuId === listId) {
        // 如果點擊的是已開啟的選單，則關閉它
        this.openMenuId = null
      } else {
        // 如果點擊的是其他選單，則開啟它（自動關閉之前開啟的選單）
        this.openMenuId = listId
      }
    },

    // 關閉所有選單
    // 通常在點擊外部區域時呼叫
    closeAllMenus() {
      this.openMenuId = null
    },

    // 增加正在生成中的 AI 卡片數量
    incrementPendingAiCards(count: number = 1) {
      this.pendingAiCards += count
      console.log(`🤖 [STORE] 新增 ${count} 張 AI 卡片到生成佇列，目前總數: ${this.pendingAiCards}`)
    },

    // 減少正在生成中的 AI 卡片數量（當卡片生成完成時呼叫）
    decrementPendingAiCards(count: number = 1) {
      this.pendingAiCards = Math.max(0, this.pendingAiCards - count)
      console.log(`✅ [STORE] 完成 ${count} 張 AI 卡片生成，剩餘數量: ${this.pendingAiCards}`)
    },

    // 重置 AI 卡片生成計數器
    resetPendingAiCards() {
      this.pendingAiCards = 0
      console.log('🔄 [STORE] 重置 AI 卡片生成計數器')
    },

    // 🚀 為新用戶建立預設列表
    // 當檢測到用戶沒有任何列表時，自動建立 Todo, Doing, Done 三個預設列表
    async createDefaultListsForNewUser() {
      console.log('🎯 [STORE] 開始建立預設列表...')
      
      // 🔒 再次檢查是否真的需要建立（雙重保險）
      if (this.board.lists.length > 0) {
        console.log('⚠️ [STORE] 列表已存在，跳過建立預設列表')
        return
      }
      
      // 預設列表配置
      const defaultLists = [
        { title: 'Todo', position: 0 },
        { title: 'Doing', position: 1 },
        { title: 'Done', position: 2 }
      ]
      
      try {
        // 🎯 批次建立所有預設列表，避免中途被中斷
        const createPromises = defaultLists.map(async (listConfig, index) => {
          // 為了避免同時建立太多請求，加入延遲
          await new Promise(resolve => setTimeout(resolve, index * 100))
          console.log(`📝 [STORE] 建立預設列表: "${listConfig.title}"`)
          return this.addList(listConfig.title)
        })
        
        // 等待所有列表建立完成
        await Promise.all(createPromises)
        
        // 更新列表位置順序
        await this.saveListPositions()
        
        console.log('✅ [STORE] 預設列表建立完成')
        console.log('📋 [STORE] 目前列表數量:', this.board.lists.length)
        
      } catch (error) {
        console.error('❌ [STORE] 建立預設列表失敗:', error)
        // 即使建立預設列表失敗，也不要影響整體應用運作
        // 用戶仍可手動建立列表
      }
    }
  }
})