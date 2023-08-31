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
  <div class="c-inspector__header">
    <div v-if="!multiSelect" class="c-inspector__selected c-object-label" :class="[statusClass]">
      <div class="c-object-label__type-icon" :class="typeCssClass">
        <span class="is-status__indicator" :title="`This item is ${status}`"></span>
      </div>
      <span v-if="!singleSelectNonObject" class="c-inspector__selected c-object-label__name">{{
        item.name
      }}</span>
      <div
        v-if="singleSelectNonObject"
        class="c-inspector__selected c-inspector__selected--non-domain-object c-object-label"
      >
        <span class="c-object-label__name">{{ heading }}</span>
      </div>
    </div>
    <div v-if="multiSelect" class="c-inspector__multiple-selected">
      {{ itemsSelected }} items selected
    </div>
  </div>
</template>

<script>
export default {
  inject: ['openmct'],
  data() {
    return {
      domainObject: {},
      activity: undefined,
      layoutItem: undefined,
      keyString: undefined,
      multiSelect: false,
      itemsSelected: 0,
      status: undefined
    };
  },
  computed: {
    item() {
      return this.domainObject || {};
    },
    heading() {
      if (this.activity) {
        return this.activity.name;
      }

      return 'Layout Item';
    },
    type() {
      return this.openmct.types.get(this.item.type);
    },
    typeCssClass() {
      if (this.activity) {
        return 'icon-activity';
      }

      if (!this.domainObject && this.layoutItem) {
        const layoutItemType = this.openmct.types.get(this.layoutItem.type);

        return layoutItemType.definition.cssClass;
      }

      if (this.type.definition.cssClass === undefined) {
        return 'icon-object';
      }

      return this.type.definition.cssClass;
    },
    singleSelectNonObject() {
      return !this.item.identifier && !this.multiSelect;
    },
    statusClass() {
      return this.status ? `is-status--${this.status}` : '';
    }
  },
  mounted() {
    this.openmct.selection.on('change', this.updateSelection);
    this.updateSelection(this.openmct.selection.get());
  },
  beforeUnmount() {
    this.openmct.selection.off('change', this.updateSelection);

    if (this.statusUnsubscribe) {
      this.statusUnsubscribe();
    }
    if (this.nameUnsubscribe) {
      this.nameUnsubscribe();
    }
  },
  methods: {
    updateSelection(selection) {
      if (this.statusUnsubscribe) {
        this.statusUnsubscribe();
        this.statusUnsubscribe = null;
      }
      if (this.nameUnsubscribe) {
        this.nameUnsubscribe();
        this.nameUnsubscribe = null;
      }

      if (selection.length === 0 || selection[0].length === 0) {
        this.resetDomainObject();

        return;
      }

      if (selection.length > 1) {
        this.multiSelect = true;
        this.itemsSelected = selection.length;
        this.resetDomainObject();

        return;
      } else {
        this.multiSelect = false;
        this.domainObject = selection[0][0].context.item;
        this.activity = selection[0][0].context.activity;
        if (this.domainObject) {
          this.keyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);
          this.status = this.openmct.status.get(this.keyString);
          this.statusUnsubscribe = this.openmct.status.observe(this.keyString, this.updateStatus);
          this.nameUnsubscribe = this.openmct.objects.observe(
            this.domainObject,
            'name',
            this.updateName
          );
        } else if (selection[0][0].context.layoutItem) {
          this.layoutItem = selection[0][0].context.layoutItem;
        }
      }
    },
    resetDomainObject() {
      this.domainObject = {};
      this.status = undefined;
      this.keyString = undefined;
    },
    updateStatus(status) {
      this.status = status;
    },
    updateName(newName) {
      this.domainObject = { ...this.domainObject, name: newName };
    }
  }
};
</script>
