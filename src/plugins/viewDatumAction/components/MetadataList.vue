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
  <div class="c-attributes-view">
    <div class="c-overlay__top-bar">
      <div class="c-overlay__dialog-title">{{ name }}</div>
    </div>
    <div class="c-overlay__contents-main l-preview-window__object-view">
      <ul class="c-attributes-view__content">
        <li v-for="attribute in Object.keys(attributes)" :key="attribute">
          <span class="c-attributes-view__grid-item__label">{{ attribute }}</span>
          <span class="c-attributes-view__grid-item__value">{{ attributes[attribute] }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  inject: ['name', 'attributes']
};
</script>
