// MCP 任務擴展 API 端點
// 代理請求到外部 MCP 服務，處理 CORS 和認證

export default defineEventHandler(async (event) => {
  // 只允許 POST 請求
  if (event.method !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed'
    })
  }

  // 設定 CORS headers（在處理請求前就設定）
  setHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })

  let body: any
  
  try {
    // 讀取請求 body
    body = await readBody(event)
    
    console.log('🤖 [MCP-API] 收到任務擴展請求:', body)
    
    // 驗證請求格式
    if (!body.userInput || typeof body.userInput !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'userInput 為必填參數且必須為字串'
      })
    }

    // 呼叫外部 MCP 服務 - 增加超時和錯誤處理
    const mcpServiceUrl="https://mcp-trilou.up.railway.app/mcp/expand-tasks"
    
    console.log('🚀 [MCP-API] 轉發請求到外部服務:', mcpServiceUrl)
    
    const response = await $fetch(mcpServiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 可以在這裡添加認證 headers 如果需要的話
        // 'Authorization': `Bearer ${process.env.MCP_API_KEY}`
      },
      body: {
        userInput: body.userInput,
        requestStatusInfo: true,
        statusTypes: [
          "urgent", "high", "medium", "low",
          "due-today", "due-tomorrow", "quick-task", "complex-task",
          "research-needed", "waiting-approval", "meeting-required"
        ]
      },
      // 增加超時設定 (30秒)
      timeout: 10000,
      // 添加重試機制
      retry: 1,
      // 處理網路錯誤時的行為
      onRequestError({ error }) {
        console.error('🚨 [MCP-API] 請求錯誤:', error.message)
      },
      onResponseError({ response }) {
        console.error('🚨 [MCP-API] 回應錯誤:', response.status, response.statusText)
      }
    }) as { cards?: any[] | { cards: any[] } }

    console.log('✅ [MCP-API] 外部服務回應成功:', response)
    
    // 處理不同的回應格式
    let cards: any[] = []
    
    if (response && response.cards) {
      // 如果 response.cards 是陣列，直接使用
      if (Array.isArray(response.cards)) {
        cards = response.cards
      }
      // 如果 response.cards 是物件且包含 cards 陣列，使用內層的 cards
      else if (response.cards.cards && Array.isArray(response.cards.cards)) {
        cards = response.cards.cards
      }
    }
    
    // 驗證最終的 cards 陣列
    if (!Array.isArray(cards) || cards.length === 0) {
      console.error('❌ [MCP-API] 無法從回應中提取 cards 陣列:', response)
      throw createError({
        statusCode: 502,
        statusMessage: 'MCP 服務回應格式錯誤'
      })
    }

    console.log(`✅ [MCP-API] 成功提取 ${cards.length} 張卡片`)
    return { cards }
    
  } catch (error: any) {
    console.error('❌ [MCP-API] 處理請求時發生錯誤:', error)
    
    // 檢查是否為連線超時、網路錯誤或服務錯誤
    const isNetworkError = error?.message?.includes('fetch failed') || 
                          error?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
                          error?.message?.includes('timeout') ||
                          error?.message?.includes('ECONNREFUSED') ||
                          (error?.statusCode >= 500 && error?.statusCode < 600) // 5xx 伺服器錯誤
    
    if (isNetworkError) {
      console.log('🔄 [MCP-API] 檢測到網路錯誤，返回 fallback 回應')
      
      // 提供 fallback 回應，避免 UI 卡住
      return {
        cards: [
          {
            title: `解析「${body.userInput}」的子任務`,
            description: '開始將任務分解為更小的子任務',
            status: 'medium'
          },
          {
            title: '研究相關資源和工具',
            description: '調查完成此任務所需的工具和資源',
            status: 'high'
          },
          {
            title: '制定具體執行計劃',
            description: '根據研究結果制定詳細的執行步驟',
            status: 'medium'
          }
        ]
      }
    }
    
    // 處理已知的 HTTP 錯誤（有 statusCode 的錯誤）
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    
    // 處理其他未知錯誤
    throw createError({
      statusCode: 500,
      statusMessage: '無法連接到 MCP 服務，請稍後再試'
    })
  }
})