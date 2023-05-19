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
  <div>
    <div class="c-inspector__properties c-inspect-properties">
      <div class="c-inspect-properties__header">Details</div>
      <ul v-if="hasDetails" class="c-inspect-properties__section">
        <Component
          :is="getComponent(detail)"
          v-for="detail in details"
          :key="detail.name"
          :detail="detail"
        />
      </ul>
      <div v-else class="c-inspect-properties__row--span-all">
        {{ noDetailsMessage }}
      </div>
    </div>

    <Location
      v-if="hasLocation"
      :domain-object="domainObject"
      :parent-domain-object="parentDomainObject"
    />
  </div>
</template>

<script>
import Moment from 'moment';
import DetailText from './DetailText.vue';
import Location from './Location.vue';

export default {
  components: {
    DetailText,
    Location
  },
  inject: ['openmct'],
  data() {
    return {
      selection: undefined
    };
  },
  computed: {
    details() {
      return this.customDetails ?? this.domainObjectDetails;
    },
    customDetails() {
      return this.context?.details;
    },
    domainObject() {
      return this.context?.item;
    },
    parentDomainObject() {
      return this.selection?.[0]?.[1]?.context?.item;
    },
    type() {
      if (this.domainObject === undefined) {
        return;
      }

      return this.openmct.types.get(this.domainObject.type);
    },
    domainObjectDetails() {
      if (this.domainObject === undefined) {
        return;
      }

      const UNKNOWN_USER = 'Unknown';
      const title = this.domainObject.name;
      const typeName = this.type ? this.type.definition.name : `Unknown: ${this.domainObject.type}`;
      const createdTimestamp = this.domainObject.created;
      const createdBy = this.domainObject.createdBy ? this.domainObject.createdBy : UNKNOWN_USER;
      const modifiedBy = this.domainObject.modifiedBy ? this.domainObject.modifiedBy : UNKNOWN_USER;
      const modifiedTimestamp = this.domainObject.modified
        ? this.domainObject.modified
        : this.domainObject.created;
      const notes = this.domainObject.notes;
      const version = this.domainObject.version;

      const details = [
        {
          name: 'Title',
          value: title
        },
        {
          name: 'Type',
          value: typeName
        },
        {
          name: 'Created By',
          value: createdBy
        },
        {
          name: 'Modified By',
          value: modifiedBy
        }
      ];

      if (notes) {
        details.push({
          name: 'Notes',
          value: notes
        });
      }

      if (createdTimestamp !== undefined) {
        const formattedCreatedTimestamp =
          Moment.utc(createdTimestamp).format('YYYY-MM-DD[\n]HH:mm:ss') + ' UTC';

        details.push({
          name: 'Created',
          value: formattedCreatedTimestamp
        });
      }

      if (modifiedTimestamp !== undefined) {
        const formattedModifiedTimestamp =
          Moment.utc(modifiedTimestamp).format('YYYY-MM-DD[\n]HH:mm:ss') + ' UTC';

        details.push({
          name: 'Modified',
          value: formattedModifiedTimestamp
        });
      }

      if (version) {
        details.push({
          name: 'Version',
          value: version
        });
      }

      return [...details, ...this.typeProperties];
    },
    context() {
      return this.selection?.[0]?.[0]?.context;
    },
    hasDetails() {
      return Boolean(this.details?.length && !this.multiSelection);
    },
    multiSelection() {
      return this.selection && this.selection.length > 1;
    },
    noDetailsMessage() {
      return this.multiSelection
        ? 'No properties to display for multiple items'
        : 'No properties to display for this item';
    },
    typeProperties() {
      if (!this.type) {
        return [];
      }

      let definition = this.type.definition;
      if (!definition.form || definition.form.length === 0) {
        return [];
      }

      return definition.form
        .filter((field) => !field.hideFromInspector)
        .map((field) => {
          let path = field.property;
          if (typeof path === 'string') {
            path = [path];
          }

          if (field.control === 'file-input') {
            path = [...path, 'name'];
          }

          return {
            name: field.name,
            path
          };
        })
        .filter((field) => Array.isArray(field.path))
        .map((field) => {
          return {
            name: field.name,
            value: field.path.reduce((object, key) => {
              if (object === undefined) {
                return object;
              }

              return object[key];
            }, this.domainObject)
          };
        });
    },
    hasLocation() {
      const domainObject = this.selection?.[0]?.[0]?.context?.item;
      const isRootObject = domainObject?.location === 'ROOT';
      const hasSingleSelection = this.selection?.length === 1;

      return hasSingleSelection && !isRootObject;
    }
  },
  mounted() {
    this.openmct.selection.on('change', this.updateSelection);
    this.updateSelection(this.openmct.selection.get());
  },
  beforeDestroy() {
    this.openmct.selection.off('change', this.updateSelection);
  },
  methods: {
    getComponent(detail) {
      const component = detail.component ? detail.component : 'text';

      return `detail-${component}`;
    },
    updateSelection(selection) {
      this.selection = selection;
    }
  }
};
</script>
