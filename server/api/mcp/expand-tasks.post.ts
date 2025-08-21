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

  try {
    // 讀取請求 body
    const body = await readBody(event)
    
    console.log('🤖 [MCP-API] 收到任務擴展請求:', body)
    
    // 驗證請求格式
    if (!body.userInput || typeof body.userInput !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'userInput 為必填參數且必須為字串'
      })
    }

    // 呼叫外部 MCP 服務
    const mcpServiceUrl = 'https://mcp-trilou-production.up.railway.app/mcp/expand-tasks'
    
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
      }
    }) as { cards?: any[] }

    console.log('✅ [MCP-API] 外部服務回應成功:', response)
    
    // 驗證回應格式
    if (!response || !response.cards || !Array.isArray(response.cards)) {
      console.error('❌ [MCP-API] 外部服務回應格式錯誤:', response)
      throw createError({
        statusCode: 502,
        statusMessage: 'MCP 服務回應格式錯誤'
      })
    }

    return response
    
  } catch (error: any) {
    console.error('❌ [MCP-API] 處理請求時發生錯誤:', error)
    
    // 處理 fetch 錯誤
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    
    // 處理網路錯誤或其他未知錯誤
    throw createError({
      statusCode: 500,
      statusMessage: '無法連接到 MCP 服務，請稍後再試'
    })
  }
})