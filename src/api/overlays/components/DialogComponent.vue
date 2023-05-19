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
  <div class="c-message">
    <!--Uses flex-row -->
    <div class="c-message__icon" :class="['u-icon-bg-color-' + iconClass]"></div>
    <div class="c-message__text">
      <!-- Uses flex-column -->
      <div v-if="title" class="c-message__title">
        {{ title }}
      </div>

      <div v-if="hint" class="c-message__hint">
        {{ hint }}
        <span v-if="timestamp">[{{ timestamp }}]</span>
      </div>

      <div v-if="message" class="c-message__action-text">
        {{ message }}
      </div>
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  inject: ['iconClass', 'title', 'hint', 'timestamp', 'message']
};
</script>
