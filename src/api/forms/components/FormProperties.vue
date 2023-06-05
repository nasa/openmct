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
  <div class="c-form js-form">
    <div class="c-overlay__top-bar c-form__top-bar">
      <div class="c-overlay__dialog-title js-form-title">{{ model.title }}</div>
      <div v-if="hasRequiredFields" class="c-overlay__dialog-hint hint">
        All fields marked <span class="req icon-asterisk"></span> are required.
      </div>
    </div>
    <form name="mctForm" class="c-form__contents" autocomplete="off" @submit.prevent>
      <div
        v-for="section in formSections"
        :key="section.id"
        class="c-form__section"
        :class="section.cssClass"
      >
        <h2 v-if="section.name" class="c-form__section-header">
          {{ section.name }}
        </h2>
        <FormRow
          v-for="(row, index) in section.rows"
          :key="row.id"
          :css-class="row.cssClass"
          :first="index < 1"
          :row="row"
          @onChange="onChange"
        />
      </div>
    </form>

    <div class="mct-form__controls c-overlay__button-bar c-form__bottom-bar">
      <button
        tabindex="0"
        :disabled="isInvalid"
        class="c-button c-button--major"
        aria-label="Save"
        @click="onSave"
      >
        {{ submitLabel }}
      </button>
      <button
        v-if="!shouldHideCancelButton"
        tabindex="0"
        class="c-button js-cancel-button"
        aria-label="Cancel"
        @click="onCancel"
      >
        {{ cancelLabel }}
      </button>
    </div>
  </div>
</template>

<script>
import FormRow from '@/api/forms/components/FormRow.vue';
import { v4 as uuid } from 'uuid';

export default {
  components: {
    FormRow
  },
  inject: ['openmct'],
  props: {
    model: {
      type: Object,
      required: true
    },
    value: {
      type: Object,
      default() {
        return {};
      }
    }
  },
  data() {
    return {
      invalidProperties: {},
      formSections: []
    };
  },
  computed: {
    hasRequiredFields() {
      return this.model.sections.some((section) => section.rows.some((row) => row.required));
    },
    isInvalid() {
      return Object.entries(this.invalidProperties).some(([key, value]) => {
        return value;
      });
    },
    submitLabel() {
      if (this.model.buttons && this.model.buttons.submit && this.model.buttons.submit.label) {
        return this.model.buttons.submit.label;
      }

      return 'OK';
    },
    cancelLabel() {
      if (this.model.buttons && this.model.buttons.cancel && this.model.buttons.cancel.label) {
        return this.model.buttons.submit.label;
      }

      return 'Cancel';
    },
    shouldHideCancelButton() {
      return this.model.buttons?.cancel?.hide === true;
    }
  },
  mounted() {
    this.formSections = this.model.sections.map((section) => {
      section.id = uuid();

      section.rows = section.rows.map((row) => {
        row.id = uuid();

        return row;
      });

      return section;
    });
  },
  methods: {
    onChange(data) {
      this.$set(this.invalidProperties, data.model.key, data.invalid);

      this.$emit('onChange', data);
    },
    onCancel() {
      this.$emit('onCancel');
    },
    onSave() {
      this.$emit('onSave');
    }
  }
};
</script>
