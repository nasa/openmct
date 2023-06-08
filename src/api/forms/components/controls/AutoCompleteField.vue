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
  <div ref="autoCompleteForm" class="form-control c-input--autocomplete js-autocomplete">
    <div class="c-input--autocomplete__wrapper">
      <input
        ref="autoCompleteInput"
        v-model="field"
        class="c-input--autocomplete__input js-autocomplete__input"
        type="text"
        :placeholder="placeHolderText"
        @click="inputClicked()"
        @keydown="keyDown($event)"
      />
      <div
        class="icon-arrow-down c-icon-button c-input--autocomplete__afford-arrow js-autocomplete__afford-arrow"
        @click="arrowClicked()"
      ></div>
    </div>
    <div
      v-if="!hideOptions && filteredOptions.length > 0"
      class="c-menu c-input--autocomplete__options js-autocomplete-options"
      aria-label="Autocomplete Options"
      @blur="hideOptions = true"
    >
      <ul>
        <li
          v-for="opt in filteredOptions"
          :key="opt.optionId"
          :class="[{ optionPreSelected: optionIndex === opt.optionId }, itemCssClass]"
          :style="itemStyle(opt)"
          @click="fillInputWithString(opt.name)"
          @mouseover="optionMouseover(opt.optionId)"
        >
          {{ opt.name }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
const key = {
  down: 40,
  up: 38,
  enter: 13
};

export default {
  props: {
    model: {
      type: Object,
      required: true,
      default() {
        return {};
      }
    },
    placeHolderText: {
      type: String,
      default() {
        return '';
      }
    },
    itemCssClass: {
      type: String,
      required: false,
      default() {
        return '';
      }
    }
  },
  data() {
    return {
      hideOptions: true,
      showFilteredOptions: false,
      optionIndex: 0,
      field: this.model.value
    };
  },
  computed: {
    filteredOptions() {
      const fullOptions = this.options || [];
      if (this.showFilteredOptions) {
        const optionsFiltered = fullOptions
          .filter((option) => {
            if (option.name && this.field) {
              return option.name.toLowerCase().indexOf(this.field.toLowerCase()) >= 0;
            }

            return false;
          })
          .map((option, index) => {
            return {
              optionId: index,
              name: option.name,
              color: option.color
            };
          });

        return optionsFiltered;
      }

      const optionsFiltered = fullOptions.map((option, index) => {
        return {
          optionId: index,
          name: option.name,
          color: option.color
        };
      });

      return optionsFiltered;
    }
  },
  watch: {
    field(newValue, oldValue) {
      if (newValue !== oldValue) {
        const data = {
          model: this.model,
          value: newValue
        };

        this.$emit('onChange', data);
      }
    },
    hideOptions(newValue) {
      if (!newValue) {
        // adding a event listener when the hideOptions is false (dropdown is visible)
        // handleoutsideclick can collapse the dropdown when clicked outside autocomplete
        document.body.addEventListener('click', this.handleOutsideClick);
      } else {
        //removing event listener when hideOptions become true (dropdown is collapsed)
        document.body.removeEventListener('click', this.handleOutsideClick);
      }
    }
  },
  mounted() {
    this.autocompleteInputAndArrow = this.$refs.autoCompleteForm;
    this.autocompleteInputElement = this.$refs.autoCompleteInput;
    if (this.model.options && this.model.options.length && !this.model.options[0].name) {
      // If options is only an array of string.
      this.options = this.model.options.map((option) => {
        return {
          name: option
        };
      });
    } else {
      this.options = this.model.options;
    }
  },
  destroyed() {
    document.body.removeEventListener('click', this.handleOutsideClick);
  },
  methods: {
    decrementOptionIndex() {
      if (this.optionIndex === 0) {
        this.optionIndex = this.filteredOptions.length;
      }

      this.optionIndex--;
      this.scrollIntoView();
    },
    incrementOptionIndex() {
      if (this.optionIndex === this.filteredOptions.length - 1) {
        this.optionIndex = -1;
      }

      this.optionIndex++;
      this.scrollIntoView();
    },
    fillInputWithString(string) {
      this.hideOptions = true;
      this.field = string;
    },
    showOptions() {
      this.hideOptions = false;
      this.optionIndex = 0;
    },
    keyDown($event) {
      this.showFilteredOptions = true;
      if (this.filteredOptions) {
        let keyCode = $event.keyCode;
        switch (keyCode) {
          case key.down:
            this.incrementOptionIndex();
            break;
          case key.up:
            $event.preventDefault(); // Prevents cursor jumping back and forth
            this.decrementOptionIndex();
            break;
          case key.enter:
            if (this.filteredOptions[this.optionIndex]) {
              this.fillInputWithString(this.filteredOptions[this.optionIndex].name);
            }
        }
      }
    },
    inputClicked() {
      this.autocompleteInputElement.select();
      this.showOptions();
    },
    arrowClicked() {
      // if the user clicked the arrow, we want
      // to show them all the options
      this.showFilteredOptions = false;
      this.autocompleteInputElement.select();

      if (!this.hideOptions && this.filteredOptions.length > 0) {
        this.hideOptions = true;
      } else {
        this.showOptions();
      }
    },
    handleOutsideClick(event) {
      // if click event is detected outside autocomplete (both input & arrow) while the
      // dropdown is visible, this will collapse the dropdown.
      const clickedInsideAutocomplete = this.autocompleteInputAndArrow.contains(event.target);
      if (!clickedInsideAutocomplete && !this.hideOptions) {
        this.hideOptions = true;
      }
    },
    optionMouseover(optionId) {
      this.optionIndex = optionId;
    },
    scrollIntoView() {
      setTimeout(() => {
        const element = this.$el.querySelector('.optionPreSelected');
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }
      });
    },
    itemStyle(option) {
      if (option.color) {
        return { '--optionIconColor': option.color };
      }
    }
  }
};
</script>
