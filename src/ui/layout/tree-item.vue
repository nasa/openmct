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
  <div
    class="c-tree__item-h"
    role="treeitem"
    :style="treeItemStyles"
    :aria-expanded="
      !activeSearch && hasComposition ? (isOpen || isLoading ? 'true' : 'false') : undefined
    "
  >
    <div
      class="c-tree__item"
      :class="{
        'is-alias': isAlias,
        'is-navigated-object': shouldHighlight,
        'is-targeted-item': isTargetedItem,
        'is-context-clicked': contextClickActive,
        'is-new': isNewItem
      }"
      @animationend="targetedPathAnimationEnd($event)"
      @click.capture="itemClick"
      @contextmenu.capture="handleContextMenu"
    >
      <view-control
        ref="action"
        class="c-tree__item__view-control"
        :domain-object="node.object"
        :value="isOpen || isLoading"
        :enabled="!activeSearch && hasComposition"
        @input="itemAction()"
      />
      <object-label
        ref="objectLabel"
        :domain-object="node.object"
        :object-path="node.objectPath"
        :navigate-to-path="navigationPath"
        @context-click-active="setContextClickActive"
      />
      <span v-if="isLoading" class="loading"></span>
    </div>
  </div>
</template>

<script>
import ObjectLabel from '../components/ObjectLabel.vue';
import viewControl from '../components/viewControl.vue';

export default {
  name: 'TreeItem',
  components: {
    viewControl,
    ObjectLabel
  },
  inject: ['openmct'],
  props: {
    node: {
      type: Object,
      required: true
    },
    isSelectorTree: {
      type: Boolean,
      required: true
    },
    targetedPath: {
      type: String,
      default: null
    },
    selectedItem: {
      type: Object,
      required: true
    },
    activeSearch: {
      type: Boolean,
      default: false
    },
    leftOffset: {
      type: String,
      default: '0px'
    },
    isNew: {
      type: Boolean,
      default: false
    },
    itemIndex: {
      type: Number,
      required: false,
      default: undefined
    },
    itemOffset: {
      type: Number,
      required: false,
      default: undefined
    },
    itemHeight: {
      type: Number,
      required: false,
      default: 0
    },
    openItems: {
      type: Array,
      required: true
    },
    loadingItems: {
      type: Object,
      required: true
    }
  },
  data() {
    this.navigationPath = this.node.navigationPath;

    return {
      hasComposition: false,
      navigated: this.isNavigated(),
      contextClickActive: false
    };
  },
  computed: {
    isAlias() {
      let parent = this.node.objectPath[1];

      if (!parent) {
        return false;
      }

      let parentKeyString = this.openmct.objects.makeKeyString(parent.identifier);

      return parentKeyString !== this.node.object.location;
    },
    isSelectedItem() {
      return this.selectedItem.objectPath === this.node.objectPath;
    },
    isTargetedItem() {
      return this.targetedPath === this.navigationPath;
    },
    isNewItem() {
      return this.isNew;
    },
    isLoading() {
      return Boolean(this.loadingItems[this.navigationPath]);
    },
    isOpen() {
      return this.openItems.includes(this.navigationPath);
    },
    shouldHighlight() {
      if (this.isSelectorTree) {
        return this.isSelectedItem;
      } else {
        return this.navigated;
      }
    },
    treeItemStyles() {
      let itemTop = (this.itemOffset + this.itemIndex) * this.itemHeight + 'px';

      return {
        top: itemTop,
        position: 'absolute',
        'padding-left': this.leftOffset
      };
    }
  },
  mounted() {
    this.domainObject = this.node.object;

    if (this.openmct.composition.get(this.domainObject)) {
      this.hasComposition = true;
    }

    this.openmct.router.on('change:path', this.highlightIfNavigated);

    this.$emit('tree-item-mounted', this.navigationPath);
  },
  unmounted() {
    this.openmct.router.off('change:path', this.highlightIfNavigated);
  },
  methods: {
    targetedPathAnimationEnd($event) {
      $event.target.classList.remove('is-targeted-item');
      this.$emit('targeted-path-animation-end');
    },
    itemAction() {
      this.$emit('tree-item-action', this.isOpen || this.isLoading ? 'close' : 'open');
    },
    itemClick(event) {
      // skip for navigation, let viewControl handle click
      if (this.$refs.action.$el === event.target) {
        return;
      }

      event.stopPropagation();

      if (!this.isSelectorTree) {
        this.$refs.objectLabel.navigateOrPreview(event);
      } else {
        this.$emit('tree-item-selection', this.node);
      }
    },
    handleContextMenu(event) {
      event.stopPropagation();

      if (this.isSelectorTree) {
        return;
      }

      this.$refs.objectLabel.showContextMenu(event);
    },
    isNavigated() {
      return this.navigationPath === this.openmct.router.currentLocation.path;
    },
    highlightIfNavigated() {
      this.navigated = this.isNavigated();
    },
    setContextClickActive(active) {
      this.contextClickActive = active;
    }
  }
};
</script>
