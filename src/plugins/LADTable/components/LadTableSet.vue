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
  <div class="c-lad-table-wrapper u-style-receiver js-style-receiver" :class="staleClass">
    <table class="c-table c-lad-table">
      <thead>
        <tr>
          <th>Name</th>
          <th v-if="showTimestamp">Timestamp</th>
          <th>Value</th>
          <th v-if="showType">Type</th>
          <th v-if="hasUnits">Units</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="ladTable in ladTableObjects" :key="ladTable.key">
          <tr class="c-table__group-header js-lad-table-set__table-headers">
            <td colspan="10">
              {{ ladTable.domainObject.name }}
            </td>
          </tr>
          <lad-row
            v-for="ladRow in ladTelemetryObjects[ladTable.key]"
            :key="combineKeys(ladTable.key, ladRow.key)"
            :domain-object="ladRow.domainObject"
            :path-to-table="ladTable.objectPath"
            :has-units="hasUnits"
            :is-stale="staleObjects.includes(ladRow.key)"
            :configuration="configuration"
            @row-context-click="updateViewContext"
          />
        </template>
      </tbody>
    </table>
  </div>
</template>

<script>
import { toRaw } from 'vue';

import stalenessMixin from '@/ui/mixins/staleness-mixin';

import LadRow from './LadRow.vue';

export default {
  components: {
    LadRow
  },
  mixins: [stalenessMixin],
  inject: ['openmct', 'objectPath', 'currentView', 'ladTableConfiguration'],
  props: {
    domainObject: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      ladTableObjects: [],
      ladTelemetryObjects: {},
      viewContext: {},
      configuration: this.ladTableConfiguration.getConfiguration(),
      subscribedObjects: {}
    };
  },
  computed: {
    hasUnits() {
      const ladTables = Object.values(this.ladTelemetryObjects);
      let showUnits = false;

      for (let ladTable of ladTables) {
        for (let telemetryObject of ladTable) {
          let metadata = this.openmct.telemetry.getMetadata(telemetryObject.domainObject);

          if (metadata) {
            for (let metadatum of metadata.valueMetadatas) {
              if (metadatum.unit) {
                showUnits = true;
              }
            }
          }
        }
      }

      return showUnits && !this.configuration?.hiddenColumns?.units;
    },
    showTimestamp() {
      return !this.configuration?.hiddenColumns?.timestamp;
    },
    showType() {
      return !this.configuration?.hiddenColumns?.type;
    },
    staleClass() {
      return this.isStale ? 'is-stale' : '';
    }
  },
  created() {
    this.compositions = [];
  },
  mounted() {
    this.ladTableConfiguration.on('change', this.handleConfigurationChange);
    this.composition = this.openmct.composition.get(this.domainObject);
    this.composition.on('add', this.addLadTable);
    this.composition.on('remove', this.removeLadTable);
    this.composition.on('reorder', this.reorderLadTables);
    this.composition.load();
    this.setupClockChangedEvent((domainObject) => {
      this.triggerUnsubscribeFromStaleness(domainObject);
      this.subscribeToStaleness(domainObject);
    });
  },
  unmounted() {
    this.ladTableConfiguration.off('change', this.handleConfigurationChange);
    this.composition.off('add', this.addLadTable);
    this.composition.off('remove', this.removeLadTable);
    this.composition.off('reorder', this.reorderLadTables);
    this.compositions.forEach((c) => {
      c.composition.off('add', c.addCallback);
      c.composition.off('remove', c.removeCallback);
    });
  },
  methods: {
    addLadTable(domainObject) {
      let ladTable = {};
      ladTable.domainObject = domainObject;
      ladTable.key = this.openmct.objects.makeKeyString(domainObject.identifier);
      ladTable.objectPath = [domainObject, ...this.objectPath];

      this.ladTelemetryObjects[ladTable.key] = [];
      this.ladTableObjects.push(ladTable);

      let composition = this.openmct.composition.get(ladTable.domainObject);
      let addCallback = this.addTelemetryObject(ladTable);
      let removeCallback = this.removeTelemetryObject(ladTable);

      composition.on('add', addCallback);
      composition.on('remove', removeCallback);
      composition.load();

      this.compositions.push({
        composition,
        addCallback,
        removeCallback
      });
    },
    combineKeys(ladKey, telemetryObjectKey) {
      return `${ladKey}-${telemetryObjectKey}`;
    },
    removeLadTable(identifier) {
      let index = this.ladTableObjects.findIndex(
        (ladTable) => this.openmct.objects.makeKeyString(identifier) === ladTable.key
      );
      let ladTable = this.ladTableObjects[index];

      ladTable?.domainObject?.composition.forEach((telemetryObject) => {
        const telemetryKey = this.openmct.objects.makeKeyString(telemetryObject);
        if (!this.subscribedObjects?.[telemetryKey]) {
          return;
        }
        let subscribedObject = toRaw(this.subscribedObjects[telemetryKey]);
        if (subscribedObject?.count > 1) {
          subscribedObject.count -= 1;
        } else if (subscribedObject?.count === 1) {
          this.triggerUnsubscribeFromStaleness(subscribedObject.domainObject);
          delete this.subscribedObjects[telemetryKey];
        }
      });

      delete this.ladTelemetryObjects[ladTable.key];
      this.ladTableObjects.splice(index, 1);
    },
    reorderLadTables(reorderPlan) {
      let oldComposition = this.ladTableObjects.slice();
      reorderPlan.forEach((reorderEvent) => {
        this.ladTableObjects[reorderEvent.newIndex] = oldComposition[reorderEvent.oldIndex];
      });
    },
    addTelemetryObject(ladTable) {
      return (domainObject) => {
        let telemetryObject = {};
        telemetryObject.key = this.openmct.objects.makeKeyString(domainObject.identifier);
        telemetryObject.domainObject = domainObject;

        const telemetryObjects = this.ladTelemetryObjects[ladTable.key];
        telemetryObjects.push(telemetryObject);

        this.ladTelemetryObjects[ladTable.key] = telemetryObjects;

        if (!this.subscribedObjects[telemetryObject?.key]) {
          this.subscribeToStaleness(domainObject);
          this.subscribedObjects[telemetryObject?.key] = { count: 1, domainObject };
        } else if (this.subscribedObjects?.[telemetryObject?.key]?.count) {
          this.subscribedObjects[telemetryObject?.key].count += 1;
        }
      };
    },
    removeTelemetryObject(ladTable) {
      return (identifier) => {
        const keystring = this.openmct.objects.makeKeyString(identifier);
        const telemetryObjects = this.ladTelemetryObjects[ladTable.key];
        let index = telemetryObjects.findIndex(
          (telemetryObject) => keystring === telemetryObject.key
        );

        telemetryObjects.splice(index, 1);
        this.ladTelemetryObjects[ladTable.key] = telemetryObjects;
      };
    },
    handleConfigurationChange(configuration) {
      this.configuration = configuration;
    },
    updateViewContext(rowContext) {
      this.viewContext.row = rowContext;
    },
    getViewContext() {
      return this.viewContext;
    }
  }
};
</script>
