<template>
  <svg
    :class="[
      'sync-icon',
      { 'spinning': isSpinning },
      customClass
    ]"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    @click="handleClick"
  >
    <!-- Sync/Refresh Icon Path -->
    <path d="M23 4v6h-6" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
</template>

<script>
export default {
  name: 'SyncIcon',

  props: {
    // Icon size
    size: {
      type: [String, Number],
      default: 24
    },

    // Stroke width
    strokeWidth: {
      type: [String, Number],
      default: 2
    },

    // Whether the icon should spin
    isSpinning: {
      type: Boolean,
      default: false
    },

    // Custom CSS class
    customClass: {
      type: String,
      default: ''
    },

    // Whether the icon is clickable
    clickable: {
      type: Boolean,
      default: true
    }
  },

  emits: ['click', 'sync'],

  methods: {
    handleClick(event) {
      if (this.clickable) {
        this.$emit('click', event);
        this.$emit('sync', event);
      }
    }
  }
}
</script>

<style scoped>
.sync-icon {
  cursor: pointer;
  transition: all 0.2s ease;
  color: currentColor;
}

.sync-icon:hover {
  opacity: 0.7;
  transform: scale(1.05);
}

.sync-icon.spinning {
  animation: spin 1s linear infinite;
}

/* Spin animation */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Color variants */
.sync-icon.text-primary {
  color: #3b82f6;
}

.sync-icon.text-success {
  color: #10b981;
}

.sync-icon.text-warning {
  color: #f59e0b;
}

.sync-icon.text-danger {
  color: #ef4444;
}

.sync-icon.text-gray {
  color: #6b7280;
}

/* Size variants */
.sync-icon.small {
  width: 16px;
  height: 16px;
}

.sync-icon.medium {
  width: 24px;
  height: 24px;
}

.sync-icon.large {
  width: 32px;
  height: 32px;
}

/* Disabled state */
.sync-icon:disabled,
.sync-icon.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.sync-icon:disabled:hover,
.sync-icon.disabled:hover {
  transform: none;
  opacity: 0.4;
}
</style>
