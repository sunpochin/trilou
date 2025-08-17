/**
 * 🗃️ 測試資料 Fixtures
 * 
 * 📝 包含所有測試用的模擬資料
 * - 統一管理測試資料
 * - 確保測試間的一致性
 * - 方便維護和更新
 */

// 🏷️ 卡片測試資料
export const mockCards = {
  // 標準卡片
  standard: {
    id: 'card_123',
    title: '實作使用者登入功能',
    description: '使用 Firebase Auth 實作登入，包含 Google OAuth',
    listId: 'list_todo',
    position: 0,
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z')
  },

  // 沒有描述的卡片
  withoutDescription: {
    id: 'card_456',
    title: '修復首頁載入問題',
    description: '',
    listId: 'list_inprogress',
    position: 1,
    createdAt: new Date('2024-01-02T10:00:00Z'),
    updatedAt: new Date('2024-01-02T10:00:00Z')
  },

  // 長標題卡片
  longTitle: {
    id: 'card_789',
    title: '這是一個非常非常長的卡片標題，用來測試 UI 在處理長文字時的表現，確保不會破版或造成其他顯示問題',
    description: '描述相對簡短',
    listId: 'list_done',
    position: 2,
    createdAt: new Date('2024-01-03T10:00:00Z'),
    updatedAt: new Date('2024-01-03T10:00:00Z')
  },

  // 包含特殊字符的卡片
  specialCharacters: {
    id: 'card_special',
    title: '處理 <script>alert("XSS")</script> & "引號" 問題',
    description: 'HTML 標籤 <b>bold</b> & 實體 &amp; 中文測試 🎯',
    listId: 'list_todo',
    position: 3,
    createdAt: new Date('2024-01-04T10:00:00Z'),
    updatedAt: new Date('2024-01-04T10:00:00Z')
  }
}

// 📝 列表測試資料
export const mockLists = {
  // 標準列表
  todo: {
    id: 'list_todo',
    title: '待辦事項',
    position: 0,
    cards: [mockCards.standard, mockCards.specialCharacters],
    createdAt: new Date('2024-01-01T09:00:00Z'),
    updatedAt: new Date('2024-01-01T09:00:00Z')
  },

  inProgress: {
    id: 'list_inprogress',
    title: '進行中',
    position: 1,
    cards: [mockCards.withoutDescription],
    createdAt: new Date('2024-01-01T09:00:00Z'),
    updatedAt: new Date('2024-01-01T09:00:00Z')
  },

  done: {
    id: 'list_done',
    title: '已完成',
    position: 2,
    cards: [mockCards.longTitle],
    createdAt: new Date('2024-01-01T09:00:00Z'),
    updatedAt: new Date('2024-01-01T09:00:00Z')
  },

  // 空列表
  empty: {
    id: 'list_empty',
    title: '空列表',
    position: 3,
    cards: [],
    createdAt: new Date('2024-01-01T09:00:00Z'),
    updatedAt: new Date('2024-01-01T09:00:00Z')
  }
}

// 📋 看板測試資料
export const mockBoards = {
  // 標準看板
  standard: {
    id: 'board_123',
    title: '專案看板',
    description: '這是一個測試專案的看板',
    lists: [mockLists.todo, mockLists.inProgress, mockLists.done],
    createdAt: new Date('2024-01-01T08:00:00Z'),
    updatedAt: new Date('2024-01-01T08:00:00Z')
  },

  // 空看板
  empty: {
    id: 'board_empty',
    title: '空看板',
    description: '',
    lists: [],
    createdAt: new Date('2024-01-02T08:00:00Z'),
    updatedAt: new Date('2024-01-02T08:00:00Z')
  }
}

// 🌐 API 回應格式的測試資料 (蛇形命名)
export const mockApiResponses = {
  cards: [
    {
      id: 'card_123',
      title: '實作使用者登入功能',
      description: '使用 Firebase Auth 實作登入，包含 Google OAuth',
      list_id: 'list_todo',  // 蛇形命名
      position: 0,
      created_at: '2024-01-01T10:00:00Z',  // 字串格式
      updated_at: '2024-01-01T10:00:00Z'
    },
    {
      id: 'card_456',
      title: '修復首頁載入問題',
      description: '',
      list_id: 'list_inprogress',
      position: 1,
      created_at: '2024-01-02T10:00:00Z',
      updated_at: '2024-01-02T10:00:00Z'
    }
  ],

  lists: [
    {
      id: 'list_todo',
      title: '待辦事項',
      position: 0,
      created_at: '2024-01-01T09:00:00Z',
      updated_at: '2024-01-01T09:00:00Z'
    },
    {
      id: 'list_inprogress',
      title: '進行中',
      position: 1,
      created_at: '2024-01-01T09:00:00Z',
      updated_at: '2024-01-01T09:00:00Z'
    }
  ],

  // 單一卡片建立回應
  createCard: {
    id: 'card_new',
    title: '新建立的卡片',
    description: '',
    list_id: 'list_todo',
    position: 5,
    created_at: '2024-01-05T10:00:00Z',
    updated_at: '2024-01-05T10:00:00Z'
  },

  // 錯誤回應
  errors: {
    unauthorized: {
      statusCode: 401,
      message: 'Unauthorized'
    },
    forbidden: {
      statusCode: 403,
      message: 'Forbidden'
    },
    notFound: {
      statusCode: 404,
      message: 'Not Found'
    },
    validation: {
      statusCode: 400,
      message: 'Validation Error',
      errors: ['Title is required', 'List ID is required']
    }
  }
}

// 🎭 事件測試資料
export const mockEvents = {
  cardCreated: {
    eventName: 'card:created' as const,
    data: {
      cardId: 'card_123',
      listId: 'list_todo',
      title: '新建卡片'
    }
  },

  cardDeleted: {
    eventName: 'card:deleted' as const,
    data: {
      cardId: 'card_123',
      listId: 'list_todo'
    }
  },

  cardMoved: {
    eventName: 'card:moved' as const,
    data: {
      cardId: 'card_123',
      fromListId: 'list_todo',
      toListId: 'list_inprogress'
    }
  },

  listCreated: {
    eventName: 'list:created' as const,
    data: {
      listId: 'list_new',
      title: '新列表'
    }
  },

  listDeleted: {
    eventName: 'list:deleted' as const,
    data: {
      listId: 'list_old'
    }
  },

  userLogin: {
    eventName: 'user:login' as const,
    data: {
      userId: 'user_123',
      email: 'test@example.com'
    }
  },

  errorOccurred: {
    eventName: 'error:occurred' as const,
    data: {
      error: new Error('測試錯誤'),
      context: 'test-context'
    }
  }
}

// 🧪 測試用的無效資料
export const invalidData = {
  // 無效的卡片
  cards: {
    emptyTitle: {
      id: 'card_invalid',
      title: '',  // 空標題
      description: '有效描述',
      listId: 'list_valid',
      position: 0
    },

    noListId: {
      id: 'card_invalid',
      title: '有效標題',
      description: '有效描述',
      listId: '',  // 空列表ID
      position: 0
    },

    negativePosition: {
      id: 'card_invalid',
      title: '有效標題',
      description: '有效描述',
      listId: 'list_valid',
      position: -1  // 負數位置
    },

    malformed: {
      id: 'card_invalid'
      // 缺少必要欄位
    }
  },

  // 無效的列表
  lists: {
    emptyTitle: {
      id: 'list_invalid',
      title: '   ',  // 只有空白
      position: 0
    },

    negativePosition: {
      id: 'list_invalid',
      title: '有效標題',
      position: -1
    }
  }
}

// 🎯 測試工具函數
export const testHelpers = {
  // 建立隨機卡片
  createRandomCard: (overrides: Partial<typeof mockCards.standard> = {}) => ({
    ...mockCards.standard,
    id: `card_${Math.random().toString(36).substr(2, 9)}`,
    title: `隨機卡片 ${Math.random().toString(36).substr(2, 5)}`,
    ...overrides
  }),

  // 建立隨機列表
  createRandomList: (overrides: Partial<typeof mockLists.todo> = {}) => ({
    ...mockLists.todo,
    id: `list_${Math.random().toString(36).substr(2, 9)}`,
    title: `隨機列表 ${Math.random().toString(36).substr(2, 5)}`,
    cards: [],
    ...overrides
  }),

  // 建立大量卡片（效能測試用）
  createManyCards: (count: number) => {
    return Array.from({ length: count }, (_, index) => 
      testHelpers.createRandomCard({
        title: `卡片 ${index + 1}`,
        position: index
      })
    )
  },

  // 模擬 API 延遲
  createDelayedPromise: <T>(data: T, delay: number = 100) => {
    return new Promise<T>((resolve) => {
      setTimeout(() => resolve(data), delay)
    })
  },

  // 建立錯誤物件
  createApiError: (statusCode: number, message: string) => {
    const error = new Error(message)
    ;(error as any).statusCode = statusCode
    return error
  }
}

// 📊 測試情境資料
export const testScenarios = {
  // 空專案情境
  emptyProject: {
    board: mockBoards.empty,
    user: null,
    isLoading: false,
    error: null
  },

  // 載入中情境
  loading: {
    board: null,
    user: null,
    isLoading: true,
    error: null
  },

  // 錯誤情境
  error: {
    board: null,
    user: null,
    isLoading: false,
    error: '載入失敗'
  },

  // 標準工作情境
  workingProject: {
    board: mockBoards.standard,
    user: {
      id: 'user_123',
      email: 'user@example.com',
      name: '測試使用者'
    },
    isLoading: false,
    error: null
  }
}