<template>
  <div class="picker-overlay" @click.self="close">
    <div class="picker-container">
      <div class="picker-header">
        <button class="picker-btn cancel" @click="close">{{ $t('common.cancel') || 'Cancel' }}</button>
        <h3>{{ title }}</h3>
        <button class="picker-btn confirm" @click="confirm">{{ $t('common.confirm') || 'OK' }}</button>
      </div>
      
      <div class="picker-body">
        <div class="picker-highlight"></div>
        
        <!-- Hour Column -->
        <div class="picker-column" ref="hourCol" @scroll="onScroll($event, 'hour')">
          <div class="picker-spacer"></div>
          <div 
            v-for="h in hours" 
            :key="'h'+h" 
            class="picker-item"
            :class="{ active: currentHour === h }"
          >
            {{ formatNum(h) }}
          </div>
          <div class="picker-spacer"></div>
        </div>
        
        <!-- Separator -->
        <div style="display:flex; align-items:center; font-weight:bold;">:</div>

        <!-- Minute Column -->
        <div class="picker-column" ref="minCol" @scroll="onScroll($event, 'min')">
          <div class="picker-spacer"></div>
          <div 
            v-for="m in minutes" 
            :key="'m'+m" 
            class="picker-item"
            :class="{ active: currentMinute === m }"
          >
            {{ formatNum(m) }}
          </div>
          <div class="picker-spacer"></div>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
// ScrollTimePicker.vue
// A lightweight iOS-style scroll picker implementation
import { ref, onMounted, nextTick } from 'vue';


export default {
  name: 'ScrollTimePicker',
  props: {
    title: { type: String, default: 'Select Time' },
    initialTime: { type: String, default: '12:00' } // Format HH:MM
  },
  emits: ['close', 'confirm'],
  setup(props, { emit }) {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 12 }, (_, i) => i * 5); // 0, 5, 10... step 5 for easier picking

    const [initH, initM] = props.initialTime ? props.initialTime.split(':').map(Number) : [12, 0];
    
    // Nearest 5 min
    let safeMin = Math.round(initM / 5) * 5;
    if (safeMin >= 60) safeMin = 55;

    const currentHour = ref(initH || 12);
    const currentMinute = ref(safeMin || 0);

    const hourCol = ref(null);
    const minCol = ref(null);
    const ITEM_HEIGHT = 36;

    const formatNum = (n) => (n < 10 ? '0' + n : n);

    const scrollTo = (col, value, dataset) => {
      if (!col) return;
      const index = dataset.indexOf(value);
      if (index !== -1) {
        col.scrollTop = index * ITEM_HEIGHT;
      }
    };

    onMounted(async () => {
      await nextTick();
      // Scroll to initial positions
      scrollTo(hourCol.value, currentHour.value, hours);
      scrollTo(minCol.value, currentMinute.value, minutes);
    });

    let scrollTimeout = null;

    const onScroll = (e, type) => {
      const target = e.target;
      clearTimeout(scrollTimeout);
      
      // Debounce snapping logic visual update to avoid heavy reactiveness during scroll
      scrollTimeout = setTimeout(() => {
        const scrollTop = target.scrollTop;
        const index = Math.round(scrollTop / ITEM_HEIGHT);
        
        if (type === 'hour') {
           const val = hours[index];
           if (val !== undefined) currentHour.value = val;
        } else {
           const val = minutes[index];
           if (val !== undefined) currentMinute.value = val;
        }
      }, 50);
    };

    const confirm = () => {
      const timeStr = `${formatNum(currentHour.value)}:${formatNum(currentMinute.value)}`;
      emit('confirm', timeStr);
    };

    const close = () => {
      emit('close');
    };

    return {
      hours,
      minutes,
      currentHour,
      currentMinute,
      hourCol,
      minCol,
      formatNum,
      onScroll,
      confirm,
      close
    };
  }
};
</script>

<style>
/* ScrollTimePicker Styles */
.picker-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: flex-end;
    z-index: 3000;
    backdrop-filter: blur(2px);
    opacity: 0;
    animation: fadeIn 0.3s forwards;
}

.picker-container {
    width: 100%;
    max-width: 500px;
    background: white;
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
    overflow: hidden;
    transform: translateY(100%);
    animation: slideUp 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
    padding-bottom: calc(env(safe-area-inset-bottom) + 20px);
}

@keyframes fadeIn {
    to { opacity: 1; }
}

@keyframes slideUp {
    to { transform: translateY(0); }
}

/* Desktop / Web Version: Center the popup */
@media (min-width: 600px) {
    .picker-overlay {
        align-items: center; /* Center vertically */
    }

    .picker-container {
        width: 320px; /* Compact width */
        max-width: 90%;
        border-radius: 16px; /* All corners rounded */
        padding-bottom: 0; /* Remove extra bottom padding */
        transform: scale(0.9);
        opacity: 0;
        animation: popIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards;
    }
}

@keyframes popIn {
    to {
        transform: scale(1);
        opacity: 1;
    }
}

.picker-header {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    padding: 6px 12px; /* Reduced side padding, moved up slightly */
    background-color: #f7f7f7;
    border-bottom: 1px solid #e0e0e0;
}

.picker-header h3 {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
    color: #333;
    justify-self: center; /* Center the title */
}

.picker-btn {
    border: none;
    background: none;
    font-size: 0.95rem;
    cursor: pointer;
    padding: 4px 8px;
}

.picker-btn.cancel { 
    color: #999; 
    justify-self: start; /* Align cancel to left */
}
.picker-btn.confirm { 
    color: #007aff; 
    font-weight: 600; 
    justify-self: end; /* Align confirm to right */
}

/* Wheel Area */
.picker-body {
    position: relative;
    height: 180px;
    display: flex;
    justify-content: center;
    background: white;
    user-select: none;
    -webkit-user-select: none;
    mask-image: linear-gradient(to bottom, transparent, black 20%, black 80%, transparent);
    -webkit-mask-image: linear-gradient(to bottom, transparent, black 20%, black 80%, transparent);
}

/* Highlight Bar (Selection box) */
.picker-highlight {
    position: absolute;
    top: 50%;
    left: 0;
    width: 100%;
    height: 36px;
    margin-top: -18px;
    background-color: rgba(0, 0, 0, 0.04);
    border-top: 1px solid #eee;
    border-bottom: 1px solid #eee;
    pointer-events: none;
    z-index: 10;
    box-sizing: border-box;
}

.picker-column {
    flex: 1;
    height: 100%;
    overflow-y: scroll;
    scroll-snap-type: y mandatory;
    text-align: center;
    font-size: 1.2rem;
    position: relative;
    -ms-overflow-style: none;
    scrollbar-width: none;
}

.picker-column::-webkit-scrollbar { display: none; }

.picker-spacer {
    height: 72px; /* (180 - 36) / 2 */
}

.picker-item {
    height: 36px;
    line-height: 36px;
    scroll-snap-align: center;
    color: #ccc;
    transition: all 0.2s;
    font-variant-numeric: tabular-nums; /* fixes width jitter */
}

.picker-item.active {
    color: #000;
    font-weight: 600;
}
</style>
