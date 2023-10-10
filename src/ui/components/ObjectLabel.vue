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
    ref="root"
    class="c-tree__item__label c-object-label"
    :class="[statusClass]"
    draggable="true"
    @dragstart="dragStart"
    @click="navigateOrPreview"
  >
    <div class="c-tree__item__type-icon c-object-label__type-icon" :class="typeClass">
      <span class="is-status__indicator" :title="`This item is ${status}`"></span>
    </div>
    <div
      ref="objectLabel"
      class="c-tree__item__name c-object-label__name"
      @mouseover.ctrl="showToolTip"
      @mouseleave="hideToolTip"
    >
      {{ domainObject.name }}
    </div>
  </a>
</template>

<script>
import tooltipHelpers from '../../api/tooltips/tooltipMixins';
import ContextMenuGesture from '../mixins/context-menu-gesture';
import ObjectLink from '../mixins/object-link';
import PreviewAction from '../preview/PreviewAction.js';

export default {
  mixins: [ObjectLink, ContextMenuGesture, tooltipHelpers],
  inject: ['openmct'],
  props: {
    domainObject: {
      type: Object,
      required: true
    },
    objectPath: {
      type: Array,
      required: true
    },
    navigateToPath: {
      type: String,
      default: undefined
    },
    readOnly: {
      type: Boolean,
      required: false,
      default() {
        return false;
      }
    }
  },
  data() {
    return {
      status: ''
    };
  },
  computed: {
    typeClass() {
      let type = this.openmct.types.get(this.domainObject.type);
      if (!type) {
        return 'icon-object-unknown';
      }

      return type.definition.cssClass;
    },
    statusClass() {
      return this.status ? `is-status--${this.status}` : '';
    }
  },
  mounted() {
    this.removeStatusListener = this.openmct.status.observe(
      this.domainObject.identifier,
      this.setStatus
    );
    this.status = this.openmct.status.get(this.domainObject.identifier);
    this.previewAction = new PreviewAction(this.openmct);
  },
  unmounted() {
    this.removeStatusListener();
  },
  methods: {
    navigateOrPreview(event) {
      if (this.openmct.editor.isEditing()) {
        event.preventDefault();
        this.preview();
      } else {
        this.openmct.router.navigate(this.objectLink);
      }
    },
    preview() {
      if (this.previewAction.appliesTo(this.objectPath)) {
        this.previewAction.invoke(this.objectPath);
      }
    },
    dragStart(event) {
      let navigatedObject = this.openmct.router.path[0];
      let serializedPath = JSON.stringify(this.objectPath);
      let keyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);

      /*
       * Cannot inspect data transfer objects on dragover/dragenter so impossible to determine composability at
       * that point. If dragged object can be composed by navigated object, then indicate with presence of
       * 'composable-domain-object' in data transfer
       */
      if (this.openmct.composition.checkPolicy(navigatedObject, this.domainObject)) {
        event.dataTransfer.setData(
          'openmct/composable-domain-object',
          JSON.stringify(this.domainObject)
        );
      }

      // serialize domain object anyway, because some views can drag-and-drop objects without composition
      // (eg. notebook.)
      event.dataTransfer.setData('openmct/domain-object-path', serializedPath);
      event.dataTransfer.setData(`openmct/domain-object/${keyString}`, this.domainObject);
    },
    setStatus(status) {
      this.status = status;
    },
    async showToolTip() {
      const { BELOW } = this.openmct.tooltips.TOOLTIP_LOCATIONS;
      this.buildToolTip(await this.getObjectPath(), BELOW, 'objectLabel');
    }
  }
};
</script>
