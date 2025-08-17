/**
 * 📝 Strategy Pattern = 不同的考試評分方式
 * 
 * 🤔 想像老師要改考卷：
 * 
 * ❌ 只有一種改法的世界：
 * - 數學考卷用數學的方式改（0-100分）
 * - 但如果是英文考卷，也用數學方式改，就很奇怪
 * - 如果要加新科目，要改整個評分系統
 * 
 * ✅ 有不同策略的世界：
 * - 數學考卷 → 用數學評分策略（檢查計算對錯）
 * - 英文考卷 → 用英文評分策略（檢查拼字、文法）
 * - 美術作品 → 用美術評分策略（看創意、色彩）
 * - 想加新科目？寫一個新的評分策略就好！
 * 
 * 🎯 這個檔案就是「不同的檢查方式」：
 * - 卡片標題 → 用卡片檢查策略（不能空白、不能太長）
 * - 電子郵件 → 用 email 檢查策略（要有 @ 符號）
 * - 列表標題 → 用列表檢查策略（比卡片標題短一點）
 * 
 * 📝 使用方式：
 * const result = Validator.validateCardTitle('我的卡片')
 * if (!result.isValid) {
 *   console.log('錯誤:', result.errors)
 * }
 * 
 * 💡 簡單說：不同的東西用不同的檢查方式，不要全部混在一起
 */

// 驗證結果介面
interface ValidationResult {
  isValid: boolean
  errors: string[]
}

// 驗證策略基礎介面
interface ValidationStrategy {
  validate(value: any): ValidationResult
}

// 卡片標題驗證策略
export class CardTitleValidationStrategy implements ValidationStrategy {
  validate(title: string): ValidationResult {
    const errors: string[] = []

    if (!title || typeof title !== 'string') {
      errors.push('卡片標題不能為空')
    } else {
      if (title.trim().length === 0) {
        errors.push('卡片標題不能只有空白')
      }
      if (title.length > 100) {
        errors.push('卡片標題不能超過 100 個字元')
      }
      if (title.includes('<') || title.includes('>')) {
        errors.push('卡片標題不能包含 HTML 標籤')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// 列表標題驗證策略
export class ListTitleValidationStrategy implements ValidationStrategy {
  validate(title: string): ValidationResult {
    const errors: string[] = []

    if (!title || typeof title !== 'string') {
      errors.push('列表標題不能為空')
    } else {
      if (title.trim().length === 0) {
        errors.push('列表標題不能只有空白')
      }
      if (title.length > 50) {
        errors.push('列表標題不能超過 50 個字元')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// 電子郵件驗證策略
export class EmailValidationStrategy implements ValidationStrategy {
  validate(email: string): ValidationResult {
    const errors: string[] = []

    if (!email || typeof email !== 'string') {
      errors.push('電子郵件不能為空')
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        errors.push('請輸入有效的電子郵件格式')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// 驗證器上下文 - 使用策略的地方
export class Validator {
  constructor(private strategy: ValidationStrategy) {}

  setStrategy(strategy: ValidationStrategy): void {
    this.strategy = strategy
  }

  validate(value: any): ValidationResult {
    return this.strategy.validate(value)
  }

  // 靜態方法提供快速驗證
  static validateCardTitle(title: string): ValidationResult {
    const validator = new Validator(new CardTitleValidationStrategy())
    return validator.validate(title)
  }

  static validateListTitle(title: string): ValidationResult {
    const validator = new Validator(new ListTitleValidationStrategy())
    return validator.validate(title)
  }

  static validateEmail(email: string): ValidationResult {
    const validator = new Validator(new EmailValidationStrategy())
    return validator.validate(email)
  }
}