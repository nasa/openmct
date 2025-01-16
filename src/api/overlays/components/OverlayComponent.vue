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
  <div class="c-overlay js-overlay" role="dialog" aria-modal="true" aria-label="Modal Overlay">
    <div class="c-overlay__blocker" @click="destroy"></div>
    <div class="c-overlay__outer">
      <button
        v-if="dismissible"
        aria-label="Close"
        class="c-click-icon c-overlay__close-button icon-x"
        @click.stop="destroy"
      ></button>
      <div class="c-overlay__content-wrapper">
        <div
          ref="element"
          class="c-overlay__contents js-notebook-snapshot-item-wrapper"
          tabindex="0"
        ></div>
        <div v-if="buttons || showSuppressOption" class="c-overlay__footer">
          <div class="c-overlay__suppress-option">
            <div v-if="showSuppressOption">
              <input
                id="suppressCheckbox"
                v-model="suppress"
                type="checkbox"
                class="l-composite-control l-checkbox"
                aria-label="Checkbox to Suppress Dialog"
              />
              <label for="suppressCheckbox">{{ suppressionText }}</label>
            </div>
          </div>
          <div v-if="buttons" class="c-overlay__button-bar">
            <button
              v-for="(button, buttonIndex) in buttons"
              ref="buttons"
              :key="buttonIndex"
              class="c-button js-overlay__button"
              tabindex="0"
              :class="{ 'c-button--major': focusIndex === buttonIndex }"
              @focus="focusIndex = buttonIndex"
              @click="buttonClickHandler(button.callback)"
            >
              {{ button.label }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  inject: ['dismiss', 'element', 'buttons', 'dismissible', 'showSuppressOption', 'suppressionText'],
  emits: ['destroy'],
  data() {
    return {
      focusIndex: -1,
      suppress: false
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
      if (this.dismissible) {
        this.dismiss();
      }
    },
    buttonClickHandler(method) {
      let callbackData = {
        suppress: this.suppress
      };
      method(callbackData);
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
