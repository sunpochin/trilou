# Trilou - Trello Clone with MCP server integration

A modern, full-featured Trello clone built with cutting-edge technologies, featuring AI-powered task generation, optimistic UI updates, and comprehensive drag-and-drop functionality.

Demo: https://trilou.vercel.app/

---


[![Demo](https://img.shields.io/badge/Demo-Live-success)](https://trilou.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Built with Nuxt](https://img.shields.io/badge/Built%20with-Nuxt%203-00C58E.svg)](https://nuxt.com/)

## ✨ Key Features

- 🎯 **Complete Kanban Board** - Multi-list management with full CRUD operations
- 🤖 **AI Task Generation** - Generate tasks automatically using MCP server integration
- 🖱️ **Advanced Drag & Drop** - Seamless card reordering and cross-list movement
- ⚡ **Optimistic UI Updates** - Lightning-fast user experience with smart rollbacks
- 🔐 **Dual Authentication** - Google OAuth + Magic Email Link login
- 📱 **Responsive Design** - Optimized for all device sizes
- 🏗️ **SOLID Architecture** - Clean code following dependency inversion principles
- 🎨 **Modern UI/UX** - Beautiful Tailwind CSS styling with smooth animations
- 📝 **Full TypeScript** - Complete type safety throughout the application
- 🧪 **Comprehensive Testing** - Unit and integration tests with Vitest

## 🛠️ Technology Stack

### Frontend
- **Nuxt 3** - Full-stack Vue.js framework
- **Vue 3** - Composition API with reactive state management
- **TypeScript** - Type-safe development
- **Pinia** - Modern state management
- **Tailwind CSS** - Utility-first CSS framework
- **Vue Draggable Next** - Drag-and-drop functionality

### Backend & Database
- **Nuxt Server API** - Full-stack API routes
- **Supabase** - PostgreSQL database with real-time features
- **Supabase Auth** - Authentication and user management

### Architecture Patterns
- **Repository Pattern** - Data access abstraction
- **Builder Pattern** - Complex object creation
- **Strategy Pattern** - Flexible validation logic
- **Observer Pattern** - Event-driven communication
- **Factory Pattern** - Entity creation management

### Development & Testing
- **Vitest** - Fast unit testing framework
- **Testing Library** - Component testing utilities
- **ESLint + Prettier** - Code quality and formatting
- **Yarn** - Package management

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0.0+ 
- Yarn 1.22+
- Supabase account (for database)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/trilou.git
cd trilou

# Install dependencies
yarn install

# Set up environment variables
cp .env.example .env.local
# Configure your Supabase credentials

# Start development server
yarn dev
```

The development server will start at `http://localhost:3000/`

### Environment Setup

Create a `.env.local` file with your Supabase credentials:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Available Scripts

```bash
# Development
yarn dev              # Start development server
yarn build            # Build for production
yarn preview          # Preview production build
yarn generate         # Generate static files

# Testing
yarn test             # Run all tests
yarn test:watch       # Run tests in watch mode
yarn test:ui          # Run tests with UI
yarn test:unit        # Run unit tests only
yarn test:integration # Run integration tests only
yarn test:coverage    # Generate test coverage
```

## 📁 Project Structure

```
trilou/
├── app.vue                    # Main application entry point
├── components/                # Vue components
│   ├── TrelloBoard.vue       # Main board container
│   ├── ListItem.vue          # Individual list component
│   ├── Card.vue              # Card component
│   ├── AiTaskModal.vue       # AI task generation modal
│   ├── GoogleLoginButton.vue # Authentication component
│   └── ...                   # Dialog and UI components
├── composables/               # Reusable business logic
│   ├── useCardActions.ts     # Card operations
│   ├── useListActions.ts     # List operations
│   └── ...                   # Other composables
├── stores/                    # Pinia state management
│   └── boardStore.ts         # Main board state
├── server/                    # Backend API
│   ├── api/                  # API routes
│   │   ├── cards/           # Card CRUD operations
│   │   ├── lists/           # List CRUD operations
│   │   └── mcp/             # AI task generation
│   └── utils/               # Server utilities
├── repositories/              # Data access layer
│   ├── CardRepository.ts     # Card data operations
│   └── ListRepository.ts     # List data operations
├── types/                     # TypeScript definitions
├── utils/                     # Utility functions
├── validators/                # Validation strategies
├── builders/                  # Builder pattern implementations
├── factories/                 # Factory pattern implementations
├── events/                    # Event bus system
├── tests/                     # Test suites
│   ├── unit/                # Unit tests
│   ├── integration/         # Integration tests
│   └── fixtures/            # Test data
└── constants/                 # Application constants
```

## 🎮 Feature Highlights

### Core Kanban Functionality

- **Multi-List Management**: Create, edit, delete, and reorder lists
- **Card Operations**: Full CRUD operations with optimistic updates
- **Drag & Drop**: Smooth reordering within lists and between lists
- **Real-time Updates**: Immediate UI feedback with error rollback

### AI-Powered Task Generation

- **MCP Server Integration**: Connect with AI services for task generation
- **Smart Status Mapping**: Automatic priority and status assignment
- **Bulk Task Creation**: Generate multiple related tasks at once
- **Description Support**: Rich task descriptions from AI

### Authentication System

- **Google OAuth**: Quick social login
- **Magic Email Links**: Passwordless authentication
- **Session Management**: Secure user session handling
- **Auto-refresh**: Seamless token management

### Advanced Architecture

- **Optimistic UI**: Instant user feedback with smart error handling
- **Dependency Inversion**: Clean separation of concerns
- **Repository Pattern**: Abstracted data access
- **Event-Driven**: Loosely coupled component communication

## 🎨 UI/UX Features

- **Responsive Design**: Perfect on mobile, tablet, and desktop
- **Smooth Animations**: Polished transitions and micro-interactions
- **Loading States**: Clear feedback during async operations
- **Error Handling**: User-friendly error messages and recovery
- **Accessibility**: Keyboard navigation and screen reader support

## 🧪 Testing Strategy

### Unit Tests
- Component behavior testing
- Store actions and getters
- Utility function validation
- Repository pattern testing

### Integration Tests
- API endpoint testing
- User workflow validation
- Drag-and-drop functionality
- Authentication flows

### Test Coverage
- Comprehensive coverage reports
- Critical path validation
- Edge case handling

## 🏗️ Architecture Principles

### SOLID Principles Implementation

- **S - Single Responsibility**: Each component has one clear purpose
- **O - Open/Closed**: Easy to extend without modifying existing code
- **L - Liskov Substitution**: Interfaces are properly substitutable
- **I - Interface Segregation**: Small, focused interfaces
- **D - Dependency Inversion**: Depend on abstractions, not concretions

### Design Patterns

- **Repository Pattern**: `repositories/` - Data access abstraction
- **Builder Pattern**: `builders/` - Complex object creation
- **Strategy Pattern**: `validators/` - Flexible validation
- **Observer Pattern**: `events/` - Event-driven communication
- **Factory Pattern**: `factories/` - Consistent entity creation

## 📊 Database Schema

### Core Tables

- **users**: User profiles and authentication
- **lists**: Board lists with positioning
- **cards**: Task cards with rich metadata

### Key Features

- **UUID Primary Keys**: Secure, distributed-friendly identifiers
- **Soft Positioning**: Integer-based ordering for smooth reordering
- **Rich Metadata**: Support for descriptions, due dates, and status
- **User Isolation**: Row-level security for multi-tenant support

## 🔧 Development Guidelines

### Code Style

- **TypeScript First**: All new code must be properly typed
- **Chinese Comments**: Business logic comments in Chinese for team clarity
- **Path Aliases**: Use `@/` for clean imports
- **Composition API**: Vue 3 composition API for all components

### File Naming

- **Components**: PascalCase (`TrelloBoard.vue`)
- **Files**: camelCase (`boardStore.ts`)
- **Constants**: UPPER_CASE
- **Types**: PascalCase with descriptive names

### Commit Guidelines

- **Conventional Commits**: Use conventional commit format
- **Scope Definition**: Clear scope for each change
- **Descriptive Messages**: Explain the why, not just the what

For detailed development guidelines, see [CLAUDE.md](./CLAUDE.md).

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on git push

### Manual Deployment

```bash
# Build the application
yarn build

# Deploy the .output directory to your hosting provider
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow the code style guidelines
4. Write tests for new functionality
5. Commit your changes (`git commit -m 'feat: add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Process

1. **Issue First**: Create an issue for significant changes
2. **Test Coverage**: Maintain test coverage for new code
3. **Documentation**: Update relevant documentation
4. **Code Review**: All changes require review

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- **Nuxt Team**: For the amazing framework
- **Supabase Team**: For the backend-as-a-service platform
- **Vue.js Community**: For the reactive framework
- **Open Source Contributors**: For inspiration and tools

---

# Trilou - 整合 MCP server 的 Trello clone

一個使用尖端技術構建的現代化、功能齊全的 Trello clone, 具備 AI 驅動的任務生成、樂觀 UI 更新和全面的拖放功能。

## ✨ 核心特色

- 🎯 **完整看板功能** - 多列表管理，支援完整的增刪改查操作
- 🤖 **AI 任務生成** - 透過 MCP 伺服器整合自動生成任務
- 🖱️ **進階拖放功能** - 流暢的卡片重新排序和跨列表移動
- ⚡ **樂觀 UI 更新** - 閃電般快速的使用者體驗，具備智慧回滾機制
- 🔐 **雙重驗證方式** - Google OAuth + Magic Email 連結登入
- 📱 **響應式設計** - 針對所有裝置尺寸優化
- 🏗️ **SOLID 架構** - 遵循依賴反轉原則的乾淨程式碼
- 🎨 **現代化 UI/UX** - 美觀的 Tailwind CSS 樣式與流暢動畫
- 📝 **完整 TypeScript** - 整個應用程式的完整型別安全
- 🧪 **全面測試** - 使用 Vitest 進行單元測試和整合測試

## 🛠️ 技術棧

### 前端技術
- **Nuxt 3** - 全端 Vue.js 框架
- **Vue 3** - 使用 Composition API 的響應式狀態管理
- **TypeScript** - 型別安全開發
- **Pinia** - 現代化狀態管理
- **Tailwind CSS** - Utility-first CSS 框架
- **Vue Draggable Next** - 拖放功能

### 後端與資料庫
- **Nuxt Server API** - 全端 API 路由
- **Supabase** - PostgreSQL 資料庫與即時功能
- **Supabase Auth** - 身份驗證和使用者管理

### 架構模式
- **Repository Pattern** - 資料存取抽象化
- **Builder Pattern** - 複雜物件建立
- **Strategy Pattern** - 靈活的驗證邏輯
- **Observer Pattern** - 事件驅動通訊
- **Factory Pattern** - 實體建立管理

### 開發與測試
- **Vitest** - 快速單元測試框架
- **Testing Library** - 元件測試工具
- **ESLint + Prettier** - 程式碼品質和格式化
- **Yarn** - 套件管理

## 🚀 快速開始

### 環境需求

- Node.js 18.0.0+ 
- Yarn 1.22+
- Supabase 帳戶（用於資料庫）

### 安裝步驟

```bash
# 複製專案
git clone https://github.com/your-username/trilou.git
cd trilou

# 安裝依賴
yarn install

# 設定環境變數
cp .env.example .env.local
# 配置您的 Supabase 憑證

# 啟動開發伺服器
yarn dev
```

開發伺服器將在 `http://localhost:3000/` 啟動

### 可用指令

```bash
# 開發相關
yarn dev              # 啟動開發伺服器
yarn build            # 建置正式版本
yarn preview          # 預覽正式版本
yarn generate         # 生成靜態檔案

# 測試相關
yarn test             # 執行所有測試
yarn test:watch       # 以監看模式執行測試
yarn test:ui          # 以 UI 模式執行測試
yarn test:unit        # 只執行單元測試
yarn test:integration # 只執行整合測試
yarn test:coverage    # 生成測試覆蓋率報告
```

## 🎮 功能亮點

### 核心看板功能

- **多列表管理**：建立、編輯、刪除和重新排序列表
- **卡片操作**：完整的增刪改查操作，具備樂觀更新
- **拖放功能**：列表內順暢重排和跨列表移動
- **即時更新**：立即的 UI 回饋，具備錯誤回滾機制

### AI 驅動的任務生成

- **MCP 伺服器整合**：連接 AI 服務進行任務生成
- **智慧狀態映射**：自動優先級和狀態分配
- **批量任務建立**：一次生成多個相關任務
- **描述支援**：來自 AI 的豐富任務描述

### 驗證系統

- **Google OAuth**：快速社交登入
- **Magic Email 連結**：無密碼驗證
- **會話管理**：安全的使用者會話處理
- **自動更新**：無縫的 token 管理

### 進階架構

- **樂觀 UI**：即時使用者回饋，具備智慧錯誤處理
- **依賴反轉**：關注點的清晰分離
- **Repository 模式**：抽象化的資料存取
- **事件驅動**：鬆散耦合的元件通訊

## 🏗️ 架構原則

### SOLID 原則實作

- **S - 單一職責**：每個元件都有一個明確的目的
- **O - 開放封閉**：易於擴展而無需修改現有程式碼
- **L - 里氏替換**：介面可以適當地替換
- **I - 介面隔離**：小而專注的介面
- **D - 依賴反轉**：依賴抽象而非具體實作

### 設計模式

- **Repository Pattern**：`repositories/` - 資料存取抽象化
- **Builder Pattern**：`builders/` - 複雜物件建立
- **Strategy Pattern**：`validators/` - 靈活的驗證
- **Observer Pattern**：`events/` - 事件驅動通訊
- **Factory Pattern**：`factories/` - 一致的實體建立

## 📊 資料庫架構

### 核心資料表

- **users**：使用者資料和身份驗證
- **lists**：看板列表與位置資訊
- **cards**：任務卡片與豐富的元資料

### 主要特色

- **UUID 主鍵**：安全、分散式友善的識別碼
- **軟性定位**：基於整數的排序，便於流暢重排
- **豐富元資料**：支援描述、到期日和狀態
- **使用者隔離**：多租戶支援的行級安全性

## 🔧 開發指南

### 程式碼風格

- **TypeScript 優先**：所有新程式碼必須適當的型別化
- **中文註解**：業務邏輯註解使用中文，便於團隊理解
- **路徑別名**：使用 `@/` 進行乾淨的匯入
- **Composition API**：所有元件使用 Vue 3 composition API

### 檔案命名

- **元件**：PascalCase (`TrelloBoard.vue`)
- **檔案**：camelCase (`boardStore.ts`)
- **常數**：UPPER_CASE
- **型別**：PascalCase 配合描述性名稱

詳細的開發指南請參考 [CLAUDE.md](./CLAUDE.md)。

## 🤝 貢獻指南

我們歡迎貢獻！請遵循以下步驟：

1. Fork 這個儲存庫
2. 建立功能分支 (`git checkout -b feature/amazing-feature`)
3. 遵循程式碼風格指南
4. 為新功能撰寫測試
5. 提交變更 (`git commit -m 'feat: add amazing feature'`)
6. 推送到分支 (`git push origin feature/amazing-feature`)
7. 開啟 Pull Request

## 📄 授權

此專案採用 MIT 授權 - 詳見 [LICENSE](./LICENSE) 檔案。

---

**開發時間**：2025年8月