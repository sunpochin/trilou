<script setup lang="ts">
import { useAuth } from '@/composables/useAuth';
import { onMounted } from 'vue';

// 取得認證相關功能
const { initializeAuth } = useAuth();

// 執行認證初始化（在客戶端掛載時）
onMounted(() => {
  // 只在客戶端掛載後執行初始化
  initializeAuth()
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style scoped>
/* 測試帳號登入按鈕樣式 - 與 Google 按鈕一致 */
.test-login-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  background-color: white;
  border: 2px solid #dadce0;
  border-radius: 0.5rem;
  color: #3c4043;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  width: 180px; /* 比 Google 按鈕稍窄 */
}

.test-login-btn:hover {
  background-color: #f8f9fa;
  border-color: #dadce0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.test-login-btn:active {
  transform: translateY(0);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.test-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  color: #5f6368;
}

/* 🎨 AI 按鈕的神秘魔法效果 */
.ai-button-magic {
  background: linear-gradient(45deg, #3B82F6, #6366F1, #8B5CF6, #3B82F6);
  background-size: 400% 400%;
  animation: magicGlow 4s ease-in-out infinite;
  position: relative;
}

.ai-button-magic::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, #3B82F6, #6366F1, #8B5CF6, #A855F7, #3B82F6);
  background-size: 400% 400%;
  border-radius: inherit;
  z-index: -1;
  animation: magicBorder 3s ease-in-out infinite;
  opacity: 0.7;
}

.ai-button-magic:hover {
  animation: magicGlowFast 2s ease-in-out infinite;
  transform: translateY(-1px);
}

/* 🌟 生成中的強化魔法效果 */
.ai-generating-magic {
  background: linear-gradient(45deg, #7C3AED, #3B82F6, #EC4899, #F59E0B, #7C3AED);
  background-size: 800% 800%;
  animation: generatingMagic 1.5s ease-in-out infinite;
  position: relative;
}

.ai-generating-magic::before {
  content: '';
  position: absolute;
  top: -3px;
  left: -3px;
  right: -3px;
  bottom: -3px;
  background: linear-gradient(45deg, #7C3AED, #3B82F6, #EC4899, #F59E0B, #10B981, #7C3AED);
  background-size: 1000% 1000%;
  border-radius: inherit;
  z-index: -1;
  animation: generatingBorder 1s ease-in-out infinite;
  opacity: 0.9;
}

.ai-generating-magic::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
  border-radius: inherit;
  transform: translate(-50%, -50%);
  animation: magicPulse 2s ease-in-out infinite;
}

/* 🎭 動畫關鍵幀定義 */
@keyframes magicGlow {
  0%, 100% {
    background-position: 0% 50%;
    filter: brightness(1) saturate(1);
  }
  25% {
    background-position: 100% 50%;
    filter: brightness(1.1) saturate(1.2);
  }
  50% {
    background-position: 50% 100%;
    filter: brightness(1.2) saturate(1.3);
  }
  75% {
    background-position: 0% 100%;
    filter: brightness(1.1) saturate(1.2);
  }
}

@keyframes magicGlowFast {
  0%, 100% {
    background-position: 0% 50%;
    filter: brightness(1.2) saturate(1.3);
  }
  50% {
    background-position: 100% 50%;
    filter: brightness(1.4) saturate(1.5);
  }
}

@keyframes magicBorder {
  0%, 100% {
    background-position: 0% 50%;
    opacity: 0.5;
  }
  50% {
    background-position: 100% 50%;
    opacity: 0.8;
  }
}

@keyframes generatingMagic {
  0% {
    background-position: 0% 50%;
    filter: brightness(1.3) saturate(1.5) hue-rotate(0deg);
  }
  33% {
    background-position: 100% 50%;
    filter: brightness(1.5) saturate(1.7) hue-rotate(120deg);
  }
  66% {
    background-position: 50% 100%;
    filter: brightness(1.4) saturate(1.6) hue-rotate(240deg);
  }
  100% {
    background-position: 0% 50%;
    filter: brightness(1.3) saturate(1.5) hue-rotate(360deg);
  }
}

@keyframes generatingBorder {
  0% {
    background-position: 0% 50%;
    opacity: 0.7;
    filter: blur(0px);
  }
  50% {
    background-position: 100% 50%;
    opacity: 1;
    filter: blur(1px);
  }
  100% {
    background-position: 0% 50%;
    opacity: 0.7;
    filter: blur(0px);
  }
}

@keyframes magicPulse {
  0%, 100% {
    opacity: 0.3;
    transform: translate(-50%, -50%) scale(0.8);
  }
  50% {
    opacity: 0.6;
    transform: translate(-50%, -50%) scale(1.2);
  }
}

/* 🌈 額外的魔法粒子效果（為按鈕添加更多神秘感） */
.ai-button-magic:hover::after,
.ai-generating-magic::after {
  animation: magicPulse 1.5s ease-in-out infinite;
}

/* 🌈 Countdown 顯示的彩虹漸層效果 */
.countdown-display {
  background: linear-gradient(
    45deg,
    #ff0000,  /* 紅 */
    #ff8000,  /* 橘 */
    #ffff00,  /* 黃 */
    #80ff00,  /* 綠 */
    #00ff80,  /* 青 */
    #0080ff,  /* 藍 */
    #8000ff,  /* 靛 */
    #ff0080   /* 紫 */
  );
  background-size: 800% 100%;
  animation: rainbowFlow 6s ease-in-out infinite;
  position: relative;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.countdown-display::before {
  content: '';
  position: absolute;
  inset: -2px;
  background: linear-gradient(
    45deg,
    #ff0000,  /* 紅 */
    #ff8000,  /* 橘 */
    #ffff00,  /* 黃 */
    #80ff00,  /* 綠 */
    #00ff80,  /* 青 */
    #0080ff,  /* 藍 */
    #8000ff,  /* 靛 */
    #ff0080   /* 紫 */
  );
  background-size: 800% 100%;
  border-radius: inherit;
  z-index: -1;
  animation: rainbowFlow 6s ease-in-out infinite;
  opacity: 0.6;
  filter: blur(4px);
}

/* 🕐 時鐘轉動動畫 */
.clock-icon {
  animation: clockRotate 4s linear infinite;
  transform-origin: center;
}

/* 🌈 彩虹流動動畫 */
@keyframes rainbowFlow {
  0% {
    background-position: 0% 50%;
  }
  25% {
    background-position: 100% 50%;
  }
  50% {
    background-position: 200% 50%;
  }
  75% {
    background-position: 300% 50%;
  }
  100% {
    background-position: 400% 50%;
  }
}

/* 🕐 時鐘轉動動畫 */
@keyframes clockRotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 📱 手機版拖拽全局樣式 - 修復版本 */
.sortable-fallback,
.card-fallback {
  opacity: 0.8 !important;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3) !important;
  border: 2px solid #10b981 !important;
  border-radius: 8px !important;
  background: rgba(255, 255, 255, 0.95) !important;
  /* 移除會導致問題的樣式：rotate, position fixed, pointer-events none */
}

/* 📱 手機版拖拽時的觸摸區域 */
body.mobile-dragging {
  user-select: none !important;
  -webkit-user-select: none !important;
  -webkit-touch-callout: none !important;
}

/* 📱 拖拽過程中防止滾動 */
.sortable-drag-active {
  overflow: hidden !important;
}

/* 🎯 全域修正：防止任何元素出現藍色 focus 外框 */
*:focus {
  outline: none !important;
}




/* 🎯 防止瀏覽器預設的選取高亮 */
::selection {
  background: rgba(59, 130, 246, 0.1);
}

::-moz-selection {
  background: rgba(59, 130, 246, 0.1);
}
</style>
