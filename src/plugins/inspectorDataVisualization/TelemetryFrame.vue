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
  <div class="c-telemetry-frame">
    <div class="c-telemetry-frame__title-bar">
      <span class="c-telemetry-frame__title">
        <span class="c-telemetry-frame__title-icon icon-telemetry"></span>
        <span class="title-text">{{ telemetryObject.name }}</span>
      </span>
      <button
        ref="menu-button"
        title="More actions"
        aria-label="More actions"
        class="l-browse-bar__actions c-icon-button icon-3-dots"
        @click="toggleMenu"
      ></button>
    </div>
    <div
      v-if="showMenu"
      class="c-menu c-menu__inspector-telemetry-options"
      aria-label="Telemetry Options"
      @blur="showMenu = false"
    >
      <ul>
        <li
          v-if="telemetryObject.type === 'yamcs.telemetry'"
          role="menuitem"
          title="View Full Screen"
          class="icon-eye-open"
          @click="previewTelemetry"
        >
          View Full Screen
        </li>
        <li
          role="menuitem"
          title="Open in a new browser tab"
          class="icon-new-window"
          @click="openInNewTab"
        >
          Open In New Tab
        </li>
      </ul>
    </div>
    <slot></slot>
  </div>
</template>

<script>
export default {
  inject: ['openmct'],
  provide() {
    return {
      domainObject: this.telemetryObject
    };
  },
  props: {
    bounds: {
      type: Object,
      default: () => {}
    },
    telemetryObject: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      showMenu: false
    };
  },
  methods: {
    toggleMenu() {
      this.showMenu = !this.showMenu;
    },
    async getTelemetryPath() {
      const telemetryObjectKeyString = this.openmct.objects.makeKeyString(
        this.telemetryObject.identifier
      );

      const telemetryPath = await this.openmct.objects.getOriginalPath(telemetryObjectKeyString);
      return telemetryPath;
    },
    async openInNewTab() {
      const telemetryPath = await this.getTelemetryPath();
      const sourceTelemObject = telemetryPath[0];
      const timeBounds = this.bounds;
      const urlParams = {
        'tc.startBound': timeBounds?.start,
        'tc.endBound': timeBounds?.end,
        'tc.mode': 'fixed'
      };
      const newTabAction = this.openmct.actions.getAction('newTab');
      newTabAction.invoke([sourceTelemObject], urlParams);
      this.showMenu = false;
    },
    previewTelemetry() {
      const previewAction = this.openmct.actions.getAction('preview');
      previewAction.invoke([this.telemetryObject]);
      this.showMenu = false;
    }
  }
};
</script>
