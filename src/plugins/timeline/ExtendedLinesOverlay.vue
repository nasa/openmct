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
  <div class="extended-lines-overlay">
    <div
      v-for="(line, index) in extendedLines"
      :key="index"
      class="extended-line"
      :style="{ left: `${line.x}px`, height: `${height}px` }"
    ></div>
  </div>
</template>

<script>
export default {
  name: 'ExtendedLinesOverlay',
  props: {
    extendedLines: {
      type: Array,
      default: () => {}
    },
    height: {
      type: Number,
      required: true
    }
  }
};
</script>

<style scoped>
.extended-lines-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

.extended-line {
  position: absolute;
  top: 0;
  width: 2px;
  background-color: blue;
}
</style>
