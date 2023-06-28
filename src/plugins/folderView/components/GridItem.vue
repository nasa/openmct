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
  <a
    class="l-grid-view__item c-grid-item js-folder-child"
    :class="[
      {
        'is-alias': item.isAlias === true,
        'c-grid-item--unknown':
          item.type.cssClass === undefined || item.type.cssClass.indexOf('unknown') !== -1
      },
      statusClass
    ]"
    @click="navigate"
  >
    <div
      class="c-grid-item__type-icon"
      :class="
        item.type.cssClass != undefined ? 'bg-' + item.type.cssClass : 'bg-icon-object-unknown'
      "
    ></div>
    <div class="c-grid-item__details">
      <!-- Name and metadata -->
      <div class="c-grid-item__name" :title="item.model.name">{{ item.model.name }}</div>
      <div class="c-grid-item__metadata" :title="item.type.name">
        <span class="c-grid-item__metadata__type">{{ item.type.name }}</span>
      </div>
    </div>
    <div class="c-grid-item__controls">
      <div class="is-status__indicator" :title="`This item is ${status}`"></div>
      <div class="icon-people" title="Shared"></div>
      <button class="c-icon-button icon-info c-info-button" title="More Info"></button>
      <div class="icon-pointer-right c-pointer-icon"></div>
    </div>
  </a>
</template>

<script>
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
    navigate() {
      this.openmct.router.navigate(this.objectLink);
    }
  }
};
</script>
