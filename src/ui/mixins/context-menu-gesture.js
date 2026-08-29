/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2024, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
import { toRaw } from 'vue';

export default {
  inject: ['openmct'],
  props: {
    objectPath: {
      type: Array,
      default() {
        return [];
      }
    }
  },
  data() {
    return {
      contextClickActive: false
    };
  },
  mounted() {
    this.unobserveObjects = {};
    //TODO: touch support
    this.$nextTick(() => {
      this.$refs.root.addEventListener('contextmenu', this.showContextMenu);
    });

    function updateObject(oldObject, newObject) {
      const rawNewObject = toRaw(newObject);
      const rawOldObject = toRaw(oldObject);
      Object.assign(rawOldObject, rawNewObject);
    }

    this.objectPath.forEach((object) => {
      if (object) {
        const key = this.openmct.objects.makeKeyString(object.identifier);
        this.unobserveObjects[key] = this.openmct.objects.observe(
          object,
          '*',
          updateObject.bind(this, object)
        );
      }
    });
  },
  beforeUnmount() {
    this.removeListeners();
    this.$refs.root.removeEventListener('contextMenu', this.showContextMenu);
  },
  methods: {
    removeListeners() {
      Object.values(this.unobserveObjects).forEach((unobserve) => unobserve());
      this.unobserveObjects = {};
    },
    showContextMenu(event) {
      if (this.readOnly) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      let actionsCollection = this.openmct.actions.getActionsCollection(toRaw(this.objectPath));
      let actions = actionsCollection.getVisibleActions();
      let sortedActions = this.openmct.actions._groupAndSortActions(actions);

      const menuOptions = {
        onDestroy: this.onContextMenuDestroyed,
        label: this.objectPath[0].name
      };

      const menuItems = this.openmct.menus.actionsToMenuItems(
        sortedActions,
        actionsCollection.objectPath,
        actionsCollection.view
      );
      this.openmct.menus.showMenu(event.clientX, event.clientY, menuItems, menuOptions);
      this.contextClickActive = true;
      this.$emit('context-click-active', true);
    },
    onContextMenuDestroyed() {
      this.contextClickActive = false;
      this.$emit('context-click-active', false);
    }
  }
};
