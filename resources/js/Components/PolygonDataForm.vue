<template>
  <div class="polygon-data-form">
    <!-- Form Header -->
    <div class="form-header">
      <h3 class="form-title">Polygon Data Entry</h3>
      <button
        @click="$emit('close')"
        class="close-button"
        type="button"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Form Content -->
    <form @submit.prevent="submitForm" class="polygon-form">
      <!-- Basic Information -->
      <div class="form-section">
        <h4 class="section-title">Basic Information</h4>

        <div class="form-group">
          <label for="polygonName" class="form-label">Polygon Name *</label>
          <input
            id="polygonName"
            v-model="formData.name"
            type="text"
            class="form-input"
            :class="{ 'error': errors.name }"
            placeholder="Enter polygon name"
            required
          />
          <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
        </div>

        <div class="form-group">
          <label for="description" class="form-label">Description</label>
          <textarea
            id="description"
            v-model="formData.description"
            class="form-textarea"
            rows="3"
            placeholder="Describe the deforestation area or observations"
          ></textarea>
        </div>
      </div>

      <!-- Location Data -->
      <div class="form-section">
        <h4 class="section-title">Location Data</h4>

        <div class="form-row">
          <div class="form-group">
            <label for="latitude" class="form-label">Latitude</label>
            <input
              id="latitude"
              v-model="formData.latitude"
              type="number"
              step="any"
              class="form-input"
              placeholder="0.000000"
              readonly
            />
          </div>

          <div class="form-group">
            <label for="longitude" class="form-label">Longitude</label>
            <input
              id="longitude"
              v-model="formData.longitude"
              type="number"
              step="any"
              class="form-input"
              placeholder="0.000000"
              readonly
            />
          </div>
        </div>

        <div class="form-group">
          <label for="area" class="form-label">Area (hectares)</label>
          <input
            id="area"
            v-model="formData.area"
            type="number"
            step="0.01"
            class="form-input"
            placeholder="0.00"
            readonly
          />
        </div>
      </div>

      <!-- Deforestation Details -->
      <div class="form-section">
        <h4 class="section-title">Deforestation Details</h4>

        <div class="form-group">
          <label for="severity" class="form-label">Severity Level *</label>
          <select
            id="severity"
            v-model="formData.severity"
            class="form-select"
            :class="{ 'error': errors.severity }"
            required
          >
            <option value="">Select severity</option>
            <option value="low">Low - Minor clearing</option>
            <option value="medium">Medium - Moderate clearing</option>
            <option value="high">High - Extensive clearing</option>
            <option value="critical">Critical - Complete deforestation</option>
          </select>
          <span v-if="errors.severity" class="error-message">{{ errors.severity }}</span>
        </div>

        <div class="form-group">
          <label for="detectedDate" class="form-label">Detection Date *</label>
          <input
            id="detectedDate"
            v-model="formData.detectedDate"
            type="date"
            class="form-input"
            :class="{ 'error': errors.detectedDate }"
            :max="today"
            required
          />
          <span v-if="errors.detectedDate" class="error-message">{{ errors.detectedDate }}</span>
        </div>

        <div class="form-group">
          <label for="estimatedDate" class="form-label">Estimated Deforestation Date</label>
          <input
            id="estimatedDate"
            v-model="formData.estimatedDate"
            type="date"
            class="form-input"
            :max="today"
          />
        </div>

        <div class="form-group">
          <label for="cause" class="form-label">Probable Cause</label>
          <select
            id="cause"
            v-model="formData.cause"
            class="form-select"
          >
            <option value="">Select cause</option>
            <option value="agriculture">Agricultural expansion</option>
            <option value="logging">Commercial logging</option>
            <option value="infrastructure">Infrastructure development</option>
            <option value="mining">Mining activities</option>
            <option value="urban">Urban development</option>
            <option value="natural">Natural causes</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
      </div>

      <!-- Environmental Impact -->
      <div class="form-section">
        <h4 class="section-title">Environmental Impact</h4>

        <div class="form-group">
          <label for="carbonLoss" class="form-label">Estimated Carbon Loss (tons CO₂)</label>
          <input
            id="carbonLoss"
            v-model="formData.carbonLoss"
            type="number"
            step="0.01"
            class="form-input"
            placeholder="0.00"
          />
        </div>

        <div class="form-group">
          <label for="biodiversityImpact" class="form-label">Biodiversity Impact</label>
          <select
            id="biodiversityImpact"
            v-model="formData.biodiversityImpact"
            class="form-select"
          >
            <option value="">Select impact level</option>
            <option value="minimal">Minimal impact</option>
            <option value="moderate">Moderate impact</option>
            <option value="significant">Significant impact</option>
            <option value="severe">Severe impact</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Affected Species (if known)</label>
          <div class="checkbox-group">
            <label class="checkbox-item">
              <input type="checkbox" v-model="formData.affectedSpecies" value="mammals">
              <span>Mammals</span>
            </label>
            <label class="checkbox-item">
              <input type="checkbox" v-model="formData.affectedSpecies" value="birds">
              <span>Birds</span>
            </label>
            <label class="checkbox-item">
              <input type="checkbox" v-model="formData.affectedSpecies" value="reptiles">
              <span>Reptiles</span>
            </label>
            <label class="checkbox-item">
              <input type="checkbox" v-model="formData.affectedSpecies" value="amphibians">
              <span>Amphibians</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Additional Information -->
      <div class="form-section">
        <h4 class="section-title">Additional Information</h4>

        <div class="form-group">
          <label for="dataSource" class="form-label">Data Source</label>
          <input
            id="dataSource"
            v-model="formData.dataSource"
            type="text"
            class="form-input"
            placeholder="e.g., Satellite imagery, Field survey, Reports"
          />
        </div>

        <div class="form-group">
          <label for="confidence" class="form-label">Confidence Level</label>
          <select
            id="confidence"
            v-model="formData.confidence"
            class="form-select"
          >
            <option value="">Select confidence</option>
            <option value="low">Low (< 70%)</option>
            <option value="medium">Medium (70-85%)</option>
            <option value="high">High (85-95%)</option>
            <option value="very-high">Very High (> 95%)</option>
          </select>
        </div>

        <div class="form-group">
          <label for="notes" class="form-label">Additional Notes</label>
          <textarea
            id="notes"
            v-model="formData.notes"
            class="form-textarea"
            rows="3"
            placeholder="Any additional observations, recommendations, or notes"
          ></textarea>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button
          type="button"
          @click="resetForm"
          class="btn btn-secondary"
          :disabled="isSubmitting"
        >
          Reset
        </button>
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="isSubmitting"
        >
          <span v-if="isSubmitting" class="loading-spinner"></span>
          {{ isSubmitting ? 'Saving...' : 'Save Polygon Data' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script>
export default {
  name: 'PolygonDataForm',

  props: {
    polygon: {
      type: Object,
      default: () => ({})
    },
    isVisible: {
      type: Boolean,
      default: false
    }
  },

  emits: ['close', 'save', 'update'],

  data() {
    return {
      isSubmitting: false,
      errors: {},
      formData: {
        name: '',
        description: '',
        latitude: null,
        longitude: null,
        area: null,
        severity: '',
        detectedDate: '',
        estimatedDate: '',
        cause: '',
        carbonLoss: null,
        biodiversityImpact: '',
        affectedSpecies: [],
        dataSource: '',
        confidence: '',
        notes: ''
      }
    }
  },

  computed: {
    today() {
      return new Date().toISOString().split('T')[0];
    }
  },

  watch: {
    polygon: {
      handler(newPolygon) {
        if (newPolygon && Object.keys(newPolygon).length > 0) {
          this.populateForm(newPolygon);
        }
      },
      immediate: true,
      deep: true
    }
  },

  methods: {
    populateForm(polygonData) {
      // Calculate center point and area from polygon geometry
      if (polygonData.coordinates) {
        const bounds = this.calculateBounds(polygonData.coordinates);
        this.formData.latitude = bounds.center.lat;
        this.formData.longitude = bounds.center.lng;
        this.formData.area = this.calculateArea(polygonData.coordinates);
      }

      // Populate existing data if editing
      if (polygonData.properties) {
        Object.assign(this.formData, polygonData.properties);
      }
    },

    calculateBounds(coordinates) {
      // Simple bounds calculation for polygon center
      let latSum = 0, lngSum = 0, pointCount = 0;

      coordinates[0].forEach(coord => {
        lngSum += coord[0];
        latSum += coord[1];
        pointCount++;
      });

      return {
        center: {
          lat: (latSum / pointCount).toFixed(6),
          lng: (lngSum / pointCount).toFixed(6)
        }
      };
    },

    calculateArea(coordinates) {
      // Simple area calculation using shoelace formula
      const coords = coordinates[0];
      let area = 0;

      for (let i = 0; i < coords.length - 1; i++) {
        area += (coords[i][0] * coords[i + 1][1]) - (coords[i + 1][0] * coords[i][1]);
      }

      // Convert to hectares (approximate)
      return Math.abs(area * 0.5 * 111319.5 * 111319.5 / 10000).toFixed(2);
    },

    validateForm() {
      this.errors = {};

      if (!this.formData.name.trim()) {
        this.errors.name = 'Polygon name is required';
      }

      if (!this.formData.severity) {
        this.errors.severity = 'Severity level is required';
      }

      if (!this.formData.detectedDate) {
        this.errors.detectedDate = 'Detection date is required';
      }

      return Object.keys(this.errors).length === 0;
    },

    async submitForm() {
      if (!this.validateForm()) {
        return;
      }

      this.isSubmitting = true;

      try {
        const polygonData = {
          ...this.polygon,
          properties: {
            ...this.formData,
            updatedAt: new Date().toISOString()
          }
        };

        // Emit the save event with form data
        this.$emit('save', polygonData);

        // Show success message (you might want to handle this in parent component)
        this.$nextTick(() => {
          alert('Polygon data saved successfully!');
          this.$emit('close');
        });

      } catch (error) {
        console.error('Error saving polygon data:', error);
        alert('Error saving polygon data. Please try again.');
      } finally {
        this.isSubmitting = false;
      }
    },

    resetForm() {
      this.formData = {
        name: '',
        description: '',
        latitude: this.formData.latitude,
        longitude: this.formData.longitude,
        area: this.formData.area,
        severity: '',
        detectedDate: '',
        estimatedDate: '',
        cause: '',
        carbonLoss: null,
        biodiversityImpact: '',
        affectedSpecies: [],
        dataSource: '',
        confidence: '',
        notes: ''
      };
      this.errors = {};
    }
  }
}
</script>

<style scoped>
.polygon-data-form {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
}

.form-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-button:hover {
  background: #f3f4f6;
  color: #374151;
}

.polygon-form {
  padding: 1.5rem;
}

.form-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
}

.form-group {
  margin-bottom: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input.error,
.form-select.error {
  border-color: #ef4444;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.checkbox-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.checkbox-item {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  cursor: pointer;
}

.checkbox-item input {
  margin-right: 0.5rem;
  width: auto;
}

.error-message {
  color: #ef4444;
  font-size: 0.75rem;
  margin-top: 0.25rem;
  display: block;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
  margin-top: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .checkbox-group {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .polygon-data-form {
    max-height: 90vh;
    margin: 0.5rem;
  }
}
</style>
