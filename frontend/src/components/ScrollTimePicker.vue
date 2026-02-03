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
import '../assets/styles/ScrollTimePicker.css';


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


