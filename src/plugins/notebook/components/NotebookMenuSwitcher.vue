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
  <div class="c-menu-button c-ctrl-wrapper c-ctrl-wrapper--menus-left">
    <button
      class="c-icon-button c-button--menu icon-camera"
      title="Take a Notebook Snapshot"
      @click.stop.prevent="showMenu"
    >
      <span title="Take Notebook Snapshot" class="c-icon-button__label"> Snapshot </span>
    </button>
  </div>
</template>

<script>
import Snapshot from '../snapshot';
import { getDefaultNotebook, validateNotebookStorageObject } from '../utils/notebook-storage';
import { NOTEBOOK_DEFAULT, NOTEBOOK_SNAPSHOT } from '../notebook-constants';
import { getMenuItems } from '../utils/notebook-snapshot-menu';

export default {
  inject: ['openmct'],
  props: {
    currentView: {
      type: Object,
      default() {
        return {};
      }
    },
    domainObject: {
      type: Object,
      default() {
        return {};
      }
    },
    isPreview: {
      type: Boolean,
      default() {
        return false;
      }
    },
    objectPath: {
      type: Array,
      default() {
        return null;
      }
    }
  },
  data() {
    return {
      notebookSnapshot: undefined,
      notebookTypes: []
    };
  },
  mounted() {
    validateNotebookStorageObject();

    this.notebookSnapshot = new Snapshot(this.openmct);
    this.setDefaultNotebookStatus();
  },
  methods: {
    getPreviewObjectLink() {
      const relativePath = this.openmct.objects.getRelativePath(this.objectPath);
      const urlParams = this.openmct.router.getParams();
      urlParams.view = this.currentView.key;

      const urlParamsString = Object.entries(urlParams)
        .map(([key, value]) => `${key}=${value}`)
        .join('&');

      return `#/browse/${relativePath}?${urlParamsString}`;
    },
    async showMenu(event) {
      const menuItemOptions = {
        default: {
          cssClass: 'icon-notebook',
          name: `Save to Notebook`,
          onItemClicked: () => this.snapshot(NOTEBOOK_DEFAULT, event.target)
        },
        snapshot: {
          cssClass: 'icon-camera',
          name: 'Save to Notebook Snapshots',
          onItemClicked: () => this.snapshot(NOTEBOOK_SNAPSHOT, event.target)
        }
      };

      const notebookTypes = await getMenuItems(this.openmct, menuItemOptions);
      const elementBoundingClientRect = this.$el.getBoundingClientRect();
      const x = elementBoundingClientRect.x;
      const y = elementBoundingClientRect.y + elementBoundingClientRect.height;
      this.openmct.menus.showMenu(x, y, notebookTypes);
    },
    snapshot(notebookType, target) {
      this.$nextTick(() => {
        const wrapper =
          (target && target.closest('.js-notebook-snapshot-item-wrapper')) || document;
        const element = wrapper.querySelector('.js-notebook-snapshot-item');
        const objectPath = this.objectPath || this.openmct.router.path;
        const link = this.isPreview ? this.getPreviewObjectLink() : window.location.hash;
        const snapshotMeta = {
          bounds: this.openmct.time.bounds(),
          link,
          objectPath,
          openmct: this.openmct
        };

        this.notebookSnapshot.capture(snapshotMeta, notebookType, element);
      });
    },
    setDefaultNotebookStatus() {
      let defaultNotebookObject = getDefaultNotebook();
      if (defaultNotebookObject) {
        let notebookIdentifier = defaultNotebookObject.identifier;

        this.openmct.status.set(notebookIdentifier, 'notebook-default');
      }
    }
  }
};
</script>
