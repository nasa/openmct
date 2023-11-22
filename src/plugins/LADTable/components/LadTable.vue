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
          <th v-for="limitColumn in limitColumnNames" :key="limitColumn.key">
            {{ limitColumn.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <lad-row
          v-for="ladRow in items"
          :key="ladRow.key"
          :domain-object="ladRow.domainObject"
          :limit-definition="ladRow.limitDefinition"
          :limit-column-names="limitColumnNames"
          :path-to-table="objectPath"
          :has-units="hasUnits"
          :is-stale="staleObjects.includes(ladRow.key)"
          :configuration="configuration"
          @row-context-click="updateViewContext"
        />
      </tbody>
    </table>
  </div>
</template>

<script>
import { nextTick, toRaw } from 'vue';

import stalenessMixin from '@/ui/mixins/staleness-mixin';

import LadRow from './LadRow.vue';

export default {
  components: {
    LadRow
  },
  mixins: [stalenessMixin],
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
    limitColumnNames() {
      const limitDefinitions = [];

      this.items.forEach((item) => {
        if (item.limitDefinition) {
          const limits = Object.keys(item.limitDefinition);
          limits.forEach((limit) => {
            const limitAlreadyAdded = limitDefinitions.some((limitDef) => limitDef.key === limit);
            const limitHidden = this.configuration?.hiddenColumns?.[limit];
            if (!limitAlreadyAdded && !limitHidden) {
              limitDefinitions.push({ label: `Limit ${limit}`, key: limit });
            }
          });
        }
      });
      return limitDefinitions;
    },
    showTimestamp() {
      return !this.configuration?.hiddenColumns?.timestamp;
    },
    showType() {
      return !this.configuration?.hiddenColumns?.type;
    },
    staleClass() {
      return this.isStale ? 'is-stale' : '';
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
    await nextTick();
    this.viewActionsCollection = this.openmct.actions.getActionsCollection(
      this.objectPath,
      this.currentView
    );
    this.setupClockChangedEvent((domainObject) => {
      this.triggerUnsubscribeFromStaleness(domainObject);
      this.subscribeToStaleness(domainObject);
    });

    this.initializeViewActions();
  },
  unmounted() {
    this.ladTableConfiguration.off('change', this.handleConfigurationChange);

    this.composition.off('add', this.addItem);
    this.composition.off('remove', this.removeItem);
    this.composition.off('reorder', this.reorder);
  },
  methods: {
    async addItem(domainObject) {
      let item = {};
      item.domainObject = domainObject;
      item.key = this.openmct.objects.makeKeyString(domainObject.identifier);
      item.limitDefinition = await this.openmct.telemetry.limitDefinition(domainObject).limits();

      this.items.push(item);
      this.subscribeToStaleness(domainObject);
    },
    removeItem(identifier) {
      const keystring = this.openmct.objects.makeKeyString(identifier);

      const index = this.items.findIndex((item) => keystring === item.key);
      this.items.splice(index, 1);

      const domainObject = this.openmct.objects.get(keystring);
      this.triggerUnsubscribeFromStaleness(domainObject);
    },
    reorder(reorderPlan) {
      const oldItems = this.items.slice();
      reorderPlan.forEach((reorderEvent) => {
        this.items[reorderEvent.newIndex] = oldItems[reorderEvent.oldIndex];
      });
    },
    metadataHasUnits(valueMetadatas) {
      const metadataWithUnits = valueMetadatas.filter((metadatum) => metadatum.unit);

      return metadataWithUnits.length > 0;
    },
    handleConfigurationChange(configuration) {
      this.configuration = configuration;
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
      const config = structuredClone(toRaw(this.configuration));

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
