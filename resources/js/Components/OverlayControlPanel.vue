
<template>
  <div class="overlay-control">
    <div class="overlay-header">
      <div class="overlay-title">Map Layers & Tools</div>
      <button class="overlay-toggle" @click="togglePanel">
        <ChevronDownIcon :class="{ 'rotate-180': isOpen }" />
      </button>
    </div>

    <div v-show="isOpen" class="overlay-content">
      <!-- Forest Classification Layers -->
      <div class="overlay-section">
        <div class="section-title">Forest Classification</div>

        <div v-for="(layer, key) in forestLayerTypes" :key="key" class="layer-item">
          <div class="layer-info">
            <div class="layer-color" :style="{ background: layer.color }"></div>
            <div class="layer-name">{{ layer.name }}</div>
          </div>
          <div class="layer-controls">
            <input
              type="range"
              class="opacity-slider"
              min="0"
              max="100"
              :value="layer.opacity * 100"
              @input="updateLayerOpacity(key, $event.target.value)"
            >
            <div
              class="layer-toggle"
              :class="{ active: layer.visible }"
              @click="toggleLayer(key)"
            ></div>
          </div>
        </div>
      </div>

      <!-- Drawing Tools -->
      <div class="overlay-section">
        <div class="section-title">Drawing Tools</div>
        <div class="drawing-tools">
          <button
            class="tool-btn"
            :class="{ active: currentDrawingMode === 'polygon' }"
            @click="$emit('toggle-drawing', 'polygon')"
          >
            🔺 Draw Polygon
          </button>
          <button
            class="tool-btn"
            :class="{ active: currentDrawingMode === 'rectangle' }"
            @click="$emit('toggle-drawing', 'rectangle')"
          >
            ⬜ Draw Rectangle
          </button>
          <button class="tool-btn" @click="$emit('clear-drawings')">
            🗑️ Clear All
          </button>
          <button class="tool-btn" @click="$emit('export-data')">
            💾 Export Data
          </button>
          <button class="tool-btn" @click="triggerFileInput">
            📁 Import GeoJSON
          </button>
        </div>
      </div>

      <!-- Analysis Tools -->
      <div class="overlay-section">
        <div class="section-title">Analysis</div>
        <div class="drawing-tools">
          <button
            class="tool-btn"
            :class="{ active: currentDrawingMode === 'measure' }"
            @click="$emit('toggle-drawing', 'measure')"
          >
            📏 Measure Area
          </button>
          <button class="tool-btn" @click="$emit('generate-report')">
            📊 Generate Report
          </button>
        </div>
      </div>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept=".geojson,.json"
      style="display: none"
      @change="handleFileImport"
    >
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'

// Props and emits
const props = defineProps({
  forestLayers: Object,
  currentDrawingMode: String
})

const emit = defineEmits([
  'toggle-drawing',
  'clear-drawings',
  'export-data',
  'import-data',
  'generate-report',
  'update:forestLayers'
])

// Reactive state
const isOpen = ref(true)
const fileInput = ref(null)

const forestLayerTypes = ref({
  deforestation: {
    name: 'Deforestation Areas',
    color: '#dc2626',
    visible: false,
    opacity: 0.7
  },
  regrowth: {
    name: 'Regrowth Areas',
    color: '#16a34a',
    visible: false,
    opacity: 0.7
  },
  primaryForest: {
    name: 'Primary Forest',
    color: '#065f46',
    visible: false,
    opacity: 0.7
  },
  disturbedForest: {
    name: 'Disturbed Forest',
    color: '#fbbf24',
    visible: false,
    opacity: 0.7
  }
})

const togglePanel = () => {
  isOpen.value = !isOpen.value
}

const toggleLayer = (layerKey) => {
  forestLayerTypes.value[layerKey].visible = !forestLayerTypes.value[layerKey].visible
  emit('update:forestLayers', forestLayerTypes.value)
}

const updateLayerOpacity = (layerKey, value) => {
  forestLayerTypes.value[layerKey].opacity = value / 100
  emit('update:forestLayers', forestLayerTypes.value)
}

const triggerFileInput = () => {
  fileInput.value.click()
}

const handleFileImport = (event) => {
  const file = event.target.files[0]
  if (file) {
    emit('import-data', file)
  }
  event.target.value = ''
}
</script>

<style scoped>
.overlay-control {
  position: absolute;
  top: 15px;
  right: 80px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(15px);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  z-index: 1001;
  min-width: 280px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}

.overlay-header {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.overlay-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.overlay-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: #6b7280;
  transition: all 0.2s ease;
}

.overlay-content {
  padding: 16px;
}

.overlay-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.layer-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.layer-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.layer-color {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  border: 1px solid rgba(0, 0, 0, 0.2);
}

.layer-name {
  font-size: 13px;
  color: #374151;
  font-weight: 500;
}

.layer-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.opacity-slider {
  width: 60px;
  height: 4px;
  border-radius: 2px;
  background: #e5e7eb;
  outline: none;
  -webkit-appearance: none;
}

.layer-toggle {
  position: relative;
  width: 36px;
  height: 20px;
  background: #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.layer-toggle.active {
  background: #3b82f6;
}

.layer-toggle::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s ease;
}

.layer-toggle.active::after {
  transform: translateX(16px);
}

.drawing-tools {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tool-btn {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
  text-align: left;
}

.tool-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(16, 185, 129, 0.3);
}

.tool-btn.active {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.rotate-180 {
  transform: rotate(180deg);
}
</style>
