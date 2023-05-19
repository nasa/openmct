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
  <div class="c-lad-table-wrapper u-style-receiver js-style-receiver" :class="staleClass">
    <table class="c-table c-lad-table" :class="applyLayoutClass">
      <thead>
        <tr>
          <th>Name</th>
          <th v-if="showTimestamp">Timestamp</th>
          <th>Value</th>
          <th v-if="hasUnits">Units</th>
          <th v-if="showType">Type</th>
        </tr>
      </thead>
      <tbody>
        <lad-row
          v-for="ladRow in items"
          :key="ladRow.key"
          :domain-object="ladRow.domainObject"
          :path-to-table="objectPath"
          :has-units="hasUnits"
          :is-stale="staleObjects.includes(ladRow.key)"
          :configuration="configuration"
          @rowContextClick="updateViewContext"
        />
      </tbody>
    </table>
  </div>
</template>

<script>
import Vue from 'vue';
import LadRow from './LADRow.vue';
import StalenessUtils from '@/utils/staleness';

export default {
  components: {
    LadRow
  },
  inject: ['openmct', 'currentView', 'ladTableConfiguration'],
  props: {
    domainObject: {
      type: Object,
      required: true
    },
    objectPath: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      items: [],
      viewContext: {},
      staleObjects: [],
      configuration: this.ladTableConfiguration.getConfiguration()
    };
  },
  computed: {
    hasUnits() {
      let itemsWithUnits = this.items.filter((item) => {
        let metadata = this.openmct.telemetry.getMetadata(item.domainObject);
        const valueMetadatas = metadata ? metadata.valueMetadatas : [];

        return this.metadataHasUnits(valueMetadatas);
      });

      return itemsWithUnits.length !== 0 && !this.configuration?.hiddenColumns?.units;
    },
    showTimestamp() {
      return !this.configuration?.hiddenColumns?.timestamp;
    },
    showType() {
      return !this.configuration?.hiddenColumns?.type;
    },
    staleClass() {
      if (this.staleObjects.length !== 0) {
        return 'is-stale';
      }

      return '';
    },
    applyLayoutClass() {
      if (this.configuration.isFixedLayout) {
        return 'fixed-layout';
      }

      return '';
    }
  },
  watch: {
    configuration: {
      handler(newVal) {
        if (this.viewActionsCollection) {
          if (newVal.isFixedLayout) {
            this.viewActionsCollection.show(['lad-expand-columns']);
            this.viewActionsCollection.hide(['lad-autosize-columns']);
          } else {
            this.viewActionsCollection.show(['lad-autosize-columns']);
            this.viewActionsCollection.hide(['lad-expand-columns']);
          }
        }
      },
      deep: true
    }
  },
  async mounted() {
    this.ladTableConfiguration.on('change', this.handleConfigurationChange);
    this.composition = this.openmct.composition.get(this.domainObject);
    this.composition.on('add', this.addItem);
    this.composition.on('remove', this.removeItem);
    this.composition.on('reorder', this.reorder);
    this.composition.load();
    this.stalenessSubscription = {};
    await Vue.nextTick();
    this.viewActionsCollection = this.openmct.actions.getActionsCollection(
      this.objectPath,
      this.currentView
    );
    this.initializeViewActions();
  },
  destroyed() {
    this.ladTableConfiguration.off('change', this.handleConfigurationChange);

    this.composition.off('add', this.addItem);
    this.composition.off('remove', this.removeItem);
    this.composition.off('reorder', this.reorder);

    Object.values(this.stalenessSubscription).forEach((stalenessSubscription) => {
      stalenessSubscription.unsubscribe();
      stalenessSubscription.stalenessUtils.destroy();
    });
  },
  methods: {
    addItem(domainObject) {
      let item = {};
      item.domainObject = domainObject;
      item.key = this.openmct.objects.makeKeyString(domainObject.identifier);

      this.items.push(item);

      this.stalenessSubscription[item.key] = {};
      this.stalenessSubscription[item.key].stalenessUtils = new StalenessUtils(
        this.openmct,
        domainObject
      );
      this.openmct.telemetry.isStale(domainObject).then((stalenessResponse) => {
        if (stalenessResponse !== undefined) {
          this.handleStaleness(item.key, stalenessResponse);
        }
      });
      const stalenessSubscription = this.openmct.telemetry.subscribeToStaleness(
        domainObject,
        (stalenessResponse) => {
          this.handleStaleness(item.key, stalenessResponse);
        }
      );

      this.stalenessSubscription[item.key].unsubscribe = stalenessSubscription;
    },
    removeItem(identifier) {
      const SKIP_CHECK = true;
      const keystring = this.openmct.objects.makeKeyString(identifier);
      const index = this.items.findIndex((item) => keystring === item.key);

      this.items.splice(index, 1);

      this.stalenessSubscription[keystring].unsubscribe();
      this.handleStaleness(keystring, { isStale: false }, SKIP_CHECK);
    },
    reorder(reorderPlan) {
      const oldItems = this.items.slice();
      reorderPlan.forEach((reorderEvent) => {
        this.$set(this.items, reorderEvent.newIndex, oldItems[reorderEvent.oldIndex]);
      });
    },
    metadataHasUnits(valueMetadatas) {
      const metadataWithUnits = valueMetadatas.filter((metadatum) => metadatum.unit);

      return metadataWithUnits.length > 0;
    },
    handleConfigurationChange(configuration) {
      this.configuration = configuration;
    },
    handleStaleness(id, stalenessResponse, skipCheck = false) {
      if (
        skipCheck ||
        this.stalenessSubscription[id].stalenessUtils.shouldUpdateStaleness(stalenessResponse)
      ) {
        const index = this.staleObjects.indexOf(id);
        if (stalenessResponse.isStale) {
          if (index === -1) {
            this.staleObjects.push(id);
          }
        } else {
          if (index !== -1) {
            this.staleObjects.splice(index, 1);
          }
        }
      }
    },
    updateViewContext(rowContext) {
      this.viewContext.row = rowContext;
    },
    getViewContext() {
      return {
        ...this.viewContext,
        type: 'lad-table',
        toggleFixedLayout: this.toggleFixedLayout
      };
    },
    toggleFixedLayout() {
      const config = structuredClone(this.configuration);

      config.isFixedLayout = !this.configuration.isFixedLayout;
      this.ladTableConfiguration.updateConfiguration(config);
    },
    initializeViewActions() {
      if (this.configuration.isFixedLayout) {
        this.viewActionsCollection.show(['lad-expand-columns']);
        this.viewActionsCollection.hide(['lad-autosize-columns']);
      } else {
        this.viewActionsCollection.hide(['lad-expand-columns']);
        this.viewActionsCollection.show(['lad-autosize-columns']);
      }
    }
  }
};
</script>
