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
  <div class="c-overlay js-overlay">
    <div class="c-overlay__blocker" @click="destroy"></div>
    <div class="c-overlay__outer">
      <button
        v-if="dismissable"
        aria-label="Close"
        class="c-click-icon c-overlay__close-button icon-x"
        @click.stop="destroy"
      ></button>
      <div
        ref="element"
        class="c-overlay__contents js-notebook-snapshot-item-wrapper"
        tabindex="0"
        aria-modal="true"
        role="dialog"
      ></div>
      <div v-if="buttons" class="c-overlay__button-bar">
        <button
          v-for="(button, index) in buttons"
          ref="buttons"
          :key="index"
          class="c-button js-overlay__button"
          tabindex="0"
          :class="{ 'c-button--major': focusIndex === index }"
          @focus="focusIndex = index"
          @click="buttonClickHandler(button.callback)"
        >
          {{ button.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  inject: ['dismiss', 'element', 'buttons', 'dismissable'],
  data: function () {
    return {
      focusIndex: -1
    };
  },
  mounted() {
    const element = this.$refs.element;
    element.appendChild(this.element);
    const elementForFocus = this.getElementForFocus() || element;
    this.$nextTick(() => {
      elementForFocus.focus();
    });
  },
  methods: {
    destroy() {
      if (this.dismissable) {
        this.dismiss();
      }
    },
    buttonClickHandler(method) {
      method();
      this.$emit('destroy');
    },
    getElementForFocus() {
      const defaultElement = this.$refs.element;
      if (!this.$refs.buttons) {
        return defaultElement;
      }

      const focusButton = this.$refs.buttons.filter((button, index) => {
        if (this.buttons[index].emphasis) {
          this.focusIndex = index;
        }

        return this.buttons[index].emphasis;
      });

      if (!focusButton.length) {
        return defaultElement;
      }

      return focusButton[0];
    }
  }
};
</script>
