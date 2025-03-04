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
    ref="swimLane"
    class="u-contents"
    :class="[{ 'c-swimlane': !isNested }, statusClass]"
    :style="gridTemplateColumnStyle"
    @mouseover.ctrl="showToolTip"
    @mouseleave="hideToolTip"
  >
    <div
      v-if="hideLabel === false"
      class="c-swimlane__lane-label c-object-label"
      :class="[swimlaneClass, statusClass]"
      :style="gridRowSpan"
    >
      <div v-if="iconClass" class="c-object-label__type-icon" :class="iconClass">
        <span
          v-if="status"
          class="is-status__indicator"
          :aria-label="`This item is ${status}`"
          :title="`This item is ${status}`"
        ></span>
      </div>
      <div class="c-object-label__name">
        <slot name="label"></slot>
      </div>
      <div class="c-swimlane__lane-label-button-h">
        <button
          v-if="!hideButton"
          class="c-button"
          :class="[buttonIcon, buttonPressed ? 'is-active' : '']"
          :title="buttonTitle"
          :aria-label="buttonTitle"
          @click="pressOnButton"
        />
      </div>
      <div
        v-if="canShowResizeHandle"
        class="c-swimlane__handle horizontal"
        :style="{ height: `${resizeHandleHeight}px` }"
        @mousedown="mousedown"
      ></div>
    </div>

    <div
      class="c-swimlane__lane-object"
      :style="{ 'min-height': minHeight }"
      :class="{ 'u-contents': showUcontents }"
    >
      <slot name="object"></slot>
    </div>
  </div>
</template>

<script>
import tooltipHelpers from '../../../api/tooltips/tooltipMixins.js';

export default {
  mixins: [tooltipHelpers],
  inject: ['openmct', 'mousedown', 'swimLaneLabelWidth'],
  props: {
    iconClass: {
      type: String,
      default() {
        return '';
      }
    },
    status: {
      type: String,
      default() {
        return '';
      }
    },
    minHeight: {
      type: String,
      default() {
        return '';
      }
    },
    showUcontents: {
      type: Boolean,
      default() {
        return false;
      }
    },
    isHidden: {
      type: Boolean,
      default() {
        return false;
      }
    },
    hideLabel: {
      type: Boolean,
      default() {
        return false;
      }
    },
    isNested: {
      type: Boolean,
      default() {
        return false;
      }
    },
    canShowResizeHandle: {
      type: Boolean,
      default() {
        return false;
      }
    },
    resizeHandleHeight: {
      type: Number,
      required: false,
      default() {
        return 32;
      }
    },
    spanRowsCount: {
      type: Number,
      default() {
        return 0;
      }
    },
    domainObject: {
      type: Object,
      default: undefined
    },
    hideButton: {
      type: Boolean,
      default() {
        return true;
      }
    },
    buttonTitle: {
      type: String,
      default() {
        return null;
      }
    },
    buttonIcon: {
      type: String,
      default() {
        return null;
      }
    },
    buttonClickOn: {
      type: Function,
      default() {
        return () => {};
      }
    },
    buttonClickOff: {
      type: Function,
      default() {
        return () => {};
      }
    }
  },
  data() {
    return {
      buttonPressed: false,
      labelWidth: 200
    };
  },
  computed: {
    gridRowSpan() {
      if (this.spanRowsCount) {
        return `grid-row: span ${this.spanRowsCount}`;
      } else {
        return '';
      }
    },
    swimlaneClass() {
      if (!this.spanRowsCount && !this.isNested) {
        return 'c-swimlane__lane-label --span-cols';
      }
      return '';
    },
    statusClass() {
      return this.status ? `is-status--${this.status}` : '';
    },
    gridTemplateColumnStyle() {
      if (this.isNested) {
        return {};
      }

      const columnWidth = this.swimLaneLabelWidth / 2;

      return {
        'grid-template-columns': `${columnWidth}px ${columnWidth}px 1fr`
      };
    }
  },
  methods: {
    async showToolTip() {
      const { BELOW } = this.openmct.tooltips.TOOLTIP_LOCATIONS;
      this.buildToolTip(await this.getObjectPath(), BELOW, 'swimLane');
    },
    pressOnButton() {
      this.buttonPressed = !this.buttonPressed;
      if (this.buttonPressed) {
        this.buttonClickOn();
      } else {
        this.buttonClickOff();
      }
    }
  }
};
</script>
