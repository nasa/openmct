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
  <SwimLane
    :icon-class="item.type.definition.cssClass"
    :status="status"
    :min-height="item.height"
    :show-ucontents="isPlanLikeObject(item.domainObject)"
    :span-rows-count="item.rowCount"
    :domain-object="item.domainObject"
    :button-title="`Toggle extended event lines overlay for ${item.domainObject.name}`"
    button-icon="icon-arrows-up-down"
    :hide-button="!item.isEventTelemetry"
    :button-click-on="enableExtendEventLines"
    :button-click-off="disableExtendEventLines"
  >
    <template #label>
      {{ item.domainObject.name }}
    </template>
    <template #object>
      <ObjectView
        ref="objectView"
        class="u-contents"
        :default-object="item.domainObject"
        :object-path="item.objectPath"
        @change-action-collection="setActionCollection"
      />
    </template>
  </SwimLane>
</template>

<script>
import ObjectView from '@/ui/components/ObjectView.vue';
import SwimLane from '@/ui/components/swim-lane/SwimLane.vue';

export default {
  components: {
    ObjectView,
    SwimLane
  },
  inject: ['openmct'],
  props: {
    item: {
      type: Object,
      required: true
    },
    extendedLinesBus: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      domainObject: null,
      mutablePromise: null,
      status: ''
    };
  },
  watch: {
    item(newItem) {
      if (!this.context) {
        return;
      }

      this.context.item = newItem.domainObject;
    }
  },
  mounted() {
    if (this.openmct.objects.supportsMutation(this.item.domainObject.identifier)) {
      this.mutablePromise = this.openmct.objects
        .getMutable(this.item.domainObject.identifier)
        .then(this.setObject);
    } else {
      this.openmct.objects.get(this.item.domainObject.identifier).then(this.setObject);
    }
  },
  beforeUnmount() {
    if (this.removeSelectable) {
      this.removeSelectable();
    }

    if (this.removeStatusListener) {
      this.removeStatusListener();
    }

    if (this.mutablePromise) {
      this.mutablePromise.then(() => {
        this.openmct.objects.destroyMutable(this.domainObject);
      });
    } else if (this?.domainObject?.isMutable) {
      this.openmct.objects.destroyMutable(this.domainObject);
    }
  },
  methods: {
    async setObject(domainObject) {
      this.domainObject = domainObject;
      this.mutablePromise = null;
      await this.$nextTick();
      let reference = this.$refs.objectView;

      if (reference) {
        let childContext = this.$refs.objectView.getSelectionContext();
        childContext.item = domainObject;
        this.context = childContext;
        if (this.removeSelectable) {
          this.removeSelectable();
        }

        this.removeSelectable = this.openmct.selection.selectable(this.$el, this.context);
      }

      if (this.removeStatusListener) {
        this.removeStatusListener();
      }

      this.removeStatusListener = this.openmct.status.observe(
        this.domainObject.identifier,
        this.setStatus
      );
      this.status = this.openmct.status.get(this.domainObject.identifier);
    },
    enableExtendEventLines() {
      const keyString = this.openmct.objects.makeKeyString(this.item.domainObject.identifier);
      this.extendedLinesBus.enableExtendEventLines(keyString);
    },
    disableExtendEventLines() {
      const keyString = this.openmct.objects.makeKeyString(this.item.domainObject.identifier);
      this.extendedLinesBus.disableExtendEventLines(keyString);
    },
    setActionCollection(actionCollection) {
      this.openmct.menus.actionsToMenuItems(
        actionCollection.getVisibleActions(),
        actionCollection.objectPath,
        actionCollection.view
      );
    },
    setStatus(status) {
      this.status = status;
    },
    isPlanLikeObject(domainObject) {
      return domainObject.type === 'plan' || domainObject.type === 'gantt-chart';
    }
  }
};
</script>
