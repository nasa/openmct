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
  <div class="l-browse-bar">
    <div class="l-browse-bar__start">
      <button
        v-if="hasParent"
        class="l-browse-bar__nav-to-parent-button c-icon-button c-icon-button--major icon-arrow-nav-to-parent"
        title="Navigate up to parent"
        @click="goToParent"
      ></button>
      <div class="l-browse-bar__object-name--w c-object-label" :class="[statusClass]">
        <div class="c-object-label__type-icon" :class="type.cssClass">
          <span class="is-status__indicator" :title="`This item is ${status}`"></span>
        </div>
        <span
          ref="objectName"
          class="l-browse-bar__object-name c-object-label__name"
          :class="{ 'c-input-inline': isPersistable }"
          :contenteditable="isPersistable"
          @blur="updateName"
          @keydown.enter.prevent
          @keyup.enter.prevent="updateNameOnEnterKeyPress"
          @mouseover.ctrl="showToolTip"
          @mouseleave="hideToolTip"
        >
          {{ domainObject.name }}
        </span>
      </div>
    </div>

    <div class="l-browse-bar__end">
      <div
        v-if="supportsIndependentTime"
        class="c-conductor-holder--compact l-shell__main-independent-time-conductor"
      >
        <independent-time-conductor
          :domain-object="domainObject"
          :object-path="openmct.router.path"
        />
      </div>
      <ViewSwitcher v-if="!isEditing" :current-view="currentView" :views="views" />
      <!-- Action buttons -->
      <NotebookMenuSwitcher
        v-if="notebookEnabled"
        :domain-object="domainObject"
        :object-path="openmct.router.path"
        class="c-notebook-snapshot-menubutton"
      />
      <div class="l-browse-bar__actions">
        <button
          v-for="(item, index) in statusBarItems"
          :key="index"
          class="c-button"
          :title="item.name"
          :class="item.cssClass"
          @click="item.onItemClicked"
        ></button>

        <button
          v-if="isViewEditable & !isEditing"
          :title="lockedOrUnlockedTitle"
          :class="{
            'c-button icon-lock': domainObject.locked,
            'c-icon-button icon-unlocked': !domainObject.locked
          }"
          @click="toggleLock(!domainObject.locked)"
        ></button>

        <button
          v-if="isViewEditable && !isEditing && !domainObject.locked"
          class="l-browse-bar__actions__edit c-button c-button--major icon-pencil"
          title="Edit"
          aria-label="Edit"
          @click="edit()"
        ></button>

        <div
          v-if="isEditing"
          class="l-browse-bar__view-switcher c-ctrl-wrapper c-ctrl-wrapper--menus-left"
        >
          <button
            class="c-button--menu c-button--major icon-save"
            title="Save"
            aria-label="Save"
            @click.stop="toggleSaveMenu"
          ></button>
          <div v-show="showSaveMenu" class="c-menu">
            <ul>
              <li class="icon-save" title="Save and Finish Editing" @click="saveAndFinishEditing">
                Save and Finish Editing
              </li>
              <li
                class="icon-save"
                title="Save and Continue Editing"
                @click="saveAndContinueEditing"
              >
                Save and Continue Editing
              </li>
            </ul>
          </div>
        </div>

        <button
          v-if="isEditing"
          class="l-browse-bar__actions c-button icon-x"
          title="Cancel Editing"
          @click="promptUserandCancelEditing()"
        ></button>
        <button
          class="l-browse-bar__actions c-icon-button icon-3-dots"
          title="More options"
          @click.prevent.stop="showMenuItems($event)"
        ></button>
      </div>
    </div>
  </div>
</template>

<script>
import { toRaw } from 'vue';

import NotebookMenuSwitcher from '@/plugins/notebook/components/NotebookMenuSwitcher.vue';
import IndependentTimeConductor from '@/plugins/timeConductor/independent/IndependentTimeConductor.vue';

import tooltipHelpers from '../../api/tooltips/tooltipMixins';
import ViewSwitcher from './ViewSwitcher.vue';

const SupportedViewTypes = [
  'plot-stacked',
  'plot-overlay',
  'bar-graph.view',
  'time-strip.view',
  'example.imagery'
];
const PLACEHOLDER_OBJECT = {};

export default {
  components: {
    IndependentTimeConductor,
    NotebookMenuSwitcher,
    ViewSwitcher
  },
  mixins: [tooltipHelpers],
  inject: ['openmct'],
  props: {
    actionCollection: {
      type: Object,
      default: () => {
        return undefined;
      }
    }
  },
  data: function () {
    return {
      notebookTypes: [],
      showViewMenu: false,
      showSaveMenu: false,
      domainObject: PLACEHOLDER_OBJECT,
      viewKey: undefined,
      isEditing: this.openmct.editor.isEditing(),
      notebookEnabled: this.openmct.types.get('notebook'),
      statusBarItems: [],
      status: ''
    };
  },
  computed: {
    statusClass() {
      return this.status ? `is-status--${this.status}` : '';
    },
    currentView() {
      return this.views.filter((v) => v.key === this.viewKey)[0] || {};
    },
    views() {
      if (this.domainObject && this.openmct.router.started !== true) {
        return [];
      }

      return this.openmct.objectViews.get(this.domainObject, this.openmct.router.path).map((p) => {
        return {
          key: p.key,
          cssClass: p.cssClass,
          name: p.name,
          onItemClicked: () => this.setView({ key: p.key })
        };
      });
    },
    hasParent() {
      return toRaw(this.domainObject) !== PLACEHOLDER_OBJECT && this.parentUrl !== '/browse';
    },
    parentUrl() {
      const objectKeyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);
      const hash = this.openmct.router.getCurrentLocation().path;

      return hash.slice(0, hash.lastIndexOf('/' + objectKeyString));
    },
    type() {
      const objectType = this.openmct.types.get(this.domainObject.type);
      if (!objectType) {
        return {};
      }

      return objectType.definition;
    },
    isPersistable() {
      let persistable =
        this.domainObject.identifier &&
        this.openmct.objects.isPersistable(this.domainObject.identifier);

      return persistable;
    },
    isViewEditable() {
      let currentViewKey = this.currentView.key;
      if (currentViewKey !== undefined) {
        let currentViewProvider = this.openmct.objectViews.getByProviderKey(currentViewKey);

        return (
          currentViewProvider.canEdit &&
          currentViewProvider.canEdit(this.domainObject, this.openmct.router.path)
        );
      }

      return false;
    },
    lockedOrUnlockedTitle() {
      if (this.domainObject.locked) {
        return 'Locked for editing - click to unlock.';
      } else {
        return 'Unlocked for editing - click to lock.';
      }
    },
    supportsIndependentTime() {
      const viewKey = this.getViewKey();

      return this.domainObject && SupportedViewTypes.includes(viewKey);
    }
  },
  watch: {
    domainObject() {
      if (this.removeStatusListener) {
        this.removeStatusListener();
      }

      this.status = this.openmct.status.get(this.domainObject.identifier, this.setStatus);
      this.removeStatusListener = this.openmct.status.observe(
        this.domainObject.identifier,
        this.setStatus
      );
    },
    actionCollection(actionCollection) {
      if (this.actionCollection) {
        this.unlistenToActionCollection();
      }

      this.actionCollection.on('update', this.updateActionItems);
      this.updateActionItems(this.actionCollection.getActionsObject());
    }
  },
  mounted: function () {
    document.addEventListener('click', this.closeViewAndSaveMenu);
    this.promptUserbeforeNavigatingAway = this.promptUserbeforeNavigatingAway.bind(this);
    window.addEventListener('beforeunload', this.promptUserbeforeNavigatingAway);

    this.openmct.editor.on('isEditing', (isEditing) => {
      this.isEditing = isEditing;
    });
  },
  beforeUnmount: function () {
    if (this.mutationObserver) {
      this.mutationObserver();
    }

    if (this.actionCollection) {
      this.unlistenToActionCollection();
    }

    if (this.removeStatusListener) {
      this.removeStatusListener();
    }

    document.removeEventListener('click', this.closeViewAndSaveMenu);
    window.removeEventListener('beforeunload', this.promptUserbeforeNavigatingAway);
  },
  methods: {
    toggleSaveMenu() {
      this.showSaveMenu = !this.showSaveMenu;
    },
    closeViewAndSaveMenu() {
      this.showViewMenu = false;
      this.showSaveMenu = false;
    },
    updateName(event) {
      if (event.target.innerText !== this.domainObject.name && event.target.innerText.match(/\S/)) {
        this.openmct.objects.mutate(this.domainObject, 'name', event.target.innerText);
      }
    },
    updateNameOnEnterKeyPress(event) {
      event.target.blur();
    },
    setView(view) {
      this.viewKey = view.key;
      this.openmct.router.updateParams({
        view: this.viewKey
      });
    },
    edit() {
      this.openmct.editor.edit();
    },
    getViewKey() {
      return this.viewKey;
    },
    promptUserandCancelEditing() {
      let dialog = this.openmct.overlays.dialog({
        iconClass: 'alert',
        message: 'Any unsaved changes will be lost. Are you sure you want to continue?',
        buttons: [
          {
            label: 'OK',
            emphasis: true,
            callback: () => {
              this.openmct.editor.cancel().then(() => {
                //refresh object view
                this.openmct.layout.$refs.browseObject.show(this.domainObject, this.viewKey, true);
              });
              dialog.dismiss();
            }
          },
          {
            label: 'Cancel',
            callback: () => {
              dialog.dismiss();
            }
          }
        ]
      });
    },
    promptUserbeforeNavigatingAway(event) {
      if (this.openmct.editor.isEditing()) {
        event.preventDefault();
        event.returnValue = '';
      }
    },
    saveAndFinishEditing() {
      let dialog = this.openmct.overlays.progressDialog({
        progressPerc: null,
        message:
          'Do not navigate away from this page or close this browser tab while this message is displayed.',
        iconClass: 'info',
        title: 'Saving'
      });

      return this.openmct.editor
        .save()
        .then(() => {
          dialog.dismiss();
          this.openmct.notifications.info('Save successful');
        })
        .catch((error) => {
          dialog.dismiss();
          this.openmct.notifications.error('Error saving objects');
          console.error(error);
          this.openmct.editor.cancel();
        });
    },
    saveAndContinueEditing() {
      this.saveAndFinishEditing().then(() => {
        this.openmct.editor.edit();
      });
    },
    goToParent() {
      this.openmct.router.navigate(this.parentUrl);
    },
    updateActionItems(actionItems) {
      const statusBarItems = this.actionCollection.getStatusBarActions();
      this.statusBarItems = this.openmct.menus.actionsToMenuItems(
        statusBarItems,
        this.actionCollection.objectPath,
        this.actionCollection.view
      );
      this.menuActionItems = this.actionCollection.getVisibleActions();
    },
    showMenuItems(event) {
      const sortedActions = this.openmct.actions._groupAndSortActions(this.menuActionItems);
      const menuItems = this.openmct.menus.actionsToMenuItems(
        sortedActions,
        this.actionCollection.objectPath,
        this.actionCollection.view
      );
      this.openmct.menus.showMenu(event.x, event.y, menuItems);
    },
    unlistenToActionCollection() {
      this.actionCollection.off('update', this.updateActionItems);
      delete this.actionCollection;
    },
    toggleLock(flag) {
      this.openmct.objects.mutate(this.domainObject, 'locked', flag);
    },
    setStatus(status) {
      this.status = status;
    },
    async showToolTip() {
      const { BELOW } = this.openmct.tooltips.TOOLTIP_LOCATIONS;
      this.buildToolTip(await this.getObjectPath(), BELOW, 'objectName');
    }
  }
};
</script>
