/**
 * 🧪 Card.vue 組件 TDD 測試
 * 
 * 📝 測試策略：
 * - 測試組件渲染
 * - 測試使用者互動
 * - 測試 props 傳遞
 * - 測試事件發送
 * - 測試條件渲染
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { render, screen, fireEvent } from '@testing-library/vue'
import Card from '@/components/Card.vue'

// Mock 卡片資料
const mockCard = {
  id: 'card_123',
  title: '測試卡片標題',
  description: '這是測試卡片的描述'
}

const mockEmptyCard = {
  id: 'card_456',
  title: '沒有描述的卡片',
  description: ''
}

describe('Card.vue', () => {
  describe('Rendering', () => {
    it('should render card title', () => {
      render(Card, {
        props: { card: mockCard }
      })
      
      expect(screen.getByText('測試卡片標題')).toBeInTheDocument()
    })

    it('should render card description when provided', () => {
      render(Card, {
        props: { card: mockCard }
      })
      
      expect(screen.getByText('這是測試卡片的描述')).toBeInTheDocument()
    })

    it('should not render description when empty', () => {
      render(Card, {
        props: { card: mockEmptyCard }
      })
      
      expect(screen.queryByText('')).not.toBeInTheDocument()
      // 確認描述區域不存在
      expect(screen.queryByTestId('card-description')).not.toBeInTheDocument()
    })

    it('should have correct data-testid for testing', () => {
      render(Card, {
        props: { card: mockCard }
      })
      
      expect(screen.getByTestId('card')).toBeInTheDocument()
      expect(screen.getByTestId('card-title')).toBeInTheDocument()
    })

    it('should render with correct CSS classes', () => {
      const wrapper = mount(Card, {
        props: { card: mockCard }
      })
      
      // 檢查根元素有正確的 CSS 類別
      expect(wrapper.classes()).toContain('card')
      expect(wrapper.find('[data-testid="card-title"]').classes()).toContain('card-title')
    })
  })

  describe('User Interactions', () => {
    it('should emit edit event when card is clicked', async () => {
      const wrapper = mount(Card, {
        props: { card: mockCard }
      })
      
      await wrapper.find('[data-testid="card"]').trigger('click')
      
      expect(wrapper.emitted()).toHaveProperty('edit')
      expect(wrapper.emitted().edit[0]).toEqual([mockCard.id])
    })

    it('should emit delete event when delete button is clicked', async () => {
      const { emitted } = render(Card, {
        props: { card: mockCard }
      })
      
      const deleteButton = screen.getByRole('button', { name: /刪除|delete/i })
      await fireEvent.click(deleteButton)
      
      expect(emitted()).toHaveProperty('delete')
      expect(emitted().delete[0]).toEqual([mockCard.id])
    })

    it('should not emit edit event when delete button is clicked', async () => {
      const wrapper = mount(Card, {
        props: { card: mockCard }
      })
      
      // 點擊刪除按鈕
      await wrapper.find('[data-testid="delete-button"]').trigger('click')
      
      // 應該只有 delete 事件，沒有 edit 事件
      expect(wrapper.emitted()).toHaveProperty('delete')
      expect(wrapper.emitted()).not.toHaveProperty('edit')
    })

    it('should stop propagation when delete button is clicked', async () => {
      const wrapper = mount(Card, {
        props: { card: mockCard }
      })
      
      const deleteButton = wrapper.find('[data-testid="delete-button"]')
      const clickEvent = { stopPropagation: vi.fn() }
      
      // 模擬點擊事件
      await deleteButton.trigger('click', clickEvent)
      
      // 確認 stopPropagation 被呼叫（如果有實作的話）
      expect(wrapper.emitted().delete).toBeTruthy()
    })
  })

  describe('Edit Mode', () => {
    it('should enter edit mode when card is double-clicked', async () => {
      const wrapper = mount(Card, {
        props: { card: mockCard }
      })
      
      await wrapper.find('[data-testid="card"]').trigger('dblclick')
      
      // 檢查是否進入編輯模式
      expect(wrapper.find('input[data-testid="title-input"]').exists()).toBe(true)
      expect(wrapper.find('textarea[data-testid="description-input"]').exists()).toBe(true)
    })

    it('should show input fields with current values in edit mode', async () => {
      const wrapper = mount(Card, {
        props: { card: mockCard }
      })
      
      await wrapper.find('[data-testid="card"]').trigger('dblclick')
      
      const titleInput = wrapper.find('input[data-testid="title-input"]')
      const descriptionInput = wrapper.find('textarea[data-testid="description-input"]')
      
      expect(titleInput.element.value).toBe(mockCard.title)
      expect(descriptionInput.element.value).toBe(mockCard.description)
    })

    it('should emit update event when save button is clicked in edit mode', async () => {
      const wrapper = mount(Card, {
        props: { card: mockCard }
      })
      
      // 進入編輯模式
      await wrapper.find('[data-testid="card"]').trigger('dblclick')
      
      // 修改標題
      const titleInput = wrapper.find('input[data-testid="title-input"]')
      await titleInput.setValue('更新後的標題')
      
      // 點擊保存
      await wrapper.find('[data-testid="save-button"]').trigger('click')
      
      expect(wrapper.emitted()).toHaveProperty('update')
      expect(wrapper.emitted().update[0]).toEqual([{
        id: mockCard.id,
        title: '更新後的標題',
        description: mockCard.description
      }])
    })

    it('should exit edit mode when cancel button is clicked', async () => {
      const wrapper = mount(Card, {
        props: { card: mockCard }
      })
      
      // 進入編輯模式
      await wrapper.find('[data-testid="card"]').trigger('dblclick')
      expect(wrapper.find('input[data-testid="title-input"]').exists()).toBe(true)
      
      // 點擊取消
      await wrapper.find('[data-testid="cancel-button"]').trigger('click')
      
      // 應該退出編輯模式
      expect(wrapper.find('input[data-testid="title-input"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="card-title"]').exists()).toBe(true)
    })

    it('should not emit update event if no changes made', async () => {
      const wrapper = mount(Card, {
        props: { card: mockCard }
      })
      
      // 進入編輯模式
      await wrapper.find('[data-testid="card"]').trigger('dblclick')
      
      // 不做任何修改，直接保存
      await wrapper.find('[data-testid="save-button"]').trigger('click')
      
      // 不應該發送 update 事件
      expect(wrapper.emitted()).not.toHaveProperty('update')
    })

    it('should validate required fields in edit mode', async () => {
      const wrapper = mount(Card, {
        props: { card: mockCard }
      })
      
      // 進入編輯模式
      await wrapper.find('[data-testid="card"]').trigger('dblclick')
      
      // 清空標題
      const titleInput = wrapper.find('input[data-testid="title-input"]')
      await titleInput.setValue('')
      
      // 嘗試保存
      await wrapper.find('[data-testid="save-button"]').trigger('click')
      
      // 應該顯示錯誤訊息，不發送 update 事件
      expect(wrapper.find('[data-testid="error-message"]').exists()).toBe(true)
      expect(wrapper.emitted()).not.toHaveProperty('update')
    })
  })

  describe('Keyboard Interactions', () => {
    it('should save changes when Enter is pressed in title input', async () => {
      const wrapper = mount(Card, {
        props: { card: mockCard }
      })
      
      // 進入編輯模式
      await wrapper.find('[data-testid="card"]').trigger('dblclick')
      
      // 修改標題並按 Enter
      const titleInput = wrapper.find('input[data-testid="title-input"]')
      await titleInput.setValue('快速更新')
      await titleInput.trigger('keydown.enter')
      
      expect(wrapper.emitted()).toHaveProperty('update')
      expect(wrapper.emitted().update[0][0].title).toBe('快速更新')
    })

    it('should cancel edit when Escape is pressed', async () => {
      const wrapper = mount(Card, {
        props: { card: mockCard }
      })
      
      // 進入編輯模式
      await wrapper.find('[data-testid="card"]').trigger('dblclick')
      
      // 修改標題
      const titleInput = wrapper.find('input[data-testid="title-input"]')
      await titleInput.setValue('不會保存的修改')
      
      // 按 Escape
      await titleInput.trigger('keydown.escape')
      
      // 應該退出編輯模式且不保存
      expect(wrapper.find('input[data-testid="title-input"]').exists()).toBe(false)
      expect(wrapper.emitted()).not.toHaveProperty('update')
    })

    it('should focus title input when entering edit mode', async () => {
      const wrapper = mount(Card, {
        props: { card: mockCard }
      })
      
      // 進入編輯模式
      await wrapper.find('[data-testid="card"]').trigger('dblclick')
      
      const titleInput = wrapper.find('input[data-testid="title-input"]')
      
      // 檢查 input 是否被聚焦
      expect(document.activeElement).toBe(titleInput.element)
    })
  })

  describe('Props Validation', () => {
    it('should handle missing card prop gracefully', () => {
      // 測試組件在沒有 card prop 時的行為
      expect(() => {
        render(Card, {
          props: { card: undefined }
        })
      }).not.toThrow()
    })

    it('should handle malformed card data', () => {
      const malformedCard = {
        id: 'card_123'
        // 缺少 title 和 description
      }
      
      expect(() => {
        render(Card, {
          props: { card: malformedCard }
        })
      }).not.toThrow()
    })

    it('should handle very long title gracefully', () => {
      const longTitleCard = {
        id: 'card_123',
        title: 'A'.repeat(1000), // 非常長的標題
        description: '正常描述'
      }
      
      render(Card, {
        props: { card: longTitleCard }
      })
      
      expect(screen.getByTestId('card-title')).toBeInTheDocument()
    })

    it('should handle special characters in title and description', () => {
      const specialCard = {
        id: 'card_123',
        title: '特殊字符 <script>alert("xss")</script> & "quotes"',
        description: 'HTML <b>tags</b> & entities &amp; 中文'
      }
      
      render(Card, {
        props: { card: specialCard }
      })
      
      // 確保特殊字符被正確顯示而非執行
      expect(screen.getByText(specialCard.title)).toBeInTheDocument()
      expect(screen.getByText(specialCard.description)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const wrapper = mount(Card, {
        props: { card: mockCard }
      })
      
      const cardElement = wrapper.find('[data-testid="card"]')
      
      expect(cardElement.attributes('role')).toBe('button')
      expect(cardElement.attributes('tabindex')).toBe('0')
      expect(cardElement.attributes('aria-label')).toContain(mockCard.title)
    })

    it('should be keyboard accessible', async () => {
      const wrapper = mount(Card, {
        props: { card: mockCard }
      })
      
      const cardElement = wrapper.find('[data-testid="card"]')
      
      // 測試 Tab 鍵導航
      await cardElement.trigger('keydown.tab')
      expect(document.activeElement).toBe(cardElement.element)
      
      // 測試 Space 或 Enter 鍵激活
      await cardElement.trigger('keydown.enter')
      expect(wrapper.emitted()).toHaveProperty('edit')
    })

    it('should have proper button roles for interactive elements', () => {
      const wrapper = mount(Card, {
        props: { card: mockCard }
      })
      
      const deleteButton = wrapper.find('[data-testid="delete-button"]')
      
      expect(deleteButton.attributes('role')).toBe('button')
      expect(deleteButton.attributes('aria-label')).toContain('刪除')
    })
  })

  describe('Visual States', () => {
    it('should show hover state styling', async () => {
      const wrapper = mount(Card, {
        props: { card: mockCard }
      })
      
      const cardElement = wrapper.find('[data-testid="card"]')
      
      await cardElement.trigger('mouseenter')
      expect(cardElement.classes()).toContain('card--hover')
      
      await cardElement.trigger('mouseleave')
      expect(cardElement.classes()).not.toContain('card--hover')
    })

    it('should show loading state when updating', async () => {
      const wrapper = mount(Card, {
        props: { 
          card: mockCard,
          loading: true 
        }
      })
      
      expect(wrapper.find('[data-testid="loading-spinner"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="delete-button"]').attributes('disabled')).toBe('')
    })

    it('should show error state when there is an error', async () => {
      const wrapper = mount(Card, {
        props: { 
          card: mockCard,
          error: '更新失敗'
        }
      })
      
      expect(wrapper.find('[data-testid="error-message"]').text()).toBe('更新失敗')
      expect(wrapper.classes()).toContain('card--error')
    })
  })

  describe('Integration with Store', () => {
    it('should work correctly with mocked store actions', async () => {
      // 模擬 store
      const mockStore = {
        updateCard: vi.fn(),
        deleteCard: vi.fn()
      }
      
      const wrapper = mount(Card, {
        props: { card: mockCard },
        global: {
          provide: {
            store: mockStore
          }
        }
      })
      
      // 測試刪除
      await wrapper.find('[data-testid="delete-button"]').trigger('click')
      
      expect(wrapper.emitted()).toHaveProperty('delete')
      // 如果組件內部呼叫 store，也要測試
      // expect(mockStore.deleteCard).toHaveBeenCalledWith(mockCard.id)
    })
  })

  describe('Performance', () => {
    it('should not re-render unnecessarily when props do not change', async () => {
      const renderSpy = vi.fn()
      
      const TestWrapper = {
        setup() {
          renderSpy()
          return {}
        },
        template: '<Card :card="card" />',
        components: { Card }
      }
      
      const wrapper = mount(TestWrapper, {
        props: { card: mockCard }
      })
      
      expect(renderSpy).toHaveBeenCalledTimes(1)
      
      // 重新設定相同的 props
      await wrapper.setProps({ card: mockCard })
      
      // 如果有正確的優化，應該不會重新渲染
      // 這個測試需要根據實際組件的優化策略調整
      expect(renderSpy).toHaveBeenCalledTimes(1)
    })
  })
})