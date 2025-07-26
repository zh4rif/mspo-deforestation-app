import { defineStore } from 'pinia'

export const useMapStore = defineStore('map', {
  state: () => ({
    // Map instance and configuration
    mapInstance: null,
    mapCenter: [4.2105, 101.9758], // Malaysia coordinates
    mapZoom: 6,
    mapStyle: 'satellite', // satellite, terrain, roadmap, hybrid

    // Layer visibility
    layers: {
      deforestation: true,
      forestCover: true,
      protectedAreas: false,
      roads: false,
      settlements: false,
      waterBodies: true
    },

    // Deforestation data
    deforestationPolygons: [],
    selectedPolygon: null,
    polygonFilter: {
      severity: 'all', // all, low, medium, high, critical
      dateRange: {
        start: null,
        end: null
      },
      area: {
        min: 0,
        max: null
      },
      cause: 'all' // all, agriculture, logging, infrastructure, mining, urban, natural, unknown
    },

    // Forest cover data
    forestCoverData: {
      totalArea: 0,
      lossArea: 0,
      lossPercentage: 0,
      gainArea: 0,
      gainPercentage: 0,
      lastUpdated: null
    },

    // Analysis tools
    analysisMode: false,
    drawingMode: false,
    measurementMode: false,

    // UI state
    isLoading: false,
    isSyncing: false,
    showSidebar: true,
    showLegend: true,
    showDataPanel: false,
    activeTab: 'overview', // overview, analysis, reports, settings

    // Search and location
    searchResults: [],
    currentLocation: null,

    // Time series data
    timeSeriesData: [],
    selectedTimeRange: '1year', // 1month, 3months, 6months, 1year, 2years, 5years, all

    // Alert system
    alerts: [],
    newAlertsCount: 0,

    // Export and reports
    exportInProgress: false,
    lastExportDate: null,

    // User preferences
    userPreferences: {
      autoSync: true,
      syncInterval: 60, // minutes
      alertTypes: ['high', 'critical'],
      emailNotifications: false,
      language: 'en'
    }
  }),

  getters: {
    // Get filtered polygons based on current filter settings
    filteredPolygons: (state) => {
      return state.deforestationPolygons.filter(polygon => {
        const props = polygon.properties || {};

        // Filter by severity
        if (state.polygonFilter.severity !== 'all' && props.severity !== state.polygonFilter.severity) {
          return false;
        }

        // Filter by date range
        if (state.polygonFilter.dateRange.start || state.polygonFilter.dateRange.end) {
          const detectedDate = new Date(props.detectedDate);
          const startDate = state.polygonFilter.dateRange.start ? new Date(state.polygonFilter.dateRange.start) : null;
          const endDate = state.polygonFilter.dateRange.end ? new Date(state.polygonFilter.dateRange.end) : null;

          if (startDate && detectedDate < startDate) return false;
          if (endDate && detectedDate > endDate) return false;
        }

        // Filter by area
        const area = parseFloat(props.area) || 0;
        if (area < state.polygonFilter.area.min) return false;
        if (state.polygonFilter.area.max && area > state.polygonFilter.area.max) return false;

        // Filter by cause
        if (state.polygonFilter.cause !== 'all' && props.cause !== state.polygonFilter.cause) {
          return false;
        }

        return true;
      });
    },

    // Get statistics for filtered polygons
    filteredStatistics: (state) => {
      const filtered = state.filteredPolygons;

      return {
        count: filtered.length,
        totalArea: filtered.reduce((sum, polygon) => sum + (parseFloat(polygon.properties?.area) || 0), 0),
        severityBreakdown: {
          low: filtered.filter(p => p.properties?.severity === 'low').length,
          medium: filtered.filter(p => p.properties?.severity === 'medium').length,
          high: filtered.filter(p => p.properties?.severity === 'high').length,
          critical: filtered.filter(p => p.properties?.severity === 'critical').length
        },
        causeBreakdown: {
          agriculture: filtered.filter(p => p.properties?.cause === 'agriculture').length,
          logging: filtered.filter(p => p.properties?.cause === 'logging').length,
          infrastructure: filtered.filter(p => p.properties?.cause === 'infrastructure').length,
          mining: filtered.filter(p => p.properties?.cause === 'mining').length,
          urban: filtered.filter(p => p.properties?.cause === 'urban').length,
          natural: filtered.filter(p => p.properties?.cause === 'natural').length,
          unknown: filtered.filter(p => p.properties?.cause === 'unknown').length
        }
      };
    },

    // Get recent alerts (last 30 days)
    recentAlerts: (state) => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      return state.alerts.filter(alert => new Date(alert.date) >= thirtyDaysAgo);
    },

    // Check if any layers are loading
    isAnyLayerLoading: (state) => {
      return state.isLoading || state.isSyncing || state.exportInProgress;
    }
  },

  actions: {
    // Map actions
    setMapInstance(mapInstance) {
      this.mapInstance = mapInstance;
    },

    updateMapCenter(center) {
      this.mapCenter = center;
    },

    updateMapZoom(zoom) {
      this.mapZoom = zoom;
    },

    setMapStyle(style) {
      this.mapStyle = style;
    },

    // Layer actions
    toggleLayer(layerName) {
      if (this.layers.hasOwnProperty(layerName)) {
        this.layers[layerName] = !this.layers[layerName];
      }
    },

    setLayerVisibility(layerName, visible) {
      if (this.layers.hasOwnProperty(layerName)) {
        this.layers[layerName] = visible;
      }
    },

    // Polygon actions
    setDeforestationPolygons(polygons) {
      this.deforestationPolygons = polygons;
    },

    addDeforestationPolygon(polygon) {
      this.deforestationPolygons.push(polygon);
    },

    updateDeforestationPolygon(id, updatedPolygon) {
      const index = this.deforestationPolygons.findIndex(p => p.id === id);
      if (index !== -1) {
        this.deforestationPolygons[index] = { ...this.deforestationPolygons[index], ...updatedPolygon };
      }
    },

    removeDeforestationPolygon(id) {
      this.deforestationPolygons = this.deforestationPolygons.filter(p => p.id !== id);
    },

    selectPolygon(polygon) {
      this.selectedPolygon = polygon;
    },

    clearSelection() {
      this.selectedPolygon = null;
    },

    // Filter actions
    updatePolygonFilter(filterUpdate) {
      this.polygonFilter = { ...this.polygonFilter, ...filterUpdate };
    },

    resetFilters() {
      this.polygonFilter = {
        severity: 'all',
        dateRange: { start: null, end: null },
        area: { min: 0, max: null },
        cause: 'all'
      };
    },

    // Data loading actions
    async fetchDeforestationData() {
      this.isLoading = true;
      try {
        // Simulate API call - replace with actual API endpoint
        const response = await fetch('/api/deforestation-data');
        const data = await response.json();
        this.setDeforestationPolygons(data.polygons || []);

        // Update forest cover data
        if (data.forestCover) {
          this.forestCoverData = data.forestCover;
        }

        return data;
      } catch (error) {
        console.error('Error fetching deforestation data:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async syncData() {
      this.isSyncing = true;
      try {
        const data = await this.fetchDeforestationData();

        // Check for new alerts
        await this.checkForNewAlerts();

        return data;
      } catch (error) {
        console.error('Error syncing data:', error);
        throw error;
      } finally {
        this.isSyncing = false;
      }
    },

    // Alert actions
    async checkForNewAlerts() {
      try {
        const response = await fetch('/api/alerts');
        const alerts = await response.json();

        const newAlerts = alerts.filter(alert =>
          !this.alerts.some(existing => existing.id === alert.id)
        );

        this.alerts.push(...newAlerts);
        this.newAlertsCount += newAlerts.length;

        return newAlerts;
      } catch (error) {
        console.error('Error checking for alerts:', error);
      }
    },

    markAlertsAsRead() {
      this.newAlertsCount = 0;
    },

    dismissAlert(alertId) {
      this.alerts = this.alerts.filter(alert => alert.id !== alertId);
    },

    // Analysis actions
    enableAnalysisMode() {
      this.analysisMode = true;
      this.drawingMode = false;
      this.measurementMode = false;
    },

    enableDrawingMode() {
      this.drawingMode = true;
      this.analysisMode = false;
      this.measurementMode = false;
    },

    enableMeasurementMode() {
      this.measurementMode = true;
      this.analysisMode = false;
      this.drawingMode = false;
    },

    disableAllModes() {
      this.analysisMode = false;
      this.drawingMode = false;
      this.measurementMode = false;
    },

    // UI actions
    toggleSidebar() {
      this.showSidebar = !this.showSidebar;
    },

    toggleLegend() {
      this.showLegend = !this.showLegend;
    },

    toggleDataPanel() {
      this.showDataPanel = !this.showDataPanel;
    },

    setActiveTab(tab) {
      this.activeTab = tab;
    },

    // Search actions
    async searchLocation(query) {
      try {
        // Simulate geocoding API call
        const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
        const results = await response.json();
        this.searchResults = results;
        return results;
      } catch (error) {
        console.error('Error searching location:', error);
        this.searchResults = [];
        return [];
      }
    },

    setCurrentLocation(location) {
      this.currentLocation = location;
      if (location && location.coordinates) {
        this.updateMapCenter(location.coordinates);
        this.updateMapZoom(12);
      }
    },

    // Time series actions
    setTimeRange(range) {
      this.selectedTimeRange = range;
    },

    async fetchTimeSeriesData(startDate, endDate) {
      try {
        const response = await fetch(`/api/time-series?start=${startDate}&end=${endDate}`);
        const data = await response.json();
        this.timeSeriesData = data;
        return data;
      } catch (error) {
        console.error('Error fetching time series data:', error);
        throw error;
      }
    },

    // Export actions
    async exportData(format = 'geojson', options = {}) {
      this.exportInProgress = true;
      try {
        const payload = {
          format,
          data: this.filteredPolygons,
          options,
          filters: this.polygonFilter
        };

        const response = await fetch('/api/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `deforestation-data-${Date.now()}.${format}`;
        a.click();

        this.lastExportDate = new Date().toISOString();

      } catch (error) {
        console.error('Error exporting data:', error);
        throw error;
      } finally {
        this.exportInProgress = false;
      }
    },

    // User preferences
    updateUserPreferences(preferences) {
      this.userPreferences = { ...this.userPreferences, ...preferences };

      // Save to localStorage
      localStorage.setItem('mapUserPreferences', JSON.stringify(this.userPreferences));
    },

    loadUserPreferences() {
      const saved = localStorage.getItem('mapUserPreferences');
      if (saved) {
        try {
          this.userPreferences = { ...this.userPreferences, ...JSON.parse(saved) };
        } catch (error) {
          console.error('Error loading user preferences:', error);
        }
      }
    },

    // Reset store
    resetStore() {
      this.deforestationPolygons = [];
      this.selectedPolygon = null;
      this.searchResults = [];
      this.alerts = [];
      this.newAlertsCount = 0;
      this.timeSeriesData = [];
      this.resetFilters();
      this.disableAllModes();
    }
  }
})

// Helper function for other components to use
export function useMapActions() {
  const store = useMapStore();

  return {
    // Commonly used actions
    selectPolygon: store.selectPolygon,
    clearSelection: store.clearSelection,
    toggleLayer: store.toggleLayer,
    syncData: store.syncData,
    exportData: store.exportData,
    searchLocation: store.searchLocation,
    updateFilter: store.updatePolygonFilter,
    resetFilters: store.resetFilters
  };
}
