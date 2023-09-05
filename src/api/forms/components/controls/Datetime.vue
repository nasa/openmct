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
  <div class="c-form-control--datetime">
    <div class="hint date">Date</div>
    <div class="hint time sm">Hour</div>
    <div class="hint time sm">Min</div>
    <div class="hint time sm">Sec</div>
    <div class="hint timezone">Timezone</div>
    <form ref="dateTimeForm" prevent class="u-contents">
      <input
        v-model="date"
        class="field control date"
        :pattern="/\d{4}-\d{2}-\d{2}/"
        :placeholder="format"
        type="date"
        name="date"
        @change="onChange"
      />
      <input
        v-model="hour"
        class="field control hour c-input--sm"
        :pattern="/\d+/"
        type="number"
        name="hour"
        maxlength="10"
        min="0"
        max="23"
        @change="onChange"
      />
      <input
        v-model="min"
        class="field control min c-input--sm"
        :pattern="/\d+/"
        type="number"
        name="min"
        maxlength="2"
        min="0"
        max="59"
        @change="onChange"
      />
      <input
        v-model="sec"
        class="field control sec c-input--sm"
        :pattern="/\d+/"
        type="number"
        name="sec"
        maxlength="2"
        min="0"
        max="59"
        @change="onChange"
      />
      <div class="field control hint timezone">UTC</div>
    </form>
  </div>
</template>

<script>
const DATE_FORMAT = 'YYYY-MM-DD';

export default {
  props: {
    model: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      format: DATE_FORMAT,
      date: '',
      hour: 0,
      min: 0,
      sec: 0
    };
  },
  mounted() {
    this.formatDatetime();
  },
  methods: {
    convertToDatetime(timestamp) {
      const dateValue = new Date(timestamp);
      const date = dateValue.toISOString().slice(0, 10);
      const hour = dateValue.getUTCHours() || 0;
      const min = dateValue.getUTCMinutes() || 0;
      const sec = dateValue.getUTCSeconds() || 0;

      return {
        date,
        hour,
        min,
        sec
      };
    },
    convertToTimestamp() {
      const date = new Date(this.date);
      date.setUTCHours(this.hour || 0);
      date.setUTCMinutes(this.min || 0);
      date.setUTCSeconds(this.sec || 0);

      return date.getTime();
    },
    formatDatetime(timestamp = this.model.value) {
      if (!timestamp) {
        this.resetValues();
        return;
      }

      const datetime = this.convertToDatetime(timestamp);
      this.setDatetime(datetime.date, datetime.hour, datetime.min, datetime.sec);
    },
    onChange() {
      const timestamp = this.convertToTimestamp();
      const model = this.model;
      model.validate = () => this.validate(timestamp);

      const data = {
        model,
        value: new Date(timestamp).toISOString()
      };

      this.$emit('onChange', data);
    },
    resetValues() {
      this.setDatetime();
    },
    setDatetime(date = '', hour = 0, min = 0, sec = 0) {
      this.date = date.toString();
      this.hour = hour;
      this.min = min;
      this.sec = sec;
    },
    validate(timestamp) {
      const valid = timestamp > 0 && this.$refs.dateTimeForm.checkValidity();
      if (!valid) {
        this.$refs.dateTimeForm.reportValidity();
      }

      return valid;
    }
  }
};
</script>
