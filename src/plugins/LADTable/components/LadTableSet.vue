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
            :is-stale="staleObjects.includes(combineKeys(ladTable.key, ladRow.key))"
            :configuration="configuration"
            @rowContextClick="updateViewContext"
          />
        </template>
      </tbody>
    </table>
  </div>
</template>

<script>
import LadRow from './LADRow.vue';
import StalenessUtils from '@/utils/staleness';

export default {
  components: {
    LadRow
  },
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
      compositions: [],
      viewContext: {},
      staleObjects: [],
      configuration: this.ladTableConfiguration.getConfiguration()
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
      if (this.staleObjects.length !== 0) {
        return 'is-stale';
      }

      return '';
    }
  },
  mounted() {
    this.ladTableConfiguration.on('change', this.handleConfigurationChange);
    this.composition = this.openmct.composition.get(this.domainObject);
    this.composition.on('add', this.addLadTable);
    this.composition.on('remove', this.removeLadTable);
    this.composition.on('reorder', this.reorderLadTables);
    this.composition.load();

    this.stalenessSubscription = {};
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

    Object.values(this.stalenessSubscription).forEach((stalenessSubscription) => {
      stalenessSubscription.unsubscribe();
      stalenessSubscription.stalenessUtils.destroy();
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

      this.ladTelemetryObjects[ladTable.key].forEach((telemetryObject) => {
        let combinedKey = this.combineKeys(ladTable.key, telemetryObject.key);
        this.unwatchStaleness(combinedKey);
      });

      this.$delete(this.ladTelemetryObjects, ladTable.key);
      this.ladTableObjects.splice(index, 1);
    },
    reorderLadTables(reorderPlan) {
      let oldComposition = this.ladTableObjects.slice();
      reorderPlan.forEach((reorderEvent) => {
        this.$set(
          this.ladTableObjects,
          reorderEvent.newIndex,
          oldComposition[reorderEvent.oldIndex]
        );
      });
    },
    addTelemetryObject(ladTable) {
      return (domainObject) => {
        let telemetryObject = {};
        telemetryObject.key = this.openmct.objects.makeKeyString(domainObject.identifier);
        telemetryObject.domainObject = domainObject;
        const combinedKey = this.combineKeys(ladTable.key, telemetryObject.key);

        const telemetryObjects = this.ladTelemetryObjects[ladTable.key];
        telemetryObjects.push(telemetryObject);

        this.ladTelemetryObjects[ladTable.key] = telemetryObjects;

        this.stalenessSubscription[combinedKey] = {};
        this.stalenessSubscription[combinedKey].stalenessUtils = new StalenessUtils(
          this.openmct,
          domainObject
        );

        this.openmct.telemetry.isStale(domainObject).then((stalenessResponse) => {
          if (stalenessResponse !== undefined) {
            this.handleStaleness(combinedKey, stalenessResponse);
          }
        });
        const stalenessSubscription = this.openmct.telemetry.subscribeToStaleness(
          domainObject,
          (stalenessResponse) => {
            this.handleStaleness(combinedKey, stalenessResponse);
          }
        );

        this.stalenessSubscription[combinedKey].unsubscribe = stalenessSubscription;
      };
    },
    removeTelemetryObject(ladTable) {
      return (identifier) => {
        const keystring = this.openmct.objects.makeKeyString(identifier);
        const telemetryObjects = this.ladTelemetryObjects[ladTable.key];
        const combinedKey = this.combineKeys(ladTable.key, keystring);
        let index = telemetryObjects.findIndex(
          (telemetryObject) => keystring === telemetryObject.key
        );

        this.unwatchStaleness(combinedKey);

        telemetryObjects.splice(index, 1);
        this.ladTelemetryObjects[ladTable.key] = telemetryObjects;
      };
    },
    unwatchStaleness(combinedKey) {
      const SKIP_CHECK = true;

      this.stalenessSubscription[combinedKey].unsubscribe();
      this.stalenessSubscription[combinedKey].stalenessUtils.destroy();
      this.handleStaleness(combinedKey, { isStale: false }, SKIP_CHECK);

      delete this.stalenessSubscription[combinedKey];
    },
    handleConfigurationChange(configuration) {
      this.configuration = configuration;
    },
    handleStaleness(combinedKey, stalenessResponse, skipCheck = false) {
      if (
        skipCheck ||
        this.stalenessSubscription[combinedKey].stalenessUtils.shouldUpdateStaleness(
          stalenessResponse
        )
      ) {
        const index = this.staleObjects.indexOf(combinedKey);
        const foundStaleObject = index > -1;
        if (stalenessResponse.isStale && !foundStaleObject) {
          this.staleObjects.push(combinedKey);
        } else if (!stalenessResponse.isStale && foundStaleObject) {
          this.staleObjects.splice(index, 1);
        }
      }
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
