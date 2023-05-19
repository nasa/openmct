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
  <div ref="tabs" class="c-tabs-view">
    <div
      ref="tabsHolder"
      class="c-tabs-view__tabs-holder c-tabs"
      :class="{
        'is-dragging': isDragging && allowEditing,
        'is-mouse-over': allowDrop
      }"
    >
      <div class="c-drop-hint" @drop="onDrop" @dragenter="dragenter" @dragleave="dragleave"></div>
      <div v-if="!tabsList.length > 0" class="c-tabs-view__empty-message">
        Drag objects here to add them to this view.
      </div>
      <div
        v-for="(tab, index) in tabsList"
        :key="tab.keyString"
        class="c-tab c-tabs-view__tab js-tab"
        :class="{
          'is-current': isCurrent(tab)
        }"
        @click="showTab(tab, index)"
      >
        <div
          ref="tabsLabel"
          class="c-tabs-view__tab__label c-object-label"
          :class="[tab.status ? `is-status--${tab.status}` : '']"
        >
          <div class="c-object-label__type-icon" :class="tab.type.definition.cssClass">
            <span class="is-status__indicator" :title="`This item is ${tab.status}`"></span>
          </div>
          <span class="c-button__label c-object-label__name">{{ tab.domainObject.name }}</span>
        </div>
        <button
          v-if="isEditing"
          class="icon-x c-click-icon c-tabs-view__tab__close-btn"
          @click="showRemoveDialog(index)"
        ></button>
      </div>
    </div>
    <div
      v-for="tab in tabsList"
      :key="tab.keyString"
      :style="getTabStyles(tab)"
      class="c-tabs-view__object-holder"
      :class="{ 'c-tabs-view__object-holder--hidden': !isCurrent(tab) }"
    >
      <object-view
        v-if="shouldLoadTab(tab)"
        class="c-tabs-view__object"
        :default-object="tab.domainObject"
        :object-path="tab.objectPath"
      />
    </div>
  </div>
</template>

<script>
import ObjectView from '../../../ui/components/ObjectView.vue';
import RemoveAction from '../../remove/RemoveAction.js';
import _ from 'lodash';

const unknownObjectType = {
  definition: {
    cssClass: 'icon-object-unknown',
    name: 'Unknown Type'
  }
};

export default {
  components: {
    ObjectView
  },
  inject: ['openmct', 'domainObject', 'composition', 'objectPath'],
  props: {
    isEditing: {
      type: Boolean,
      required: true
    }
  },
  data: function () {
    let keyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);

    return {
      tabWidth: undefined,
      tabHeight: undefined,
      internalDomainObject: this.domainObject,
      currentTab: {},
      currentTabIndex: undefined,
      tabsList: [],
      setCurrentTab: false,
      isDragging: false,
      allowDrop: false,
      searchTabKey: `tabs.pos.${keyString}`,
      loadedTabs: {}
    };
  },
  computed: {
    allowEditing() {
      return !this.internalDomainObject.locked && this.isEditing;
    }
  },
  mounted() {
    if (this.composition) {
      this.composition.on('add', this.addItem);
      this.composition.on('remove', this.removeItem);
      this.composition.on('reorder', this.onReorder);

      this.composition.load().then((tabObjects) => {
        let currentTabIndexFromURL = this.openmct.router.getSearchParam(this.searchTabKey);
        let currentTabIndexFromDomainObject = this.internalDomainObject.currentTabIndex;

        if (currentTabIndexFromURL !== null) {
          this.setCurrentTabByIndex(currentTabIndexFromURL);
        } else if (currentTabIndexFromDomainObject !== undefined) {
          this.setCurrentTabByIndex(currentTabIndexFromDomainObject);
          this.storeCurrentTabIndexInURL(currentTabIndexFromDomainObject);
        } else if (tabObjects?.length) {
          this.setCurrentTabByIndex(0);
          this.storeCurrentTabIndexInURL(0);
        } else {
          this.setCurrentTab = true;
        }
      });
    }

    this.handleWindowResize = _.debounce(this.handleWindowResize, 500);
    this.tabsViewResizeObserver = new ResizeObserver(this.handleWindowResize);
    this.tabsViewResizeObserver.observe(this.$refs.tabs);

    this.unsubscribe = this.openmct.objects.observe(
      this.internalDomainObject,
      '*',
      this.updateInternalDomainObject
    );

    this.openmct.router.on('change:params', this.updateCurrentTab.bind(this));

    this.RemoveAction = new RemoveAction(this.openmct);
    document.addEventListener('dragstart', this.dragstart);
    document.addEventListener('dragend', this.dragend);
  },
  beforeDestroy() {
    this.persistCurrentTabIndex(this.currentTabIndex);
  },
  destroyed() {
    this.composition.off('add', this.addItem);
    this.composition.off('remove', this.removeItem);
    this.composition.off('reorder', this.onReorder);

    this.tabsViewResizeObserver.disconnect();

    this.tabsList.forEach((tab) => {
      tab.statusUnsubscribe();
    });

    this.unsubscribe();
    this.clearCurrentTabIndexFromURL();

    this.openmct.router.off('change:params', this.updateCurrentTab.bind(this));

    document.removeEventListener('dragstart', this.dragstart);
    document.removeEventListener('dragend', this.dragend);
  },
  methods: {
    addTabToLoaded(tab) {
      if (!this.internalDomainObject.keep_alive) {
        this.loadedTabs = {};
      }

      this.loadedTabs[tab.keyString] = true;
    },
    getTabStyles(tab) {
      let styles = {};

      if (!this.isCurrent(tab)) {
        styles = {
          height: this.tabHeight,
          width: this.tabWidth
        };
      }

      return styles;
    },
    setCurrentTabByIndex(index) {
      if (this.tabsList[index]) {
        this.showTab(this.tabsList[index]);
      }
    },
    showTab(tab, index) {
      if (!tab) {
        return;
      }

      if (index !== undefined) {
        this.storeCurrentTabIndexInURL(index);
      }

      this.currentTab = tab;
      this.setCurrentTab = false;
      this.addTabToLoaded(tab);
    },
    shouldLoadTab(tab) {
      const isLoaded = this.isTabLoaded(tab);
      const isCurrent = this.isCurrent(tab);
      const tabElLoaded = this.tabWidth !== undefined && this.tabHeight !== undefined;

      return (isLoaded && isCurrent) || (isLoaded && !isCurrent && tabElLoaded);
    },
    showRemoveDialog(index) {
      if (!this.tabsList[index]) {
        return;
      }

      let activeTab = this.tabsList[index];
      let childDomainObject = activeTab.domainObject;

      let prompt = this.openmct.overlays.dialog({
        iconClass: 'alert',
        message: `This action will remove this tab from the Tabs Layout. Do you want to continue?`,
        buttons: [
          {
            label: 'OK',
            emphasis: 'true',
            callback: () => {
              this.composition.remove(childDomainObject);
              prompt.dismiss();
            }
          },
          {
            label: 'Cancel',
            callback: () => {
              prompt.dismiss();
            }
          }
        ]
      });
    },
    addItem(domainObject) {
      let type = this.openmct.types.get(domainObject.type) || unknownObjectType;
      let keyString = this.openmct.objects.makeKeyString(domainObject.identifier);
      let status = this.openmct.status.get(domainObject.identifier);
      let statusUnsubscribe = this.openmct.status.observe(keyString, (updatedStatus) => {
        this.updateStatus(keyString, updatedStatus);
      });
      let objectPath = [domainObject].concat(this.objectPath.slice());
      let tabItem = {
        domainObject,
        status,
        statusUnsubscribe,
        objectPath,
        type,
        keyString
      };

      this.tabsList.push(tabItem);

      if (this.setCurrentTab) {
        this.showTab(tabItem);
      }
    },
    reset() {
      this.currentTab = {};
      this.currentTabIndex = undefined;
      this.setCurrentTab = true;
    },
    removeItem(identifier) {
      let keyStringToBeRemoved = this.openmct.objects.makeKeyString(identifier);

      let pos = this.tabsList.findIndex((tab) => {
        return tab.keyString === keyStringToBeRemoved;
      });

      let tabToBeRemoved = this.tabsList[pos];

      tabToBeRemoved.statusUnsubscribe();

      this.tabsList.splice(pos, 1);

      this.loadedTabs[keyStringToBeRemoved] = undefined;
      delete this.loadedTabs[keyStringToBeRemoved];

      if (this.isCurrent(tabToBeRemoved)) {
        this.showTab(this.tabsList[this.tabsList.length - 1], this.tabsList.length - 1);
      }

      if (!this.tabsList.length) {
        this.reset();
      }
    },
    onReorder(reorderPlan) {
      let oldTabs = this.tabsList.slice();

      reorderPlan.forEach((reorderEvent) => {
        this.$set(this.tabsList, reorderEvent.newIndex, oldTabs[reorderEvent.oldIndex]);
      });
    },
    onDrop(e) {
      this.storeCurrentTabIndexInURL(this.tabsList.length);
    },
    dragstart(e) {
      if (e.dataTransfer.types.includes('openmct/domain-object-path')) {
        this.isDragging = true;
      }
    },
    dragend(e) {
      this.isDragging = false;
      this.allowDrop = false;
    },
    dragenter() {
      this.allowDrop = true;
    },
    dragleave() {
      this.allowDrop = false;
    },
    isCurrent(tab) {
      return this.currentTab.keyString === tab.keyString;
    },
    updateInternalDomainObject(domainObject) {
      this.internalDomainObject = domainObject;
    },
    persistCurrentTabIndex(index) {
      this.openmct.objects.mutate(this.internalDomainObject, 'currentTabIndex', index);
    },
    storeCurrentTabIndexInURL(index) {
      let currentTabIndexInURL = this.openmct.router.getSearchParam(this.searchTabKey);

      if (index !== currentTabIndexInURL) {
        this.openmct.router.setSearchParam(this.searchTabKey, index);
        this.currentTabIndex = index;
      }
    },
    clearCurrentTabIndexFromURL() {
      this.openmct.router.deleteSearchParam(this.searchTabKey);
    },
    updateStatus(keyString, status) {
      let tabPos = this.tabsList.findIndex((tab) => {
        return tab.keyString === keyString;
      });
      let tab = this.tabsList[tabPos];

      this.$set(tab, 'status', status);
    },
    isTabLoaded(tab) {
      if (this.internalDomainObject.keep_alive) {
        return true;
      } else {
        return this.loadedTabs[tab.keyString];
      }
    },
    updateCurrentTab(newParams, oldParams, changedParams) {
      const tabIndex = changedParams[this.searchTabKey];
      if (!tabIndex) {
        return;
      }

      if (this.currentTabIndex === parseInt(tabIndex, 10)) {
        return;
      }

      this.currentTabIndex = tabIndex;
      this.showTab(this.tabsList[tabIndex]);
    },
    handleWindowResize() {
      if (!this.$refs.tabs || !this.$refs.tabsHolder) {
        return;
      }

      this.tabWidth = this.$refs.tabs.offsetWidth + 'px';
      this.tabHeight = this.$refs.tabsHolder.offsetHeight - this.$refs.tabs.offsetHeight + 'px';
    }
  }
};
</script>
