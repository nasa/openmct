<!--
 Open MCT, Copyright (c) 2014-2024, United States Government
 as represented by the Administrator of the National Aeronautics and Space
 Administration. All rights reserved.

 Open MCT is licensed under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0.

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 License for the specific language governing permissions and limitations
 under the License.

 Open MCT includes source code licensed under additional open source
 licenses. See the Open Source Licenses file (LICENSES.md) included with
 this source code distribution or the Licensing information page available
 at runtime from the About dialog for additional information.
-->

<template>
  <div
    class="h-local-controls h-local-controls--overlay-content h-local-controls--menus-aligned c-local-controls--show-on-hover"
    role="toolbar"
    aria-label="Image controls"
  >
    <ImageryViewMenuSwitcher
      :icon-class="'icon-brightness'"
      :aria-label="'Brightness and contrast'"
      :title="'Brightness and contrast'"
    >
      <FilterSettings @filter-changed="updateFilterValues" />
    </ImageryViewMenuSwitcher>

    <ImageryViewMenuSwitcher
      v-if="layers.length"
      icon-class="icon-layers"
      aria-label="Layers"
      title="Layers"
    >
      <LayerSettings :layers="layers" @toggle-layer-visibility="toggleLayerVisibility" />
    </ImageryViewMenuSwitcher>

    <ZoomSettings
      class="--hide-if-less-than-220"
      :pan-zoom-locked="panZoomLocked"
      :zoom-factor="zoomFactor"
    />

    <ImageryViewMenuSwitcher
      class="--show-if-less-than-220"
      :icon-class="'icon-magnify'"
      :aria-label="'Zoom settings'"
      :title="'Zoom settings'"
    >
      <ZoomSettings
        :pan-zoom-locked="panZoomLocked"
        :class="'c-control-menu c-menu--has-close-btn'"
        :zoom-factor="zoomFactor"
        :is-menu="true"
      />
    </ImageryViewMenuSwitcher>
  </div>
</template>

<script>
import _ from 'lodash';

import FilterSettings from './FilterSettings.vue';
import ImageryViewMenuSwitcher from './ImageryViewMenuSwitcher.vue';
import LayerSettings from './LayerSettings.vue';
import ZoomSettings from './ZoomSettings.vue';

const DEFAULT_FILTER_VALUES = {
  brightness: '100',
  contrast: '100'
};

const ZOOM_LIMITS_MAX_DEFAULT = 20;
const ZOOM_LIMITS_MIN_DEFAULT = 1;
const ZOOM_STEP = 1;
const ZOOM_WHEEL_SENSITIVITY_REDUCTION = 0.01;

export default {
  components: {
    FilterSettings,
    LayerSettings,
    ImageryViewMenuSwitcher,
    ZoomSettings
  },
  inject: ['openmct', 'domainObject', 'resetImage', 'handlePanZoomUpdate'],
  provide() {
    return {
      resetImage: this.resetImage,
      zoomIn: this.zoomIn,
      zoomOut: this.zoomOut,
      toggleZoomLock: this.toggleZoomLock
    };
  },
  props: {
    layers: {
      type: Array,
      required: true
    },
    zoomFactor: {
      type: Number,
      required: true
    },
    imageUrl: {
      type: String,
      default: () => {
        return '';
      }
    }
  },
  emits: [
    'cursors-updated',
    'pan-zoom-updated',
    'filters-updated',
    'start-pan',
    'toggle-layer-visibility'
  ],
  data() {
    return {
      altPressed: false,
      shiftPressed: false,
      metaPressed: false,
      panZoomLocked: false,
      wheelZooming: false,
      filters: {
        brightness: 100,
        contrast: 100
      }
    };
  },
  computed: {
    cursorStates() {
      const isPannable = this.altPressed && this.zoomFactor > 1;
      const showCursorZoomIn = this.metaPressed && !this.shiftPressed;
      const showCursorZoomOut = this.metaPressed && this.shiftPressed;
      const modifierKeyPressed = Boolean(this.metaPressed || this.shiftPressed || this.altPressed);

      return {
        isPannable,
        showCursorZoomIn,
        showCursorZoomOut,
        modifierKeyPressed
      };
    }
  },
  watch: {
    imageUrl(newUrl, oldUrl) {
      // reset image pan/zoom if newUrl only if not locked
      if (newUrl && !this.panZoomLocked) {
        this.resetImage();
      }
    },
    cursorStates(states) {
      this.$emit('cursors-updated', states);
    }
  },
  mounted() {
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    this.clearWheelZoom = _.debounce(this.clearWheelZoom, 600);
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
  },
  methods: {
    toggleZoomLock() {
      this.panZoomLocked = !this.panZoomLocked;
    },
    notifyFiltersChanged() {
      this.$emit('filters-updated', this.filters);
    },
    handleResetFilters() {
      this.filters = { ...DEFAULT_FILTER_VALUES };
      this.notifyFiltersChanged();
    },
    limitZoomRange(factor) {
      return Math.min(Math.max(ZOOM_LIMITS_MIN_DEFAULT, factor), ZOOM_LIMITS_MAX_DEFAULT);
    },
    // used to increment the zoom without knowledge of current level
    processZoom(increment, userCoordX, userCoordY) {
      const newFactor = this.limitZoomRange(this.zoomFactor + increment);
      this.zoomImage(newFactor, userCoordX, userCoordY);
    },
    zoomImage(newScaleFactor, screenClientX, screenClientY) {
      if (!(newScaleFactor || Number.isInteger(newScaleFactor))) {
        console.error('Scale factor provided is invalid');

        return;
      }

      if (newScaleFactor > ZOOM_LIMITS_MAX_DEFAULT) {
        newScaleFactor = ZOOM_LIMITS_MAX_DEFAULT;
      }

      if (newScaleFactor <= 0 || newScaleFactor <= ZOOM_LIMITS_MIN_DEFAULT) {
        return this.resetImage();
      }

      this.handlePanZoomUpdate({
        newScaleFactor,
        screenClientX,
        screenClientY
      });
    },
    wheelZoom(e) {
      // only use x,y coordinates on scrolling in
      if (this.wheelZooming === false && e.deltaY > 0) {
        this.wheelZooming = true;
        // grab first x,y coordinates
        this.processZoom(e.deltaY * ZOOM_WHEEL_SENSITIVITY_REDUCTION, e.clientX, e.clientY);
      } else {
        // ignore subsequent event x,y so scroll drift doesn't occur
        this.processZoom(e.deltaY * ZOOM_WHEEL_SENSITIVITY_REDUCTION);
      }

      // debounced method that will only fire after the scroll series is complete
      this.clearWheelZoom();
    },
    /* debounced method so that wheelZooming state will
     ** remain true through a zoom event series
     */
    clearWheelZoom() {
      this.wheelZooming = false;
    },
    handleKeyDown(event) {
      if (event.key === 'Alt') {
        this.altPressed = true;
      }

      if (event.metaKey) {
        this.metaPressed = true;
      }

      if (event.shiftKey) {
        this.shiftPressed = true;
      }
    },
    handleKeyUp(event) {
      if (event.key === 'Alt') {
        this.altPressed = false;
      }

      this.shiftPressed = false;
      if (!event.metaKey) {
        this.metaPressed = false;
      }
    },
    zoomIn() {
      this.processZoom(ZOOM_STEP);
    },
    zoomOut() {
      this.processZoom(-ZOOM_STEP);
    },
    // attached to onClick listener in ImageryView
    handlePanZoomClick(e) {
      if (this.altPressed) {
        return this.$emit('start-pan', e);
      }

      if (!(this.metaPressed && e.button === 0)) {
        return;
      }

      const newScaleFactor = this.zoomFactor + (this.shiftPressed ? -ZOOM_STEP : ZOOM_STEP);
      this.zoomImage(newScaleFactor, e.clientX, e.clientY);
    },
    toggleLayerVisibility(index) {
      this.$emit('toggle-layer-visibility', index);
    },
    updateFilterValues(filters) {
      this.filters = filters;
      this.notifyFiltersChanged();
    }
  }
};
</script>
