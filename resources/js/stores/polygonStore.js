import { defineStore } from 'pinia'
import { useMapStore } from './mapStore'

export const usePolygonStore = defineStore('polygon', {
  state: () => ({
    // Polygon management
    polygons: [],
    selectedPolygonId: null,
    hoveredPolygonId: null,

    // Drawing and editing
    isDrawing: false,
    isEditing: false,
    drawingMode: 'polygon', // polygon, rectangle, circle
    editingPolygonId: null,
    tempPolygon: null,

    // Polygon operations
    operationInProgress: false,
    lastOperation: null,
    operationHistory: [],

    // Validation and analysis
    validationErrors: {},
    analysisResults: {},

    // Polygon styles and appearance
    defaultStyle: {
      fillColor: '#ff4444',
      fillOpacity: 0.3,
      strokeColor: '#ff0000',
      strokeWidth: 2,
      strokeOpacity: 0.8
    },

    stylesByCategory: {
      low: {
        fillColor: '#ffeb3b',
        fillOpacity: 0.3,
        strokeColor: '#fbc02d',
        strokeWidth: 2
      },
      medium: {
        fillColor: '#ff9800',
        fillOpacity: 0.4,
        strokeColor: '#f57c00',
        strokeWidth: 2
      },
      high: {
        fillColor: '#f44336',
        fillOpacity: 0.5,
        strokeColor: '#d32f2f',
        strokeWidth: 3
      },
      critical: {
        fillColor: '#9c27b0',
        fillOpacity: 0.6,
        strokeColor: '#7b1fa2',
        strokeWidth: 3
      }
    },

    // Clustering and grouping
    clusteringEnabled: false,
    clusterDistance: 50,
    polygonGroups: [],

    // Performance optimization
    visiblePolygons: [],
    loadedBounds: null,
    maxPolygonsToRender: 1000,

    // Polygon metadata
    polygonStats: {
      totalCount: 0,
      totalArea: 0,
      averageArea: 0,
      severityDistribution: {},
      causeDistribution: {},
      monthlyTrends: []
    }
  }),

  getters: {
    // Get polygon by ID
    getPolygonById: (state) => (id) => {
      return state.polygons.find(polygon => polygon.id === id);
    },

    // Get selected polygon
    selectedPolygon: (state) => {
      return state.selectedPolygonId ?
        state.polygons.find(p => p.id === state.selectedPolygonId) : null;
    },

    // Get hovered polygon
    hoveredPolygon: (state) => {
      return state.hoveredPolygonId ?
        state.polygons.find(p => p.id === state.hoveredPolygonId) : null;
    },

    // Get polygons by severity
    getPolygonsBySeverity: (state) => (severity) => {
      return state.polygons.filter(polygon =>
        polygon.properties?.severity === severity
      );
    },

    // Get polygons in area
    getPolygonsInBounds: (state) => (bounds) => {
      return state.polygons.filter(polygon => {
        if (!polygon.geometry || !polygon.geometry.coordinates) return false;

        // Simple bounds check for polygon center
        const center = calculatePolygonCenter(polygon.geometry.coordinates);
        return (
          center.lat >= bounds.south &&
          center.lat <= bounds.north &&
          center.lng >= bounds.west &&
          center.lng <= bounds.east
        );
      });
    },

    // Get polygons by date range
    getPolygonsByDateRange: (state) => (startDate, endDate) => {
      return state.polygons.filter(polygon => {
        const detectedDate = new Date(polygon.properties?.detectedDate);
        return detectedDate >= new Date(startDate) && detectedDate <= new Date(endDate);
      });
    },

    // Check if any polygon operation is active
    isAnyOperationActive: (state) => {
      return state.isDrawing || state.isEditing || state.operationInProgress;
    },

    // Get validation status
    isValidPolygon: (state) => (polygonId) => {
      return !state.validationErrors[polygonId] ||
        Object.keys(state.validationErrors[polygonId]).length === 0;
    },

    // Get style for polygon
    getPolygonStyle: (state) => (polygon) => {
      const severity = polygon.properties?.severity;
      return severity && state.stylesByCategory[severity]
        ? state.stylesByCategory[severity]
        : state.defaultStyle;
    },

    // Get polygon statistics
    getStatsByTimeRange: (state) => (days = 30) => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const recentPolygons = state.polygons.filter(polygon =>
        new Date(polygon.properties?.detectedDate || polygon.createdAt) >= cutoffDate
      );

      return {
        count: recentPolygons.length,
        totalArea: recentPolygons.reduce((sum, p) => sum + (parseFloat(p.properties?.area) || 0), 0),
        severityBreakdown: recentPolygons.reduce((acc, p) => {
          const severity = p.properties?.severity || 'unknown';
          acc[severity] = (acc[severity] || 0) + 1;
          return acc;
        }, {})
      };
    }
  },

  actions: {
    // Basic polygon management
    addPolygon(polygon) {
      // Generate ID if not provided
      if (!polygon.id) {
        polygon.id = `polygon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      // Add timestamps
      polygon.createdAt = polygon.createdAt || new Date().toISOString();
      polygon.updatedAt = new Date().toISOString();

      // Validate polygon
      const validation = this.validatePolygon(polygon);
      if (!validation.isValid) {
        this.validationErrors[polygon.id] = validation.errors;
        throw new Error(`Invalid polygon: ${validation.errors.join(', ')}`);
      }

      this.polygons.push(polygon);
      this.updatePolygonStats();

      // Add to operation history
      this.addToHistory('add', polygon.id);

      return polygon;
    },

    updatePolygon(id, updates) {
      const index = this.polygons.findIndex(p => p.id === id);
      if (index === -1) {
        throw new Error(`Polygon with ID ${id} not found`);
      }

      const updatedPolygon = {
        ...this.polygons[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // Validate updated polygon
      const validation = this.validatePolygon(updatedPolygon);
      if (!validation.isValid) {
        this.validationErrors[id] = validation.errors;
        throw new Error(`Invalid polygon update: ${validation.errors.join(', ')}`);
      }

      this.polygons[index] = updatedPolygon;
      this.updatePolygonStats();

      // Clear validation errors if valid
      delete this.validationErrors[id];

      // Add to operation history
      this.addToHistory('update', id);

      return updatedPolygon;
    },

    removePolygon(id) {
      const index = this.polygons.findIndex(p => p.id === id);
      if (index === -1) {
        throw new Error(`Polygon with ID ${id} not found`);
      }

      const removedPolygon = this.polygons[index];
      this.polygons.splice(index, 1);

      // Clear related state
      if (this.selectedPolygonId === id) {
        this.selectedPolygonId = null;
      }
      if (this.hoveredPolygonId === id) {
        this.hoveredPolygonId = null;
      }
      if (this.editingPolygonId === id) {
        this.editingPolygonId = null;
        this.isEditing = false;
      }

      // Clear validation errors
      delete this.validationErrors[id];
      delete this.analysisResults[id];

      this.updatePolygonStats();

      // Add to operation history
      this.addToHistory('remove', id, removedPolygon);

      return removedPolygon;
    },

    // Selection and interaction
    selectPolygon(id) {
      this.selectedPolygonId = id;

      // Sync with map store
      const mapStore = useMapStore();
      const polygon = this.getPolygonById(id);
      if (polygon) {
        mapStore.selectPolygon(polygon);
      }
    },

    clearSelection() {
      this.selectedPolygonId = null;

      // Sync with map store
      const mapStore = useMapStore();
      mapStore.clearSelection();
    },

    setHoveredPolygon(id) {
      this.hoveredPolygonId = id;
    },

    clearHover() {
      this.hoveredPolygonId = null;
    },

    // Drawing operations
    startDrawing(mode = 'polygon') {
      this.isDrawing = true;
      this.drawingMode = mode;
      this.tempPolygon = null;
    },

    stopDrawing() {
      this.isDrawing = false;
      this.tempPolygon = null;
    },

    setTempPolygon(polygon) {
      this.tempPolygon = polygon;
    },

    finishDrawing(finalPolygon) {
      if (!finalPolygon) return null;

      try {
        const addedPolygon = this.addPolygon(finalPolygon);
        this.stopDrawing();
        this.selectPolygon(addedPolygon.id);
        return addedPolygon;
      } catch (error) {
        console.error('Error finishing polygon drawing:', error);
        throw error;
      }
    },

    // Editing operations
    startEditing(id) {
      const polygon = this.getPolygonById(id);
      if (!polygon) {
        throw new Error(`Cannot edit: polygon with ID ${id} not found`);
      }

      this.isEditing = true;
      this.editingPolygonId = id;
      this.selectPolygon(id);
    },

    stopEditing(save = false) {
      if (save && this.editingPolygonId && this.tempPolygon) {
        try {
          this.updatePolygon(this.editingPolygonId, {
            geometry: this.tempPolygon.geometry
          });
        } catch (error) {
          console.error('Error saving edited polygon:', error);
          throw error;
        }
      }

      this.isEditing = false;
      this.editingPolygonId = null;
      this.tempPolygon = null;
    },

    // Bulk operations
    async bulkUpdate(polygonIds, updates) {
      this.operationInProgress = true;

      try {
        const updatedPolygons = [];

        for (const id of polygonIds) {
          try {
            const updated = this.updatePolygon(id, updates);
            updatedPolygons.push(updated);
          } catch (error) {
            console.error(`Error updating polygon ${id}:`, error);
          }
        }

        this.addToHistory('bulkUpdate', polygonIds);
        return updatedPolygons;

      } finally {
        this.operationInProgress = false;
      }
    },

    async bulkDelete(polygonIds) {
      this.operationInProgress = true;

      try {
        const deletedPolygons = [];

        for (const id of polygonIds) {
          try {
            const deleted = this.removePolygon(id);
            deletedPolygons.push(deleted);
          } catch (error) {
            console.error(`Error deleting polygon ${id}:`, error);
          }
        }

        this.addToHistory('bulkDelete', polygonIds, deletedPolygons);
        return deletedPolygons;

      } finally {
        this.operationInProgress = false;
      }
    },

    // Validation
    validatePolygon(polygon) {
      const errors = [];

      // Check required fields
      if (!polygon.geometry) {
        errors.push('Geometry is required');
      } else {
        // Check geometry structure
        if (!polygon.geometry.coordinates || !Array.isArray(polygon.geometry.coordinates)) {
          errors.push('Invalid geometry coordinates');
        } else {
          // Check minimum points for polygon
          const coords = polygon.geometry.coordinates[0];
          if (!coords || coords.length < 4) {
            errors.push('Polygon must have at least 4 coordinate points');
          }
        }
      }

      // Check properties
      if (polygon.properties) {
        const props = polygon.properties;

        // Validate severity
        if (props.severity && !['low', 'medium', 'high', 'critical'].includes(props.severity)) {
          errors.push('Invalid severity level');
        }

        // Validate dates
        if (props.detectedDate && isNaN(new Date(props.detectedDate).getTime())) {
          errors.push('Invalid detection date');
        }

        if (props.estimatedDate && isNaN(new Date(props.estimatedDate).getTime())) {
          errors.push('Invalid estimated date');
        }

        // Validate area
        if (props.area && (isNaN(props.area) || props.area < 0)) {
          errors.push('Area must be a positive number');
        }
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    },

    // Analysis operations
    async analyzePolygon(id) {
      const polygon = this.getPolygonById(id);
      if (!polygon) {
        throw new Error(`Polygon with ID ${id} not found`);
      }

      try {
        // Calculate basic metrics
        const analysis = {
          area: this.calculateArea(polygon.geometry.coordinates),
          perimeter: this.calculatePerimeter(polygon.geometry.coordinates),
          centroid: this.calculateCentroid(polygon.geometry.coordinates),
          boundingBox: this.calculateBoundingBox(polygon.geometry.coordinates),
          compactness: 0, // Will be calculated
          analyzedAt: new Date().toISOString()
        };

        // Calculate compactness (shape complexity)
        analysis.compactness = this.calculateCompactness(analysis.area, analysis.perimeter);

        // Store analysis results
        this.analysisResults[id] = analysis;

        return analysis;
      } catch (error) {
        console.error(`Error analyzing polygon ${id}:`, error);
        throw error;
      }
    },

    // Utility methods
    calculateArea(coordinates) {
      // Shoelace formula for polygon area
      const coords = coordinates[0];
      let area = 0;

      for (let i = 0; i < coords.length - 1; i++) {
        area += (coords[i][0] * coords[i + 1][1]) - (coords[i + 1][0] * coords[i][1]);
      }

      // Convert to hectares (approximate)
      return Math.abs(area * 0.5 * 111319.5 * 111319.5 / 10000);
    },

    calculatePerimeter(coordinates) {
      const coords = coordinates[0];
      let perimeter = 0;

      for (let i = 0; i < coords.length - 1; i++) {
        const dx = coords[i + 1][0] - coords[i][0];
        const dy = coords[i + 1][1] - coords[i][1];
        perimeter += Math.sqrt(dx * dx + dy * dy) * 111319.5; // Convert to meters
      }

      return perimeter;
    },

    calculateCentroid(coordinates) {
      const coords = coordinates[0];
      let x = 0, y = 0;

      for (let i = 0; i < coords.length - 1; i++) {
        x += coords[i][0];
        y += coords[i][1];
      }

      return {
        lng: x / (coords.length - 1),
        lat: y / (coords.length - 1)
      };
    },

    calculateBoundingBox(coordinates) {
      const coords = coordinates[0];
      let minLng = coords[0][0], maxLng = coords[0][0];
      let minLat = coords[0][1], maxLat = coords[0][1];

      for (let i = 1; i < coords.length; i++) {
        minLng = Math.min(minLng, coords[i][0]);
        maxLng = Math.max(maxLng, coords[i][0]);
        minLat = Math.min(minLat, coords[i][1]);
        maxLat = Math.max(maxLat, coords[i][1]);
      }

      return { minLng, maxLng, minLat, maxLat };
    },

    calculateCompactness(area, perimeter) {
      // Compactness = 4π * area / perimeter²
      // Value closer to 1 means more circular (compact)
      return (4 * Math.PI * area) / (perimeter * perimeter);
    },

    // Statistics and aggregation
    updatePolygonStats() {
      const stats = {
        totalCount: this.polygons.length,
        totalArea: 0,
        severityDistribution: {},
        causeDistribution: {},
        monthlyTrends: []
      };

      this.polygons.forEach(polygon => {
        const props = polygon.properties || {};

        // Area aggregation
        stats.totalArea += parseFloat(props.area) || 0;

        // Severity distribution
        const severity = props.severity || 'unknown';
        stats.severityDistribution[severity] = (stats.severityDistribution[severity] || 0) + 1;

        // Cause distribution
        const cause = props.cause || 'unknown';
        stats.causeDistribution[cause] = (stats.causeDistribution[cause] || 0) + 1;
      });

      stats.averageArea = stats.totalCount > 0 ? stats.totalArea / stats.totalCount : 0;

      this.polygonStats = stats;
    },

    // History management
    addToHistory(operation, polygonIds, data = null) {
      this.operationHistory.unshift({
        operation,
        polygonIds: Array.isArray(polygonIds) ? polygonIds : [polygonIds],
        data,
        timestamp: new Date().toISOString()
      });

      // Keep only last 50 operations
      if (this.operationHistory.length > 50) {
        this.operationHistory = this.operationHistory.slice(0, 50);
      }

      this.lastOperation = this.operationHistory[0];
    },

    // Data management
    loadPolygons(polygons) {
      this.polygons = polygons.map(polygon => ({
        ...polygon,
        id: polygon.id || `polygon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }));

      this.updatePolygonStats();
    },

    clearAllPolygons() {
      this.polygons = [];
      this.selectedPolygonId = null;
      this.hoveredPolygonId = null;
      this.validationErrors = {};
      this.analysisResults = {};
      this.operationHistory = [];
      this.updatePolygonStats();
    },

    // Performance optimization
    updateVisiblePolygons(bounds) {
      this.visiblePolygons = this.getPolygonsInBounds(bounds);
      this.loadedBounds = bounds;
    }
  }
})

// Helper function
function calculatePolygonCenter(coordinates) {
  const coords = coordinates[0];
  let x = 0, y = 0;

  for (let i = 0; i < coords.length - 1; i++) {
    x += coords[i][0];
    y += coords[i][1];
  }

  return {
    lng: x / (coords.length - 1),
    lat: y / (coords.length - 1)
  };
}
