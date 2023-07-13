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
  <div
    class="c-indicator c-indicator--clickable icon-camera"
    :class="[
      { 's-status-off': snapshotCount === 0 },
      { 's-status-on': snapshotCount > 0 },
      { 's-status-caution': snapshotCount === snapshotMaxCount },
      { 'has-new-snapshot': flashIndicator }
    ]"
  >
    <span class="label c-indicator__label">
      {{ indicatorTitle }}
      <button @click="toggleSnapshot">
        {{ expanded ? 'Hide' : 'Show' }}
      </button>
    </span>
    <span class="c-indicator__count">{{ snapshotCount }}</span>
  </div>
</template>

<script>
import SnapshotContainerComponent from './NotebookSnapshotContainer.vue';
import { EVENT_SNAPSHOTS_UPDATED } from '../notebook-constants';
import { NOTEBOOK_SNAPSHOT_MAX_COUNT } from '../snapshot-container';
import mount from 'utils/mount';

export default {
  inject: ['openmct', 'snapshotContainer'],
  data() {
    return {
      expanded: false,
      indicatorTitle: '',
      snapshotCount: 0,
      snapshotMaxCount: NOTEBOOK_SNAPSHOT_MAX_COUNT,
      flashIndicator: false
    };
  },
  mounted() {
    this.snapshotContainer.on(EVENT_SNAPSHOTS_UPDATED, this.snapshotsUpdated);
    this.updateSnapshotIndicatorTitle();
  },
  methods: {
    notifyNewSnapshot() {
      this.flashIndicator = true;
      setTimeout(this.removeNotify, 15000);
    },
    removeNotify() {
      this.flashIndicator = false;
    },
    snapshotsUpdated() {
      if (this.snapshotContainer.getSnapshots().length > this.snapshotCount) {
        this.notifyNewSnapshot();
      }

      this.updateSnapshotIndicatorTitle();
    },
    toggleSnapshot() {
      this.expanded = !this.expanded;

      const drawerElement = document.querySelector('.l-shell__drawer');
      drawerElement.classList.toggle('is-expanded');

      this.updateSnapshotContainer();
    },
    updateSnapshotContainer() {
      const { openmct, snapshotContainer } = this;
      const toggleSnapshot = this.toggleSnapshot.bind(this);
      const drawerElement = document.querySelector('.l-shell__drawer');
      drawerElement.innerHTML = '<div></div>';
      const divElement = document.querySelector('.l-shell__drawer div');

      mount(
        {
          el: divElement,
          components: {
            SnapshotContainerComponent
          },
          provide: {
            openmct,
            snapshotContainer
          },
          data() {
            return {
              toggleSnapshot
            };
          },
          template:
            '<SnapshotContainerComponent :toggleSnapshot="toggleSnapshot"></SnapshotContainerComponent>'
        },
        {
          app: openmct.app,
          element: divElement
        }
      );
    },
    updateSnapshotIndicatorTitle() {
      const snapshotCount = this.snapshotContainer.getSnapshots().length;
      this.snapshotCount = snapshotCount;
      const snapshotTitleSuffix = snapshotCount === 1 ? 'Snapshot' : 'Snapshots';
      this.indicatorTitle = `${snapshotCount} ${snapshotTitleSuffix}`;
    }
  }
};
</script>
