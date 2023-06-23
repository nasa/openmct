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
  <span class="form-control shell">
    <span class="field control" :class="model.cssClass">
      <input
        id="fileElem"
        ref="fileInput"
        type="file"
        :accept="acceptableFileTypes"
        style="display: none"
      />
      <button id="fileSelect" class="c-button" @click="selectFile">
        {{ name }}
      </button>
      <button
        v-if="removable"
        class="c-button icon-trash"
        title="Remove file"
        @click="removeFile"
      ></button>
    </span>
  </span>
</template>

<script>
export default {
  inject: ['openmct'],
  props: {
    model: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      fileInfo: undefined
    };
  },
  computed: {
    name() {
      const fileInfo = this.fileInfo || this.model.value;

      return (fileInfo && fileInfo.name) || this.model.text;
    },
    removable() {
      return (this.fileInfo || this.model.value) && this.model.removable;
    },
    acceptableFileTypes() {
      if (this.model.type) {
        return this.model.type;
      }

      return 'application/json';
    }
  },
  mounted() {
    this.$refs.fileInput.addEventListener('change', this.handleFiles, false);
  },
  methods: {
    handleFiles() {
      const fileList = this.$refs.fileInput.files;
      const file = fileList[0];

      if (this.acceptableFileTypes === 'application/json') {
        this.readFile(file);
      } else {
        this.handleRawFile(file);
      }
    },
    readFile(file) {
      const self = this;
      const fileReader = new FileReader();
      const fileInfo = {};
      fileInfo.name = file.name;
      fileReader.onload = function (event) {
        fileInfo.body = event.target.result;
        self.fileInfo = fileInfo;

        const data = {
          model: self.model,
          value: fileInfo
        };
        self.$emit('onChange', data);
      };

      fileReader.onerror = function (error) {
        console.error('fileReader error', error);
      };

      fileReader.readAsText(file);
    },
    handleRawFile(file) {
      const fileInfo = {
        name: file.name,
        body: file
      };

      this.fileInfo = Object.assign({}, fileInfo);

      const data = {
        model: this.model,
        value: fileInfo
      };

      this.$emit('onChange', data);
    },
    selectFile() {
      this.$refs.fileInput.click();
    },
    removeFile() {
      this.model.value = undefined;
      this.fileInfo = undefined;
      const data = {
        model: this.model,
        value: undefined
      };
      this.$emit('onChange', data);
    }
  }
};
</script>
