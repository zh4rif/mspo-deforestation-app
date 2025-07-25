<template>
  <div class="map-interface">
    <!-- Header -->
    <div class="header">
      <div class="logo-section">
        <img src="/images/mspo-logo.png" alt="MSPO Logo" class="mspo-logo">
        <div class="logo">MSPO Deforestation Monitoring</div>
      </div>

      <div class="controls">
        <div class="control-group">
          <label>Search Location</label>
          <input
            type="text"
            class="search-box"
            v-model="searchQuery"
            @keyup.enter="searchLocation"
            placeholder="Enter city or address..."
          >
        </div>
        <div class="control-group">
          <label>Left Panel</label>
          <select class="layer-select" v-model="leftLayerType" @change="updateLeftLayer">
            <option v-for="(layer, key) in tileLayers" :key="key" :value="key">
              {{ layer.name }}
            </option>
          </select>
        </div>
        <div class="control-group">
          <label>Right Panel</label>
          <select class="layer-select" v-model="rightLayerType" @change="updateRightLayer">
            <option v-for="(layer, key) in tileLayers" :key="key" :value="key">
              {{ layer.name }}
            </option>
          </select>
        </div>
        <button class="search-btn" @click="searchLocation" :disabled="!searchQuery">
          Search
        </button>
      </div>

      <div class="user-controls">
        <span class="user-name">{{ $page.props.auth.user.name }}</span>
        <Link :href="route('logout')" method="post" class="logout-btn">
          Logout
        </Link>
      </div>
    </div>

    <!-- Map Container -->
    <div class="map-container" ref="mapContainer">
      <button
        class="slider-toggle"
        :class="{ active: isSliderEnabled }"
        @click="toggleSlider"
      >
        {{ isSliderEnabled ? 'Split View' : 'Single View' }}
      </button>

      <div class="map-panel left-panel" :class="{ 'single-panel': !isSliderEnabled }">
        <div class="panel-label">{{ tileLayers[leftLayerType]?.name }}</div>
        <div class="map" ref="leftMap"></div>
        <div class="coordinates">{{ leftCoords }}</div>
      </div>

      <div class="map-panel right-panel" :class="{ 'single-panel': !isSliderEnabled }">
        <div class="panel-label">{{ tileLayers[rightLayerType]?.name }}</div>
        <div class="map" ref="rightMap"></div>
        <div class="coordinates">{{ rightCoords }}</div>
      </div>

      <div v-if="isSliderEnabled" class="slider-container" ref="sliderContainer">
        <div class="slider-handle" ref="sliderHandle"></div>
      </div>

      <!-- Overlay Control Panel -->
      <OverlayControlPanel
        v-model:forestLayers="forestLayers"
        @toggle-drawing="toggleDrawingMode"
        @clear-drawings="clearAllDrawings"
        @export-data="exportData"
        @import-data="importData"
        @generate-report="generateReport"
      />

      <button
        class="sync-toggle"
        :class="{ active: isSynced }"
        @click="toggleSync"
        title="Toggle map synchronization"
      >
        <SyncIcon />
      </button>
    </div>

    <!-- Polygon Data Form -->
    <PolygonDataForm
      v-if="showPolygonForm"
      v-model:show="showPolygonForm"
      :polygon-data="currentPolygonData"
      @save="savePolygon"
    />

    <!-- Loading Indicator -->
    <div v-if="loading" class="loading-indicator">
      <div>Loading...</div>
    </div>

    <!-- Messages -->
    <div v-if="message" class="message-popup" :class="messageType">
      {{ message }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { Link } from '@inertiajs/vue3'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import OverlayControlPanel from './OverlayControlPanel.vue'
import PolygonDataForm from './PolygonDataForm.vue'
import SyncIcon from './Icons/SyncIcon.vue'
import { useMapStore } from '@/stores/mapStore'
import { usePolygonStore } from '@/stores/polygonStore'

// Props
const props = defineProps({
  user: Object
})

// Store instances
const mapStore = useMapStore()
const polygonStore = usePolygonStore()

// Map configuration
const DEFAULT_LOCATION = [4.4286, 102.0581]
const DEFAULT_ZOOM = 10
const SEARCH_ZOOM = 12

const tileLayers = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    name: 'OpenStreetMap'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles © Esri',
    name: 'Satellite'
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© OpenTopoMap contributors',
    name: 'Terrain'
  },
  sentinel2020: {
    url: 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/{z}/{y}/{x}.jpg',
    attribution: '© SENTINEL-2 Cloudless 2020, EOX IT Services GmbH',
    name: 'Sentinel-2 2020'
  },
  sentinel2021: {
    url: 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2021_3857/default/g/{z}/{y}/{x}.jpg',
    attribution: '© SENTINEL-2 Cloudless 2021, EOX IT Services GmbH',
    name: 'Sentinel-2 2021'
  },
  sentinel2022: {
    url: 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2022_3857/default/g/{z}/{y}/{x}.jpg',
    attribution: '© SENTINEL-2 Cloudless 2022, EOX IT Services GmbH',
    name: 'Sentinel-2 2022'
  },
  forest: {
    url: 'http://localhost:8080/data/trnforest/{z}/{x}/{y}.jpg',
    attribution: '© Forest Cover 2020',
    name: 'Forest Cover 2020'
  }
}

// Reactive state
const leftMap = ref(null)
const rightMap = ref(null)
const leftLayer = ref(null)
const rightLayer = ref(null)
const leftLayerType = ref('osm')
const rightLayerType = ref('satellite')
const searchQuery = ref('')
const leftCoords = ref('Lat: 0.0000, Lng: 0.0000')
const rightCoords = ref('Lat: 0.0000, Lng: 0.0000')
const isSynced = ref(true)
const isSliderEnabled = ref(true)
const loading = ref(false)
const message = ref('')
const messageType = ref('info')
const showPolygonForm = ref(false)
const currentPolygonData = ref(null)
const forestLayers = ref({})
const isDrawingEnabled = ref(false)
const currentDrawingMode = ref(null)
const polygonPoints = ref([])
const searchMarkers = ref([])

// Template refs
const mapContainer = ref(null)
const leftMapRef = ref(null)
const rightMapRef = ref(null)
const sliderContainer = ref(null)
const sliderHandle = ref(null)

// Map synchronization
let mapSyncLock = false
let isSliderActive = false

const initializeMaps = async () => {
  try {
    await nextTick()

    // Initialize left map
    leftMap.value = L.map(leftMapRef.value, {
      zoomControl: false,
      attributionControl: true
    }).setView(DEFAULT_LOCATION, DEFAULT_ZOOM)

    // Initialize right map
    rightMap.value = L.map(rightMapRef.value, {
      zoomControl: false,
      attributionControl: true
    }).setView(DEFAULT_LOCATION, DEFAULT_ZOOM)

    // Add zoom controls
    L.control.zoom({ position: 'topright' }).addTo(leftMap.value)
    L.control.zoom({ position: 'topright' }).addTo(rightMap.value)

    // Add initial tile layers
    leftLayer.value = L.tileLayer(tileLayers.osm.url, {
      attribution: tileLayers.osm.attribution,
      maxZoom: 18
    }).addTo(leftMap.value)

    rightLayer.value = L.tileLayer(tileLayers.satellite.url, {
      attribution: tileLayers.satellite.attribution,
      maxZoom: 18
    }).addTo(rightMap.value)

    setupMapEvents()
    loadUserPolygons()

    console.log('Maps initialized successfully')
  } catch (error) {
    console.error('Error initializing maps:', error)
    showMessage('Failed to initialize maps', 'error')
  }
}

const setupMapEvents = () => {
  // Map move events
  leftMap.value.on('moveend', () => {
    updateCoordinates(leftMap.value, 'left')
    if (isSynced.value && !mapSyncLock && !isSliderActive) {
      syncMaps(leftMap.value, rightMap.value)
    }
  })

  rightMap.value.on('moveend', () => {
    updateCoordinates(rightMap.value, 'right')
    if (isSynced.value && !mapSyncLock && !isSliderActive) {
      syncMaps(rightMap.value, leftMap.value)
    }
  })

  // Drawing events
  leftMap.value.on('click', onMapClick)
  rightMap.value.on('click', onMapClick)

  leftMap.value.on('dblclick', finishPolygonDrawing)
  rightMap.value.on('dblclick', finishPolygonDrawing)
}

const updateCoordinates = (map, side) => {
  const center = map.getCenter()
  const zoom = map.getZoom()
  const coordText = `Lat: ${center.lat.toFixed(4)}, Lng: ${center.lng.toFixed(4)}, Zoom: ${zoom}`

  if (side === 'left') {
    leftCoords.value = coordText
  } else {
    rightCoords.value = coordText
  }
}

const syncMaps = (sourceMap, targetMap) => {
  if (!isSynced.value || !sourceMap || !targetMap || mapSyncLock) return

  mapSyncLock = true

  try {
    const center = sourceMap.getCenter()
    const zoom = sourceMap.getZoom()
    targetMap.setView(center, zoom, { animate: false })
  } catch (error) {
    console.error('Error syncing maps:', error)
  }

  setTimeout(() => {
    mapSyncLock = false
  }, 100)
}

const updateLeftLayer = () => {
  if (leftMap.value && leftLayer.value) {
    leftMap.value.removeLayer(leftLayer.value)
    const selectedLayer = tileLayers[leftLayerType.value]
    leftLayer.value = L.tileLayer(selectedLayer.url, {
      attribution: selectedLayer.attribution,
      maxZoom: 18
    }).addTo(leftMap.value)
  }
}

const updateRightLayer = () => {
  if (rightMap.value && rightLayer.value) {
    rightMap.value.removeLayer(rightLayer.value)
    const selectedLayer = tileLayers[rightLayerType.value]
    rightLayer.value = L.tileLayer(selectedLayer.url, {
      attribution: selectedLayer.attribution,
      maxZoom: 18
    }).addTo(rightMap.value)
  }
}

const searchLocation = async () => {
  if (!searchQuery.value.trim()) {
    showMessage('Please enter a search term', 'error')
    return
  }

  loading.value = true

  try {
    const response = await axios.get('/api/search/location', {
      params: { query: searchQuery.value }
    })

    if (response.data.success && response.data.data.length > 0) {
      const result = response.data.data[0]
      const lat = result.lat
      const lng = result.lon

      // Clear previous search markers
      clearSearchMarkers()

      // Create search markers
      const searchIcon = L.icon({
        iconUrl: 'data:image/svg+xml;base64,' + btoa(`
          <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.5 0C5.596 0 0 5.596 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.596 19.404 0 12.5 0z" fill="#ef4444"/>
            <circle cx="12.5" cy="12.5" r="6" fill="white"/>
          </svg>
        `),
        iconSize: [25, 41],
        iconAnchor: [12.5, 41],
        popupAnchor: [0, -35]
      })

      const markerLeft = L.marker([lat, lng], { icon: searchIcon }).addTo(leftMap.value)
      const markerRight = L.marker([lat, lng], { icon: searchIcon }).addTo(rightMap.value)

      const popupContent = `
        <div style="max-width: 200px;">
          <b>${result.display_name}</b><br>
          <small>Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}</small>
        </div>
      `

      markerLeft.bindPopup(popupContent).openPopup()
      markerRight.bindPopup(popupContent).openPopup()

      searchMarkers.value.push({ left: markerLeft, right: markerRight })

      leftMap.value.setView([lat, lng], SEARCH_ZOOM)
      if (isSynced.value) {
        rightMap.value.setView([lat, lng], SEARCH_ZOOM)
      }

      showMessage(`Found: ${result.display_name}`, 'success')
    } else {
      showMessage('Location not found', 'error')
    }
  } catch (error) {
    console.error('Search error:', error)
    showMessage('Search failed', 'error')
  } finally {
    loading.value = false
  }
}

const clearSearchMarkers = () => {
  searchMarkers.value.forEach(markerPair => {
    if (markerPair.left && leftMap.value.hasLayer(markerPair.left)) {
      leftMap.value.removeLayer(markerPair.left)
    }
    if (markerPair.right && rightMap.value.hasLayer(markerPair.right)) {
      rightMap.value.removeLayer(markerPair.right)
    }
  })
  searchMarkers.value = []
}

const toggleSlider = () => {
  isSliderEnabled.value = !isSliderEnabled.value

  setTimeout(() => {
    if (leftMap.value) leftMap.value.invalidateSize()
    if (rightMap.value) rightMap.value.invalidateSize()
  }, 300)
}

const toggleSync = () => {
  isSynced.value = !isSynced.value

  if (isSynced.value && leftMap.value && rightMap.value) {
    syncMaps(leftMap.value, rightMap.value)
  }
}

const onMapClick = (e) => {
  if (!isDrawingEnabled.value || currentDrawingMode.value !== 'polygon') return

  const latlng = e.latlng
  polygonPoints.value.push([latlng.lat, latlng.lng])

  // Add point marker
  const marker = {
    left: L.circleMarker(latlng, {
      radius: 4,
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.8
    }).addTo(leftMap.value),
    right: L.circleMarker(latlng, {
      radius: 4,
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.8
    }).addTo(rightMap.value)
  }

  showMessage(`Point ${polygonPoints.value.length} added (Double-click to finish)`, 'info')
}

const finishPolygonDrawing = (e) => {
  e.originalEvent?.stopPropagation()

  if (isDrawingEnabled.value && currentDrawingMode.value === 'polygon' && polygonPoints.value.length >= 3) {
    // Calculate centroid and area
    const centroid = calculatePolygonCentroid(polygonPoints.value)
    const area = calculatePolygonArea(polygonPoints.value)

    currentPolygonData.value = {
      points: [...polygonPoints.value],
      centroid: centroid,
      area: area
    }

    showPolygonForm.value = true
    isDrawingEnabled.value = false
    currentDrawingMode.value = null
  }
}

const calculatePolygonCentroid = (points) => {
  if (points.length < 3) return null

  let area = 0
  let centroidX = 0
  let centroidY = 0

  for (let i = 0; i < points.length; i++) {
    const currentPoint = points[i]
    const nextPoint = points[(i + 1) % points.length]

    const cross = currentPoint[0] * nextPoint[1] - nextPoint[0] * currentPoint[1]
    area += cross
    centroidX += (currentPoint[0] + nextPoint[0]) * cross
    centroidY += (currentPoint[1] + nextPoint[1]) * cross
  }

  area *= 0.5
  if (Math.abs(area) < 1e-10) return null

  centroidX /= (6.0 * area)
  centroidY /= (6.0 * area)

  return [centroidX, centroidY]
}

const calculatePolygonArea = (points) => {
  if (points.length < 3) return 0

  const R = 6371 // Earth's radius in km
  let area = 0

  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length
    const lat1 = points[i][0] * Math.PI / 180
    const lat2 = points[j][0] * Math.PI / 180
    const lng1 = points[i][1] * Math.PI / 180
    const lng2 = points[j][1] * Math.PI / 180

    area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2))
  }

  area = Math.abs(area) * R * R / 2
  return area
}

const loadUserPolygons = async () => {
  try {
    const response = await axios.get('/api/polygons')
    if (response.data.success) {
      // Render polygons on map
      response.data.data.forEach(polygon => {
        renderPolygon(polygon)
      })
    }
  } catch (error) {
    console.error('Error loading polygons:', error)
  }
}

const renderPolygon = (polygon) => {
  const coords = polygon.geometry.coordinates[0].map(coord => [coord[1], coord[0]])

  const leftPolygon = L.polygon(coords, {
    color: '#3b82f6',
    weight: 2,
    opacity: 0.8,
    fillColor: '#3b82f6',
    fillOpacity: 0.3
  }).addTo(leftMap.value)

  const rightPolygon = L.polygon(coords, {
    color: '#3b82f6',
    weight: 2,
    opacity: 0.8,
    fillColor: '#3b82f6',
    fillOpacity: 0.3
  }).addTo(rightMap.value)

  const popupContent = `
    <div style="max-width: 300px;">
      <h4 style="margin: 0 0 10px 0; color: #3b82f6;">${polygon.smallholder_name}</h4>
      <table style="width: 100%; font-size: 12px;">
        <tr><td><b>Object ID:</b></td><td>${polygon.object_id}</td></tr>
        <tr><td><b>License No.:</b></td><td>${polygon.license_no}</td></tr>
        <tr><td><b>State:</b></td><td>${polygon.state}</td></tr>
        <tr><td><b>District:</b></td><td>${polygon.district}</td></tr>
        <tr><td><b>Certified Area:</b></td><td>${polygon.certified_area_ha} HA</td></tr>
        <tr><td><b>Area:</b></td><td>${polygon.area_km2} km²</td></tr>
      </table>
    </div>
  `

  leftPolygon.bindPopup(popupContent)
  rightPolygon.bindPopup(popupContent)
}

const savePolygon = async (polygonData) => {
  try {
    loading.value = true

    const payload = {
      ...polygonData,
      geometry: {
        type: "Polygon",
        coordinates: [currentPolygonData.value.points.map(point => [point[1], point[0]])]
      },
      centroid: currentPolygonData.value.centroid,
      area_km2: currentPolygonData.value.area,
      longitude: currentPolygonData.value.centroid[1],
      latitude: currentPolygonData.value.centroid[0]
    }

    const response = await axios.post('/api/polygons', payload)

    if (response.data.success) {
      showMessage('Polygon saved successfully', 'success')
      renderPolygon(response.data.data)
      polygonPoints.value = []
      currentPolygonData.value = null
    }
  } catch (error) {
    console.error('Error saving polygon:', error)
    showMessage('Failed to save polygon', 'error')
  } finally {
    loading.value = false
  }
}

const showMessage = (text, type = 'info') => {
  message.value = text
  messageType.value = type

  setTimeout(() => {
    message.value = ''
  }, 3000)
}

const toggleDrawingMode = (mode) => {
  if (currentDrawingMode.value === mode) {
    isDrawingEnabled.value = false
    currentDrawingMode.value = null
  } else {
    isDrawingEnabled.value = true
    currentDrawingMode.value = mode
  }
}

const clearAllDrawings = () => {
  // Implementation for clearing drawings
  clearSearchMarkers()
  polygonPoints.value = []
  showMessage('All drawings cleared', 'info')
}

const exportData = async () => {
  try {
    const response = await axios.get('/api/polygons/export/geojson')
    if (response.data.success) {
      const dataStr = JSON.stringify(response.data.data, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)

      const link = document.createElement('a')
      link.href = url
      link.download = `mspo_features_${new Date().toISOString().split('T')[0]}.geojson`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      URL.revokeObjectURL(url)
      showMessage('Data exported successfully', 'success')
    }
  } catch (error) {
    console.error('Export error:', error)
    showMessage('Export failed', 'error')
  }
}

const importData = (event) => {
  // Implementation for importing GeoJSON data
  console.log('Import data functionality')
}

const generateReport = () => {
  // Implementation for generating analysis report
  console.log('Generate report functionality')
}

onMounted(() => {
  initializeMaps()
})

onUnmounted(() => {
  // Cleanup maps
  if (leftMap.value) {
    leftMap.value.remove()
  }
  if (rightMap.value) {
    rightMap.value.remove()
  }
})
</script>

<style scoped>
/* Add the CSS styles from the original HTML file here */
/* This is just a sample - you'll need to copy the full CSS */
.map-interface {
  height: 100vh;
  overflow: hidden;
}

.header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(15px);
  padding: 12px 30px;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 1000;
  position: relative;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.map-container {
  position: relative;
  height: calc(100vh - 70px);
  overflow: hidden;
}

.map-panel {
  position: absolute;
  top: 0;
  bottom: 0;
  overflow: hidden;
  width: 100%;
  transition: clip-path 0.3s ease;
}

.left-panel {
  left: 0;
  z-index: 1;
  clip-path: polygon(0 0, 50% 0, 50% 100%, 0 100%);
}

.right-panel {
  right: 0;
  z-index: 2;
  clip-path: polygon(50% 0, 100% 0, 100% 100%, 50% 100%);
}

.single-panel {
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%) !important;
}

.map {
  width: 100%;
  height: 100%;
}

/* Add remaining styles... */
</style>
