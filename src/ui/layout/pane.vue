<!--
 Open MCT, Copyright (c) 2014-2023, United States Government
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
  <div class="l-pane" :class="paneClasses">
    <div v-if="handle" class="l-pane__handle" @mousedown.prevent="startResizing"></div>
    <div class="l-pane__header">
      <span v-if="label" class="l-pane__label">{{ label }}</span>
      <slot name="controls"></slot>
      <button
        v-if="isCollapsable"
        class="l-pane__collapse-button c-icon-button"
        :title="collapseTitle"
        @click="toggleCollapse"
      ></button>
    </div>
    <button class="l-pane__expand-button" @click="toggleCollapse">
      <span class="l-pane__expand-button__label">{{ label }}</span>
    </button>
    <div class="l-pane__contents">
      <slot></slot>
    </div>
  </div>
</template>

<script>
const COLLAPSE_THRESHOLD_PX = 40;
const LOCAL_STORAGE_KEY__PANE_POSITIONS = 'mct-pane-positions';

export default {
  inject: ['openmct'],
  props: {
    handle: {
      type: String,
      default: '',
      validator: function (value) {
        return ['', 'before', 'after'].indexOf(value) !== -1;
      }
    },
    label: {
      type: String,
      default: ''
    },
    hideParam: {
      type: String,
      default: ''
    },
    persistPosition: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      collapsed: false,
      resizing: false
    };
  },
  computed: {
    isCollapsable() {
      return this.hideParam?.length > 0;
    },
    collapseTitle() {
      return `Collapse ${this.label} Pane`;
    },
    localStorageKey() {
      if (!this.label) {
        return null;
      }

      return this.label.toLowerCase().replace(/ /g, '-');
    },
    paneClasses() {
      return {
        'l-pane--horizontal-handle-before': this.type === 'horizontal' && this.handle === 'before',
        'l-pane--horizontal-handle-after': this.type === 'horizontal' && this.handle === 'after',
        'l-pane--vertical-handle-before': this.type === 'vertical' && this.handle === 'before',
        'l-pane--vertical-handle-after': this.type === 'vertical' && this.handle === 'after',
        'l-pane--collapsed': this.collapsed,
        'l-pane--reacts': !this.handle,
        'l-pane--resizing': this.resizing === true
      };
    }
  },
  beforeMount() {
    this.type = this.$parent.type;
    this.styleProp = this.type === 'horizontal' ? 'width' : 'height';
  },
  created() {
    // Hide tree and/or inspector pane if specified in URL
    this.openmct.router.on('change:params', this.handleHideUrl.bind(this));
  },
  async mounted() {
    if (this.persistPosition) {
      const savedPosition = this.getSavedPosition();
      if (savedPosition) {
        this.$el.style[this.styleProp] = savedPosition;
      }
    }

    await this.$nextTick();
    if (this.isCollapsable) {
      this.handleHideUrl();
    }
  },
  methods: {
    addHideParam(target) {
      this.openmct.router.setSearchParam(target, 'true');
    },
    endResizing(_event) {
      document.body.removeEventListener('mousemove', this.updatePosition);
      document.body.removeEventListener('mouseup', this.endResizing);
      this.resizing = false;
      this.$emit('end-resizing');
      this.trackSize();
    },
    getNewSize(event) {
      const delta = this.startPosition - this.getPosition(event);
      if (this.handle === 'before') {
        return `${this.initial + delta}px`;
      }

      if (this.handle === 'after') {
        return `${this.initial - delta}px`;
      }
    },
    getSavedPosition() {
      if (!this.localStorageKey) {
        return null;
      }

      const savedPositionsString = localStorage.getItem(LOCAL_STORAGE_KEY__PANE_POSITIONS);
      const savedPositions = savedPositionsString ? JSON.parse(savedPositionsString) : {};

      return savedPositions[this.localStorageKey];
    },
    getPosition(event) {
      return this.type === 'horizontal' ? event.pageX : event.pageY;
    },
    handleCollapse() {
      this.currentSize = this.dragCollapse === true ? this.initial : this.$el.style[this.styleProp];
      this.$el.style[this.styleProp] = '';
      this.collapsed = true;
    },
    handleExpand() {
      this.$el.style[this.styleProp] = this.currentSize;
      delete this.currentSize;
      delete this.dragCollapse;
      this.collapsed = false;
    },
    handleHideUrl() {
      const hideParam = this.openmct.router.getSearchParam(this.hideParam);

      if (hideParam === 'true') {
        this.handleCollapse();
      }
    },
    removeHideParam(target) {
      this.openmct.router.deleteSearchParam(target);
    },
    setSavedPosition(panePosition) {
      const panePositionsString = localStorage.getItem(LOCAL_STORAGE_KEY__PANE_POSITIONS);
      const panePositions = panePositionsString ? JSON.parse(panePositionsString) : {};
      panePositions[this.localStorageKey] = panePosition;
      localStorage.setItem(LOCAL_STORAGE_KEY__PANE_POSITIONS, JSON.stringify(panePositions));
    },
    startResizing(event) {
      this.startPosition = this.getPosition(event);
      document.body.addEventListener('mousemove', this.updatePosition);
      document.body.addEventListener('mouseup', this.endResizing);
      this.resizing = true;
      this.$emit('start-resizing');
      this.trackSize();
    },
    toggleCollapse(_event) {
      if (this.collapsed) {
        this.handleExpand();
        this.removeHideParam(this.hideParam);
      } else {
        this.handleCollapse();
        this.addHideParam(this.hideParam);
      }
    },
    trackSize() {
      if (!this.dragCollapse) {
        if (this.type === 'vertical') {
          this.initial = this.$el.offsetHeight;
        } else if (this.type === 'horizontal') {
          this.initial = this.$el.offsetWidth;
        }

        if (this.persistPosition) {
          this.setSavedPosition(`${this.initial}px`);
        }
      }
    },
    updatePosition(event) {
      const size = this.getNewSize(event);
      const intSize = parseInt(size.substr(0, size.length - 2), 10);
      if (intSize < COLLAPSE_THRESHOLD_PX && this.isCollapsable === true) {
        this.dragCollapse = true;
        this.endResizing();
        this.toggleCollapse();
      } else {
        this.$el.style[this.styleProp] = size;
      }
    }
  }
};
</script>
