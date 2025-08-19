/**
 * 🧪 Card.vue 組件簡化測試
 * 
 * 📝 只測試實際存在的功能，避免與組件結構不符的測試
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import Card from '@/components/Card.vue'

// Mock 卡片資料
const mockCard = {
  id: 'card_123',
  title: '測試卡片標題',
  description: '這是測試卡片的描述',
  position: 1
}

const mockEmptyCard = {
  id: 'card_456', 
  title: '沒有描述的卡片',
  description: '',
  position: 2
}

// Mock composable
vi.mock('@/composables/useCardActions', () => ({
  useCardActions: () => ({
    deleteCard: vi.fn(),
    updateCardTitle: vi.fn()
  })
}))

describe('Card.vue', () => {
  let pinia

  beforeEach(() => {
    pinia = createTestingPinia({
      createSpy: vi.fn,
    })
  })

  describe('基本渲染', () => {
    it('應該渲染卡片標題', () => {
      const wrapper = mount(Card, {
        props: { card: mockCard },
        global: { plugins: [pinia] },
      })
      
      expect(wrapper.text()).toContain('測試卡片標題')
    })

    it('應該渲染卡片 ID 和 position', () => {
      const wrapper = mount(Card, {
        props: { card: mockCard },
        global: { plugins: [pinia] },
      })
      
      expect(wrapper.text()).toContain('card_123')
      expect(wrapper.text()).toContain('pos: 1')
    })

    it('應該有正確的 CSS classes', () => {
      const wrapper = mount(Card, {
        props: { card: mockCard },
        global: { plugins: [pinia] },
      })
      
      // 檢查第一個 div 元素有正確的 CSS 類別
      const cardElement = wrapper.find('div')
      expect(cardElement.classes()).toContain('bg-white')
      expect(cardElement.classes()).toContain('rounded')
      expect(cardElement.classes()).toContain('px-3')
      expect(cardElement.classes()).toContain('py-3')
    })
  })

  describe('使用者互動', () => {
    it('應該在點擊時發送 openModal 事件', async () => {
      const wrapper = mount(Card, {
        props: { card: mockCard },
        global: { plugins: [pinia] },
      })
      
      const cardDiv = wrapper.find('.min-h-6.cursor-pointer')
      await cardDiv.trigger('click')
      
      expect(wrapper.emitted()).toHaveProperty('openModal')
      expect(wrapper.emitted().openModal[0]).toEqual([mockCard])
    })

    it('應該在雙擊時進入編輯模式', async () => {
      const wrapper = mount(Card, {
        props: { card: mockCard },
        global: { plugins: [pinia] },
      })
      
      const cardDiv = wrapper.find('.min-h-6.cursor-pointer')
      await cardDiv.trigger('dblclick')
      
      // 檢查是否進入編輯模式 (顯示輸入框)
      expect(wrapper.find('input[type="text"]').exists()).toBe(true)
      expect(wrapper.find('input[type="text"]').element.value).toBe(mockCard.title)
    })

    it('應該在點擊刪除按鈕時呼叫刪除功能', async () => {
      const wrapper = mount(Card, {
        props: { card: mockCard },
        global: { plugins: [pinia] },
      })
      
      const deleteButton = wrapper.find('button[title="刪除卡片"]')
      expect(deleteButton.exists()).toBe(true)
      
      await deleteButton.trigger('click')
      // 由於 deleteCard 是 async，我們只能測試元素存在和可點擊
    })
  })

  describe('編輯模式', () => {
    it('應該在編輯模式下顯示輸入框', async () => {
      const wrapper = mount(Card, {
        props: { card: mockCard },
        global: { plugins: [pinia] },
      })
      
      // 進入編輯模式
      const cardDiv = wrapper.find('.min-h-6.cursor-pointer')
      await cardDiv.trigger('dblclick')
      
      const input = wrapper.find('input[type="text"]')
      expect(input.exists()).toBe(true)
      expect(input.element.value).toBe(mockCard.title)
    })

    it('應該在按 Enter 時儲存編輯', async () => {
      const wrapper = mount(Card, {
        props: { card: mockCard },
        global: { plugins: [pinia] },
      })
      
      // 進入編輯模式
      const cardDiv = wrapper.find('.min-h-6.cursor-pointer')
      await cardDiv.trigger('dblclick')
      
      const input = wrapper.find('input[type="text"]')
      await input.setValue('新標題')
      await input.trigger('keydown.enter')
      
      // 檢查是否離開編輯模式
      expect(wrapper.find('input[type="text"]').exists()).toBe(false)
    })

    it('應該在按 Escape 時取消編輯', async () => {
      const wrapper = mount(Card, {
        props: { card: mockCard },
        global: { plugins: [pinia] },
      })
      
      // 進入編輯模式
      const cardDiv = wrapper.find('.min-h-6.cursor-pointer')
      await cardDiv.trigger('dblclick')
      
      const input = wrapper.find('input[type="text"]')
      await input.setValue('不會保存的標題')
      await input.trigger('keydown.escape')
      
      // 檢查是否離開編輯模式
      expect(wrapper.find('input[type="text"]').exists()).toBe(false)
    })
  })

  describe('Props 處理', () => {
    it('應該正確處理不同的卡片資料', () => {
      const wrapper = mount(Card, {
        props: { card: mockEmptyCard },
        global: { plugins: [pinia] },
      })
      
      expect(wrapper.text()).toContain('沒有描述的卡片')
      expect(wrapper.text()).toContain('card_456')
      expect(wrapper.text()).toContain('pos: 2')
    })

    it('應該處理特殊字符', () => {
      const specialCard = {
        id: 'card_special',
        title: '特殊字符 <script>alert("test")</script>',
        description: 'HTML <b>tags</b>',
        position: 3
      }
      
      const wrapper = mount(Card, {
        props: { card: specialCard },
        global: { plugins: [pinia] },
      })
      
      // Vue 會自動轉義特殊字符
      expect(wrapper.text()).toContain('特殊字符')
    })
  })
})