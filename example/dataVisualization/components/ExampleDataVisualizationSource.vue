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
  <div class="c-table c-list-view c-list-view--selectable">
    <table class="c-table__body">
      <thead class="c-table__header">
        <tr>
          <th>Name</th>
          <th>Type</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in items"
          :key="item.keyString"
          class="c-list-item js-folder-child"
          @click="selectItem(item, $event)"
        >
          <td class="c-list-item__name">
            <a ref="objectLink" class="c-object-label">
              <div
                class="c-object-label__type-icon c-list-item__name__type-icon"
                :class="item.type.cssClass"
              ></div>
              <div class="c-object-label__name c-list-item__name__name">{{ item.model.name }}</div>
            </a>
          </td>
          <td class="c-list-item__type">
            {{ item.type.name }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
const ONE_HOUR = 60 * 60 * 1000;
export default {
  inject: ['openmct', 'domainObject'],
  data() {
    return {
      items: []
    };
  },
  mounted() {
    this.composition = this.openmct.composition.get(this.domainObject);
    this.keystring = this.openmct.objects.makeKeyString(this.domainObject.identifier);
    this.composition.on('add', this.addedTelemetry);
    this.composition.on('remove', this.removedTelemetry);
    this.composition.load();
  },
  unmounted() {
    this.composition.off('add', this.addedTelemetry);
    this.composition.off('remove', this.removedTelemetry);
  },
  methods: {
    selectItem(item, event) {
      event.stopPropagation();
      const bounds = this.openmct.time.getBounds();
      const otherBounds = {
        start: bounds.start - ONE_HOUR,
        end: bounds.end + ONE_HOUR
      };
      const selection = [
        {
          element: this.$el,
          context: {
            dataVisualization: {
              telemetryKeys: [item.objectKeyString],
              description: {
                text: item.model.name,
                icon: item.type.cssClass
              },
              dataRanges: [
                {
                  bounds: otherBounds
                },
                {
                  bounds
                }
              ],
              loading: false
            },
            item: this.domainObject
          }
        }
      ];
      this.openmct.selection.select(selection, false);
    },
    addedTelemetry(child) {
      const type = this.openmct.types.get(child.type) || {
        definition: {
          cssClass: 'icon-object-unknown',
          name: 'Unknown Type'
        }
      };
      this.items.push({
        model: child,
        type: type.definition,
        isAlias: this.keystring !== child.location,
        objectPath: [child].concat(this.openmct.router.path),
        objectKeyString: this.openmct.objects.makeKeyString(child.identifier)
      });
    },
    removedTelemetry(identifier) {
      this.items = this.items.filter((i) => {
        return (
          i.model.identifier.key !== identifier.key ||
          i.model.identifier.namespace !== identifier.namespace
        );
      });
    }
  }
};
</script>
