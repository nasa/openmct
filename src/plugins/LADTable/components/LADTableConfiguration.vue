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
  <div class="c-inspect-properties">
    <template v-if="isEditing">
      <div class="c-inspect-properties__header">Table Column Visibility</div>
      <ul class="c-inspect-properties__section">
        <li v-for="(title, key) in headers" :key="key" class="c-inspect-properties__row">
          <div class="c-inspect-properties__label" title="Show or hide column">
            <label :for="key + 'ColumnControl'">{{ title }}</label>
          </div>
          <div class="c-inspect-properties__value">
            <input
              :id="key + 'ColumnControl'"
              type="checkbox"
              :checked="configuration.hiddenColumns[key] !== true"
              @change="toggleColumn(key)"
            />
          </div>
        </li>
      </ul>
    </template>
    <template v-else>
      <div class="c-inspect-properties__header">LAD Table Configuration</div>
      <div class="c-inspect-properties__row--span-all">Only available in edit mode.</div>
    </template>
  </div>
</template>

<script>
import LADTableConfiguration from '../LADTableConfiguration';

export default {
  inject: ['openmct'],
  data() {
    const selection = this.openmct.selection.get();
    const domainObject = selection[0][0].context.item;
    const ladTableConfiguration = new LADTableConfiguration(domainObject, this.openmct);

    return {
      headers: {
        timestamp: 'Timestamp',
        units: 'Units',
        type: 'Type'
      },
      ladTableConfiguration,
      isEditing: this.openmct.editor.isEditing(),
      configuration: ladTableConfiguration.getConfiguration(),
      items: [],
      ladTableObjects: [],
      ladTelemetryObjects: {}
    };
  },
  mounted() {
    this.openmct.editor.on('isEditing', this.toggleEdit);
    this.composition = this.openmct.composition.get(this.ladTableConfiguration.domainObject);
    this.shouldShowUnitsCheckbox();

    if (this.ladTableConfiguration.domainObject.type === 'LadTable') {
      this.composition.on('add', this.addItem);
      this.composition.on('remove', this.removeItem);
    } else {
      this.compositions = [];
      this.composition.on('add', this.addLadTable);
      this.composition.on('remove', this.removeLadTable);
    }

    this.composition.load();
  },
  unmounted() {
    this.ladTableConfiguration.destroy();
    this.openmct.editor.off('isEditing', this.toggleEdit);

    if (this.ladTableConfiguration.domainObject.type === 'LadTable') {
      this.composition.off('add', this.addItem);
      this.composition.off('remove', this.removeItem);
    } else {
      this.composition.off('add', this.addLadTable);
      this.composition.off('remove', this.removeLadTable);
      this.compositions.forEach((c) => {
        c.composition.off('add', c.addCallback);
        c.composition.off('remove', c.removeCallback);
      });
    }
  },
  methods: {
    addItem(domainObject) {
      const item = {};
      item.domainObject = domainObject;
      item.key = this.openmct.objects.makeKeyString(domainObject.identifier);

      this.items.push(item);

      this.shouldShowUnitsCheckbox();
    },
    removeItem(identifier) {
      const keystring = this.openmct.objects.makeKeyString(identifier);
      const index = this.items.findIndex((item) => keystring === item.key);

      this.items.splice(index, 1);

      this.shouldShowUnitsCheckbox();
    },
    addLadTable(domainObject) {
      let ladTable = {};
      ladTable.domainObject = domainObject;
      ladTable.key = this.openmct.objects.makeKeyString(domainObject.identifier);

      this.ladTelemetryObjects[ladTable.key] = [];
      this.ladTableObjects.push(ladTable);

      const composition = this.openmct.composition.get(ladTable.domainObject);
      const addCallback = this.addTelemetryObject(ladTable);
      const removeCallback = this.removeTelemetryObject(ladTable);

      composition.on('add', addCallback);
      composition.on('remove', removeCallback);
      composition.load();

      this.compositions.push({
        composition,
        addCallback,
        removeCallback
      });

      this.shouldShowUnitsCheckbox();
    },
    removeLadTable(identifier) {
      const index = this.ladTableObjects.findIndex(
        (ladTable) => this.openmct.objects.makeKeyString(identifier) === ladTable.key
      );
      const ladTable = this.ladTableObjects[index];

      this.$delete(this.ladTelemetryObjects, ladTable.key);
      this.ladTableObjects.splice(index, 1);

      this.shouldShowUnitsCheckbox();
    },
    addTelemetryObject(ladTable) {
      return (domainObject) => {
        const telemetryObject = {};
        telemetryObject.key = this.openmct.objects.makeKeyString(domainObject.identifier);
        telemetryObject.domainObject = domainObject;

        const telemetryObjects = this.ladTelemetryObjects[ladTable.key];
        telemetryObjects.push(telemetryObject);

        this.ladTelemetryObjects[ladTable.key] = telemetryObjects;

        this.shouldShowUnitsCheckbox();
      };
    },
    removeTelemetryObject(ladTable) {
      return (identifier) => {
        const keystring = this.openmct.objects.makeKeyString(identifier);
        const telemetryObjects = this.ladTelemetryObjects[ladTable.key];
        const index = telemetryObjects.findIndex(
          (telemetryObject) => keystring === telemetryObject.key
        );

        telemetryObjects.splice(index, 1);
        this.ladTelemetryObjects[ladTable.key] = telemetryObjects;

        this.shouldShowUnitsCheckbox();
      };
    },
    combineKeys(ladKey, telemetryObjectKey) {
      return `${ladKey}-${telemetryObjectKey}`;
    },
    toggleColumn(key) {
      const isHidden = this.configuration.hiddenColumns[key] === true;

      this.configuration.hiddenColumns[key] = !isHidden;
      this.ladTableConfiguration.updateConfiguration(this.configuration);
    },
    toggleEdit(isEditing) {
      this.isEditing = isEditing;
    },
    shouldShowUnitsCheckbox() {
      let showUnitsCheckbox = false;

      if (this.ladTableConfiguration?.domainObject) {
        if (this.ladTableConfiguration.domainObject.type === 'LadTable') {
          const itemsWithUnits = this.items.filter((item) => {
            return this.metadataHasUnits(item.domainObject);
          });

          showUnitsCheckbox = itemsWithUnits.length !== 0;
        } else {
          const ladTables = Object.values(this.ladTelemetryObjects);

          for (const ladTable of ladTables) {
            for (const telemetryObject of ladTable) {
              if (this.metadataHasUnits(telemetryObject.domainObject)) {
                showUnitsCheckbox = true;
              }
            }
          }
        }
      }

      if (showUnitsCheckbox && this.headers.units === undefined) {
        this.headers.units = 'Units';
      }

      if (!showUnitsCheckbox && this.headers?.units) {
        this.$delete(this.headers, 'units');
      }
    },
    metadataHasUnits(domainObject) {
      const metadata = this.openmct.telemetry.getMetadata(domainObject);
      const valueMetadatas = metadata ? metadata.valueMetadatas : [];
      const metadataWithUnits = valueMetadatas.filter((metadatum) => metadatum.unit);

      return metadataWithUnits.length > 0;
    }
  }
};
</script>
