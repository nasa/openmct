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
  <div ref="createButton" class="c-create-button--w">
    <button
      class="c-create-button c-button--menu c-button--major icon-plus"
      @click.prevent.stop="showCreateMenu"
    >
      <span class="c-button__label">Create</span>
    </button>
  </div>
</template>

<script>
import CreateAction from '@/plugins/formActions/CreateAction';

export default {
  inject: ['openmct'],
  data: function () {
    return {
      menuItems: {},
      selectedMenuItem: {},
      opened: false
    };
  },
  computed: {
    sortedItems() {
      let items = this.getItems();

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
  methods: {
    getItems() {
      let keys = this.openmct.types.listKeys();

      keys.forEach((key) => {
        if (!this.menuItems[key]) {
          let typeDef = this.openmct.types.get(key).definition;

          if (typeDef.creatable) {
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
    create(key) {
      const createAction = new CreateAction(this.openmct, key, this.openmct.router.path[0]);

      createAction.invoke();
    }
  }
};
</script>
