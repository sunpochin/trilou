// 📋 一次性獲取完整看板資料的 API 端點（優化性能）
// 使用 JOIN 查詢避免 N+1 問題，大幅提升載入速度
import { serverSupabaseClient } from '~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  console.log('🚀 [BOARD-API] 開始獲取完整看板資料...')
  const startTime = Date.now()
  
  try {
    const supabase = serverSupabaseClient(event)

    // 驗證用戶身份
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw createError({ statusCode: 401, message: 'Unauthorized' })
    }

    console.log(`🔍 [BOARD-API] 用戶 ${user.id} 請求看板資料`)

    // 🎯 方案 A：使用簡單的 JOIN 語法
    let { data, error } = await supabase
      .from('lists')
      .select(`
        id,
        title,
        position,
        cards (
          id,
          title,
          description,
          position
        )
      `)
      .eq('user_id', user.id)
      .order('position', { ascending: true })
    
    // 如果上面的語法失敗，降級到分別查詢但優化過的方案
    if (error) {
      console.log('🔄 [BOARD-API] JOIN 語法失敗，使用優化的分別查詢...')
      console.log('  🔍 JOIN 錯誤:', error.message)
      
      // 先查詢 lists
      const { data: listsData, error: listsError } = await supabase
        .from('lists')
        .select('id, title, position')
        .eq('user_id', user.id)
        .order('position', { ascending: true })
      
      if (listsError) {
        throw listsError
      }
      
      if (!listsData || listsData.length === 0) {
        // 沒有列表，直接回傳空資料
        data = []
        error = null
      } else {
        // 取得所有列表的 ID
        const listIds = listsData.map(list => list.id)
        
        // 一次查詢所有卡片
        const { data: cardsData, error: cardsError } = await supabase
          .from('cards')
          .select('id, title, description, position, list_id')
          .in('list_id', listIds)
          .order('list_id')
          .order('position', { ascending: true })
        
        if (cardsError) {
          throw cardsError
        }
        
        // 手動組合 lists 和 cards
        const cardsByListId: { [key: string]: any[] } = {}
        cardsData?.forEach(card => {
          if (!cardsByListId[card.list_id]) {
            cardsByListId[card.list_id] = []
          }
          cardsByListId[card.list_id].push(card)
        })
        
        // 組合最終資料
        data = listsData.map(list => ({
          ...list,
          cards: cardsByListId[list.id] || []
        }))
        error = null
      }
    }

    if (error) {
      console.error('❌ [BOARD-API] 查詢錯誤:', error)
      throw createError({
        statusCode: 500,
        message: '獲取看板資料失敗'
      })
    }

    const endTime = Date.now()
    const queryTime = endTime - startTime
    
    // 🔧 後處理：確保 cards 按 position 排序
    const sortedData = data?.map(list => ({
      ...list,
      cards: (list.cards || []).sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
    })) || []

    // 統計資訊
    const listsCount = sortedData?.length || 0
    const cardsCount = sortedData?.reduce((total, list) => total + (list.cards?.length || 0), 0) || 0
    
    console.log('📊 [BOARD-API] 查詢完成:')
    console.log(`  ⚡ 查詢時間: ${queryTime}ms`)
    console.log(`  📋 找到 ${listsCount} 個列表`)
    console.log(`  🎯 找到 ${cardsCount} 張卡片`)
    console.log(`  💡 平均每個列表 ${(cardsCount / Math.max(listsCount, 1)).toFixed(1)} 張卡片`)

    // 回傳結構化的看板資料
    const boardData = {
      id: 'board-1',
      title: 'My Board', 
      lists: sortedData
    }

    console.log('✅ [BOARD-API] 成功回傳看板資料')
    return boardData

  } catch (error) {
    const endTime = Date.now()
    const errorTime = endTime - startTime
    console.error(`❌ [BOARD-API] 錯誤發生在 ${errorTime}ms:`, error)
    
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      message: '伺服器內部錯誤'
    })
  }
})