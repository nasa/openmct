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
  <tr
    ref="root"
    class="c-list-item js-folder-child"
    :class="{
      'is-alias': item.isAlias === true
    }"
    @click="navigate"
  >
    <td class="c-list-item__name">
      <a ref="objectLink" class="c-object-label" :class="[statusClass]" @click="navigate">
        <div
          class="c-object-label__type-icon c-list-item__name__type-icon"
          :class="item.type.cssClass"
        >
          <span class="is-status__indicator" :title="`This item is ${status}`"></span>
        </div>
        <div class="c-object-label__name c-list-item__name__name">{{ item.model.name }}</div>
      </a>
    </td>
    <td class="c-list-item__type">
      {{ item.type.name }}
    </td>
    <td class="c-list-item__date-created">
      {{ formatTime(item.model.persisted, 'YYYY-MM-DD HH:mm:ss:SSS') }}Z
    </td>
    <td class="c-list-item__date-updated">
      {{ formatTime(item.model.modified, 'YYYY-MM-DD HH:mm:ss:SSS') }}Z
    </td>
  </tr>
</template>

<script>
import moment from 'moment';
import contextMenuGesture from '../../../ui/mixins/context-menu-gesture';
import objectLink from '../../../ui/mixins/object-link';
import statusListener from './status-listener';

export default {
  mixins: [contextMenuGesture, objectLink, statusListener],
  inject: ['openmct'],
  props: {
    item: {
      type: Object,
      required: true
    }
  },
  methods: {
    formatTime(timestamp, format) {
      return moment(timestamp).format(format);
    },
    navigate() {
      this.openmct.router.navigate(this.objectLink);
    }
  }
};
</script>
