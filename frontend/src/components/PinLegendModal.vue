<template>
  <div class="pin-legend-overlay" @click.self="$emit('close')">
    <div class="legend-modal-content">
      <div class="legend-header">
        <h2>{{ $t('pin_legend.title') }}</h2>
        <button class="legend-close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="legend-body">
        <!-- Green Pin -->
        <div class="legend-item">
          <img :src="greenPin" alt="Green Pin" class="legend-pin-img" />
          <div class="legend-info">
            <span class="legend-title green">{{ $t('pin_legend.green_title') }}</span>
            <span class="legend-desc">{{ $t('pin_legend.green_desc') }}</span>
          </div>
        </div>

        <!-- Yellow Pin -->
        <div class="legend-item">
          <img :src="yellowPin" alt="Yellow Pin" class="legend-pin-img" />
          <div class="legend-info">
            <span class="legend-title yellow">{{ $t('pin_legend.yellow_title') }}</span>
            <span class="legend-desc">{{ $t('pin_legend.yellow_desc') }}</span>
          </div>
        </div>

        <!-- Red Pin -->
        <div class="legend-item">
          <img :src="redPin" alt="Red Pin" class="legend-pin-img" />
          <div class="legend-info">
            <span class="legend-title red">{{ $t('pin_legend.red_title') }}</span>
            <span class="legend-desc">{{ $t('pin_legend.red_desc') }}</span>
          </div>
        </div>
      </div>

      <div class="legend-footer">
        <button class="btn-primary" @click="$emit('close')">{{ $t('common.close') }}</button>
      </div>
    </div>
  </div>
</template>

<script>
import greenPin from '../assets/toiletPin/green.png';
import yellowPin from '../assets/toiletPin/yellow.png';
import redPin from '../assets/toiletPin/red.png';
import '../assets/styles/PinLegendModal.css';

export default {
  name: 'PinLegendModal',
  emits: ['close'],
  setup() {
    return {
      greenPin,
      yellowPin,
      redPin
    };
  }
};
</script>
