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
  <div ref="createButton" class="c-create-button--w">
    <button
      class="c-create-button c-button--menu c-button--major icon-plus"
      :aria-disabled="isEditing"
      :aria-label="buttonLabel"
      @click.prevent.stop="showCreateMenu"
    >
      <span class="c-button__label">{{ buttonLabel }}</span>
    </button>
  </div>
</template>
<script>
import { CREATE_ACTION_KEY } from '@/plugins/formActions/CreateAction';
import { MY_ITEMS_KEY } from '@/plugins/myItems/createMyItemsIdentifier.js';

export default {
  props: {
    buttonLabel: {
      type: String,
      default: 'Create'
    },
    staticMenuItems: {
      type: Array,
      default: null
    },
    targetRootKey: {
      type: String,
      default: MY_ITEMS_KEY
    },
    targetNamespace: {
      type: String,
      default: null
    },
    createMenuGroup: {
      type: String,
      default: null
    }
  },
  inject: ['openmct'],
  data: function () {
    return {
      menuItems: {},
      isEditing: this.openmct.editor.isEditing(),
      selectedMenuItem: {},
      opened: false
    };
  },
  computed: {
    sortedItems() {
      let items = [...this.getItems()];

      return items.sort((a, b) => {
        if (a.name < b.name) {
          return -1;
        } else if (a.name > b.name) {
          return 1;
        } else {
          return 0;
        }
      });
    }
  },
  mounted() {
    this.openmct.editor.on('isEditing', this.toggleEdit);
  },
  unmounted() {
    this.openmct.editor.off('isEditing', this.toggleEdit);
  },
  methods: {
    getItems() {
      if (this.staticMenuItems !== null) {
        return this.staticMenuItems;
      }

      let keys = this.openmct.types.listKeys();

      keys.forEach((key) => {
        if (!this.menuItems[key]) {
          let typeDef = this.openmct.types.get(key).definition;

          const isInCreateMenuGroup =
            this.createMenuGroup === null || typeDef.createMenuGroup === this.createMenuGroup;

          if (typeDef.creatable && isInCreateMenuGroup) {
            this.menuItems[key] = {
              cssClass: typeDef.cssClass,
              name: typeDef.name,
              description: typeDef.description,
              onItemClicked: () => this.create(key)
            };
          }
        }
      });

      return Object.values(this.menuItems);
    },
    showCreateMenu() {
      const elementBoundingClientRect = this.$refs.createButton.getBoundingClientRect();
      const x = elementBoundingClientRect.x;
      const y = elementBoundingClientRect.y + elementBoundingClientRect.height;

      const menuOptions = {
        menuClass: 'c-create-menu'
      };

      this.openmct.menus.showSuperMenu(x, y, this.sortedItems, menuOptions);
    },
    toggleEdit(isEditing) {
      this.isEditing = isEditing;
    },
    async create(key) {
      const createAction = this.openmct.actions.getAction(CREATE_ACTION_KEY);
      let targetParent = this.openmct.router.path[0];

      if (this.targetNamespace !== null || this.targetRootKey !== MY_ITEMS_KEY) {
        targetParent = await this.openmct.objects.get({
          key: this.targetRootKey,
          namespace: this.targetNamespace
        });
      }

      createAction.invoke(key, targetParent);
    }
  }
};
</script>
