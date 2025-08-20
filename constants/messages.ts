/**
 * 🎨 應用程式文案常數
 * 
 * 統一管理所有用戶介面文案，方便維護和未來國際化
 * 
 * 📝 使用方式：
 * import { MESSAGES } from '@/constants/messages'
 * const welcomeText = MESSAGES.login.welcomeTitle
 */

export const MESSAGES = {
  // 🏠 應用程式基本資訊
  app: {
    name: 'Trilou',
    fullName: 'Trilou - 您的記事小幫手',
    tagline: '讓任務管理變得簡單又有趣'
  },

  // 🔐 登入相關文案
  login: {
    welcomeTitle: '歡迎使用 Trilou 📋',
    welcomeSubtitle: '您的個人任務管理工具',
    googlePrompt: '請用 Google 帳號登入',
    privacyNote: '我們只用來驗證身份，不會存取您的其他資料',
    loginButton: '使用 Google 登入',
    logoutButton: '登出',
    
    // 登入狀態提示
    loggingIn: '正在登入中...',
    loginSuccess: '登入成功！',
    loginError: '登入失敗，請稍後再試',
    logoutSuccess: '已成功登出'
  },

  // 📋 看板相關文案
  board: {
    title: 'Trilou 📋',
    loading: '正在載入看板資料...',
    loadingFromCloud: '正在從雲端獲取您的資料中...',
    empty: '尚未建立任何列表',
    createFirstList: '建立第一個列表開始整理任務吧！'
  },

  // 📝 列表相關文案
  list: {
    addNew: '新增其他列表',
    addCard: '新增卡片',
    deleteConfirm: '確定要刪除列表嗎？',
    deleteWithCards: '此列表包含 {count} 張卡片，刪除後無法復原',
    untitled: '未命名列表',
    
    // 新增/編輯列表
    createTitle: '新增列表',
    editTitle: '編輯列表',
    titlePlaceholder: '列表標題...',
    titleRequired: '請輸入列表標題',
    createSuccess: '列表已成功新增',
    updateSuccess: '列表已成功更新',
    deleteSuccess: '列表已成功刪除'
  },

  // 🎯 卡片相關文案
  card: {
    addNew: '新增卡片',
    edit: '編輯卡片',
    delete: '刪除卡片',
    deleteConfirm: '確定要刪除卡片 "{title}" 嗎？此操作無法撤銷。',
    untitled: '未命名卡片',
    
    // 新增/編輯卡片
    createTitle: '新增卡片',
    editTitle: '編輯卡片',
    titlePlaceholder: '卡片標題...',
    descriptionPlaceholder: '新增更詳細的說明...',
    titleRequired: '請輸入卡片標題',
    createSuccess: '卡片已成功新增',
    updateSuccess: '卡片已成功更新',
    deleteSuccess: '卡片已成功刪除',
    
    // 拖拉功能
    moveSuccess: '卡片已成功移動',
    moveError: '移動卡片失敗，請稍後再試'
  },

  // 💬 對話框相關文案
  dialog: {
    confirm: '確認',
    cancel: '取消',
    save: '儲存',
    delete: '刪除',
    edit: '編輯',
    close: '關閉',
    
    // 通用提示
    unsavedChanges: '有未儲存的變更',
    unsavedPrompt: '確定要離開嗎？未儲存的變更將會遺失',
    operationSuccess: '操作成功',
    operationError: '操作失敗',
    
    // 輸入驗證
    required: '此欄位為必填',
    tooShort: '內容太短，至少需要 {min} 個字元',
    tooLong: '內容太長，最多 {max} 個字元'
  },

  // ⚡ 系統訊息
  system: {
    loading: '載入中...',
    saving: '儲存中...',
    saved: '已儲存',
    error: '發生錯誤',
    networkError: '網路連線異常，請檢查網路設定',
    serverError: '伺服器暫時無法使用，請稍後再試',
    
    // 性能相關
    optimizing: '正在優化載入速度...',
    cacheUpdated: '資料已更新'
  }
} as const

// 🎯 快速存取常用文案的輔助函數
export const getAppName = () => MESSAGES.app.name
export const getAppFullName = () => MESSAGES.app.fullName
export const getLoginMessages = () => MESSAGES.login
export const getBoardMessages = () => MESSAGES.board