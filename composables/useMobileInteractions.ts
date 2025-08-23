/**
 * 🏠 Mobile 互動處理 Composable
 * 
 * 這個 composable 就像一個「手勢管家」，專門管理手機的觸控互動：
 * - 普通觸控：移動整個看板版面
 * - 長按觸控：讓卡片進入「飄浮模式」可以拖拽
 * 
 * 🎯 SOLID 原則應用：
 * - S (單一職責)：只負責手機觸控手勢的處理
 * - O (開放封閉)：可以輕鬆新增新的手勢而不修改現有邏輯
 * - D (依賴反轉)：組件依賴這個抽象接口，不直接處理觸控事件
 */

import { ref, reactive } from 'vue'

// 觸控狀態介面定義
interface TouchState {
  isActive: boolean        // 是否正在觸控
  startX: number          // 觸控開始的 X 座標
  startY: number          // 觸控開始的 Y 座標
  currentX: number        // 當前 X 座標
  currentY: number        // 當前 Y 座標
  isDragging: boolean     // 是否正在拖拽版面
  isLongPress: boolean    // 是否觸發了長按
  isScrolling: boolean    // 是否正在滾動列表
  targetElement: HTMLElement | null  // 觸控目標元素
}

// 卡片拖拽狀態介面定義
interface CardDragState {
  isDragging: boolean     // 卡片是否正在被拖拽
  draggedCard: HTMLElement | null  // 被拖拽的卡片元素
  originalPosition: { x: number, y: number }  // 卡片原始位置
  offset: { x: number, y: number }            // 觸控點相對卡片的偏移
}

export function useMobileInteractions() {
  // 觸控狀態管理
  const touchState = reactive<TouchState>({
    isActive: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isDragging: false,
    isLongPress: false,
    isScrolling: false,
    targetElement: null
  })

  // 卡片拖拽狀態管理
  const cardDragState = reactive<CardDragState>({
    isDragging: false,
    draggedCard: null,
    originalPosition: { x: 0, y: 0 },
    offset: { x: 0, y: 0 }
  })

  // 版面容器的引用
  const boardContainer = ref<HTMLElement | null>(null)
  
  // 長按定時器
  let longPressTimer: number | null = null
  const LONG_PRESS_DURATION = 500 // 500ms 觸發長按

  /**
   * 🎯 Strategy Pattern (策略模式) 應用
   * 不同的觸控情境使用不同的處理策略
   */

  // 策略1：處理版面拖拽移動
  const handleBoardPanning = (deltaX: number, deltaY: number) => {
    if (!boardContainer.value) return
    
    // 使用 CSS transform 來移動版面，效能較好
    const currentTransform = boardContainer.value.style.transform || 'translate(0px, 0px)'
    
    // 解析當前的 translate 值
    const matches = currentTransform.match(/translate\((-?\d+\.?\d*)px,\s*(-?\d+\.?\d*)px\)/)
    const currentX = matches ? parseFloat(matches[1]) : 0
    const currentY = matches ? parseFloat(matches[2]) : 0
    
    // 計算新的位置
    const newX = currentX + deltaX
    const newY = currentY + deltaY
    
    // 動態計算 board 邊界限制
    const boardRect = boardContainer.value.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    // 限制不能拖拽超出視窗範圍，保留一些邊界
    const padding = 0
    const maxX = Math.max(0, viewportWidth - boardRect.width + padding)
    const maxY = Math.max(0, viewportHeight - boardRect.height + padding)
    const minX = Math.min(0, -(boardRect.width - viewportWidth + padding))
    const minY = Math.min(0, -(boardRect.height - viewportHeight + padding))
    
    const clampedX = Math.max(minX, Math.min(maxX, newX))
    const clampedY = Math.max(minY, Math.min(maxY, newY))
    
    boardContainer.value.style.transform = `translate(${clampedX}px, ${clampedY}px)`
    
    console.log('📱 [MOBILE] 版面移動:', { deltaX, deltaY, newX: clampedX, newY: clampedY, boardSize: { width: boardRect.width, height: boardRect.height } })
  }

  // 策略2：處理卡片拖拽模式
  const handleCardDragMode = (target: HTMLElement, touch: Touch) => {
    const cardElement = target.closest('.card-draggable') as HTMLElement
    if (!cardElement) return

    // 進入卡片拖拽模式
    cardDragState.isDragging = true
    cardDragState.draggedCard = cardElement
    
    // 記錄卡片原始位置
    const rect = cardElement.getBoundingClientRect()
    cardDragState.originalPosition = { x: rect.left, y: rect.top }
    cardDragState.offset = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    }

    // 添加拖拽樣式：傾斜 + 半透明 + 提升層級
    cardElement.classList.add('card-dragging')
    cardElement.style.position = 'fixed'
    cardElement.style.zIndex = '1000'
    cardElement.style.pointerEvents = 'none'
    
    console.log('📱 [MOBILE] 卡片進入拖拽模式:', cardElement)
  }
  
  // 策略3：處理列表滾動
  const handleListScrolling = (deltaY: number, listElement: HTMLElement) => {
    // 檢查列表是否可以滾動
    const isScrollable = listElement.scrollHeight > listElement.clientHeight
    
    if (isScrollable) {
      // 計算新的滾動位置
      const currentScrollTop = listElement.scrollTop
      const newScrollTop = currentScrollTop - deltaY * 2 // 乘以 2 讓滾動更靈敏
      
      // 限制滾動範圍
      const maxScrollTop = listElement.scrollHeight - listElement.clientHeight
      const clampedScrollTop = Math.max(0, Math.min(maxScrollTop, newScrollTop))
      
      listElement.scrollTop = clampedScrollTop
      
      console.log('📱 [MOBILE] 列表滾動:', { deltaY, currentScrollTop, newScrollTop: clampedScrollTop, maxScrollTop })
      return true // 表示已處理滾動
    }
    
    return false // 表示無法滾動
  }

  // 觸控開始事件處理
  const handleTouchStart = (event: TouchEvent) => {
    const touch = event.touches[0]
    if (!touch) return

    const target = event.target as HTMLElement
    
    touchState.isActive = true
    touchState.startX = touch.clientX
    touchState.startY = touch.clientY
    touchState.currentX = touch.clientX
    touchState.currentY = touch.clientY
    touchState.isDragging = false
    touchState.isLongPress = false
    touchState.isScrolling = false
    touchState.targetElement = target

    // 設定長按定時器
    longPressTimer = window.setTimeout(() => {
      if (touchState.isActive && !touchState.isScrolling) {
        touchState.isLongPress = true
        // 檢查是否在卡片上長按
        if (target && target.closest('.card-draggable')) {
          handleCardDragMode(target, touch)
          // 添加震動回饋（如果裝置支援）
          if ('vibrate' in navigator) {
            navigator.vibrate(50)
          }
        }
      }
    }, LONG_PRESS_DURATION)

    console.log('📱 [MOBILE] 觸控開始:', { x: touch.clientX, y: touch.clientY, target: target.className })
  }

  // 觸控移動事件處理
  const handleTouchMove = (event: TouchEvent) => {
    if (!touchState.isActive) return
    
    const touch = event.touches[0]
    if (!touch) return

    // 計算移動距離
    const deltaX = touch.clientX - touchState.currentX
    const deltaY = touch.clientY - touchState.currentY
    const totalDeltaX = touch.clientX - touchState.startX
    const totalDeltaY = touch.clientY - touchState.startY
    
    touchState.currentX = touch.clientX
    touchState.currentY = touch.clientY

    // 如果移動距離超過闾值，決定是滾動還是拖拽
    const moveDistance = Math.sqrt(totalDeltaX * totalDeltaX + totalDeltaY * totalDeltaY)
    
    if (moveDistance > 10 && !touchState.isDragging && !touchState.isLongPress && !touchState.isScrolling) {
      // 清除長按定時器
      if (longPressTimer) {
        clearTimeout(longPressTimer)
        longPressTimer = null
      }
      
      // 如果觸控開始在卡片上但沒有長按，則不做任何 board 級別的操作
      if (touchState.targetElement?.closest('.card-draggable')) {
        console.log('📱 [MOBILE] 在卡片上短距離移動，跳過處理')
        touchState.isActive = false
        return
      }
      
      // 檢查是否應該做列表滾動 (尋找可滾動的卡片容器)
      const listElement = touchState.targetElement?.closest('[data-list-id]') as HTMLElement
      const scrollableContainer = listElement?.querySelector('.overflow-y-auto') as HTMLElement
      
      if (scrollableContainer && !touchState.targetElement?.closest('.card-draggable')) {
        // 在列表區域且不是卡片，優先嘗試垂直滾動
        const isVerticalMove = Math.abs(totalDeltaY) > Math.abs(totalDeltaX) * 1.5
        
        if (isVerticalMove && scrollableContainer.scrollHeight > scrollableContainer.clientHeight) {
          touchState.isScrolling = true
          console.log('📱 [MOBILE] 進入列表滾動模式')
        } else {
          touchState.isDragging = true
          console.log('📱 [MOBILE] 進入版面拖拽模式')
        }
      } else {
        // 其他情況預設拖拽版面
        touchState.isDragging = true
        console.log('📱 [MOBILE] 進入版面拖拽模式')
      }
    }

    // 根據當前模式處理移動
    if (cardDragState.isDragging) {
      // 卡片拖拽模式：移動卡片，並限制在 viewport 範圍內
      if (cardDragState.draggedCard) {
        const newX = Math.max(0, Math.min(window.innerWidth - 100, touch.clientX - cardDragState.offset.x))
        const newY = Math.max(0, Math.min(window.innerHeight - 100, touch.clientY - cardDragState.offset.y))
        
        cardDragState.draggedCard.style.left = `${newX}px`
        cardDragState.draggedCard.style.top = `${newY}px`
      }
      event.preventDefault()
    } else if (touchState.isScrolling) {
      // 列表滾動模式：滾動列表
      const listElement = touchState.targetElement?.closest('[data-list-id]') as HTMLElement
      const scrollableContainer = listElement?.querySelector('.overflow-y-auto') as HTMLElement
      if (scrollableContainer && handleListScrolling(deltaY, scrollableContainer)) {
        event.preventDefault()
      }
    } else if (touchState.isDragging) {
      // 版面拖拽模式：移動整個版面
      handleBoardPanning(deltaX, deltaY)
      event.preventDefault()
    }
  }

  // 觸控結束事件處理
  const handleTouchEnd = () => {
    // 清除長按定時器
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }

    // 如果是卡片拖拽模式，處理放下邏輯
    if (cardDragState.isDragging && cardDragState.draggedCard) {
      // 移除拖拽樣式
      cardDragState.draggedCard.classList.remove('card-dragging')
      cardDragState.draggedCard.style.position = ''
      cardDragState.draggedCard.style.zIndex = ''
      cardDragState.draggedCard.style.pointerEvents = ''
      cardDragState.draggedCard.style.left = ''
      cardDragState.draggedCard.style.top = ''
      
      // 在這裡可以檢查是否放到了有效的投放區域
      // TODO: 實作投放邏輯
      
      console.log('📱 [MOBILE] 卡片拖拽結束')
    }

    // 重置狀態
    touchState.isActive = false
    touchState.isDragging = false
    touchState.isLongPress = false
    touchState.isScrolling = false
    touchState.targetElement = null
    cardDragState.isDragging = false
    cardDragState.draggedCard = null

    console.log('📱 [MOBILE] 觸控結束')
  }

  // 設定版面容器的引用
  const setBoardContainer = (element: HTMLElement) => {
    boardContainer.value = element
  }

  // 重置版面位置到中心
  const resetBoardPosition = () => {
    if (boardContainer.value) {
      boardContainer.value.style.transform = 'translate(0px, 0px)'
    }
  }

  return {
    // 狀態
    touchState,
    cardDragState,
    
    // 方法
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    setBoardContainer,
    resetBoardPosition
  }
}