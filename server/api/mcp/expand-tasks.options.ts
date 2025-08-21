// 處理 CORS 預檢請求

export default defineEventHandler(async (event) => {
  // 設定 CORS headers
  setHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400' // 24小時
  })

  // 回傳空的成功回應
  return {}
})