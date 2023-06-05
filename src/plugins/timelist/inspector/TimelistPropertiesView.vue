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
  <div class="c-timelist-properties">
    <div class="c-inspect-properties">
      <ul class="c-inspect-properties__section">
        <div class="c-inspect-properties_header" title="'Timeframe options'">Timeframe</div>
        <li class="c-inspect-properties__row">
          <div v-if="canEdit" class="c-inspect-properties__hint span-all">
            These settings don't affect the view while editing, but will be applied after editing is
            finished.
          </div>
          <div class="c-inspect-properties__label" title="Sort order of the timelist.">
            Sort Order
          </div>
          <div v-if="canEdit" class="c-inspect-properties__value">
            <select v-model="sortOrderIndex" @change="updateSortOrder()">
              <option
                v-for="(sortOrderOption, index) in sortOrderOptions"
                :key="index"
                :value="index"
              >
                {{ sortOrderOption.label }}
              </option>
            </select>
          </div>
          <div v-else class="c-inspect-properties__value">
            {{ sortOrderOptions[sortOrderIndex].label }}
          </div>
        </li>
        <event-properties
          v-for="type in eventTypes"
          :key="type.prefix"
          :label="type.label"
          :prefix="type.prefix"
          @updated="eventPropertiesUpdated"
        />
      </ul>
    </div>
    <div class="c-inspect-properties">
      <ul class="c-inspect-properties__section">
        <div class="c-inspect-properties_header" title="'Filters'">Filtering</div>
        <filtering @updated="eventPropertiesUpdated" />
      </ul>
    </div>
  </div>
</template>

<script>
import EventProperties from './EventProperties.vue';
import { SORT_ORDER_OPTIONS } from '../constants';
import Filtering from './Filtering.vue';

const EVENT_TYPES = [
  {
    label: 'Future Events',
    prefix: 'futureEvents'
  },
  {
    label: 'Current Events',
    prefix: 'currentEvents'
  },
  {
    label: 'Past Events',
    prefix: 'pastEvents'
  }
];

export default {
  components: {
    Filtering,
    EventProperties
  },
  inject: ['openmct', 'domainObject'],
  data() {
    return {
      sortOrderIndex: this.domainObject.configuration.sortOrderIndex,
      sortOrderOptions: SORT_ORDER_OPTIONS,
      eventTypes: EVENT_TYPES,
      isEditing: this.openmct.editor.isEditing()
    };
  },
  computed: {
    canEdit() {
      return this.isEditing && !this.domainObject.locked;
    }
  },
  mounted() {
    this.openmct.editor.on('isEditing', this.setEditState);
  },
  beforeDestroy() {
    this.openmct.editor.off('isEditing', this.setEditState);
  },
  methods: {
    setEditState(isEditing) {
      this.isEditing = isEditing;
    },
    updateSortOrder() {
      this.updateProperty('sortOrderIndex', this.sortOrderIndex);
    },
    updateProperty(key, value) {
      this.openmct.objects.mutate(this.domainObject, `configuration.${key}`, value);
    },
    eventPropertiesUpdated(data) {
      const key = data.property;
      const value = data.value;
      this.updateProperty(key, value);
    }
  }
};
</script>
