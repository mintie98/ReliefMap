<template>
  <div class="location-picker-overlay" @click.self="$emit('close')">
    <div class="picker-modal">
      <div class="picker-header">
        <h3>{{ $t('location_picker.title') }}</h3>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="modal-body scroller">
        <div class="picker-search">
          <span class="search-icon">{{ ICONS.SEARCH }}</span>
          <input 
            type="text" 
            v-model="searchQuery" 
            :placeholder="$t('location_picker.search_placeholder')"
            class="picker-input"
          >
        </div>

        <div class="picker-list">
          <div 
            v-for="loc in filteredList" 
            :key="loc.location_id" 
            class="picker-item"
            @click="$emit('select', loc)"
          >
            <div class="item-icon">
              <img :src="getPinIcon(loc)" alt="pin" />
            </div>
            <div class="item-info">
              <div class="item-name">{{ loc.display_name }}</div>
              <div class="item-address">{{ loc.address }}</div>
            </div>
            <div class="item-action">
              <span class="action-arrow">›</span>
            </div>
          </div>
          
          <div v-if="filteredList.length === 0" class="no-results">
            {{ $t('location_picker.no_results') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { ICONS } from '../assets/icons';
import pinGreen from '../assets/toiletPin/green.png';
import pinYellow from '../assets/toiletPin/yellow.png';
import pinRed from '../assets/toiletPin/red.png';
import '../assets/styles/LocationPickerModal.css';

export default {
  name: 'LocationPickerModal',
  props: {
    locations: {
      type: Array,
      default: () => []
    }
  },
  emits: ['close', 'select'],
  setup(props) {
    const searchQuery = ref('');

    const filteredList = computed(() => {
      const list = props.locations || [];
      if (!searchQuery.value) return list.slice(0, 10); // Show top 10 default
      
      const q = searchQuery.value.toLowerCase();
      return list.filter(loc => 
        (loc.display_name && loc.display_name.toLowerCase().includes(q)) || 
        (loc.address && loc.address.toLowerCase().includes(q))
      ).slice(0, 20);
    });
    
    // Debug
    onMounted(() => {
      console.log('LocationPickerModal mounted. Locations count:', (props.locations || []).length);
    });

    const getPinIcon = (loc) => {
        if (loc.source_type === 'api') return pinGreen;
        const status = loc.verification_status;
        if (status === 'verified' || status === 'green') return pinGreen;
        if (status === 'yellow' || status === 'in_review') return pinYellow;
        return pinRed;
    };

    return {
      searchQuery,
      filteredList,
      getPinIcon,
      ICONS
    };
  }
};
</script>
