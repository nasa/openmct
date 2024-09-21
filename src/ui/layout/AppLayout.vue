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
  <div
    class="l-shell"
    :class="{
      'is-editing': isEditing
    }"
  >
    <div id="splash-screen"></div>

    <div
      class="l-shell__head"
      :class="{
        'l-shell__head--expanded': headExpanded,
        'l-shell__head--minify-indicators': !headExpanded,
        'l-shell__head--indicators-single-line': !indicatorsMultiline,
        '--indicators-overflowing': indicatorsOverflowing
      }"
    >
      <CreateButton class="l-shell__create-button" />
      <GrandSearch ref="grand-search" />
      <StatusIndicators
        ref="indicatorsComponent"
        :head-expanded="headExpanded"
        :indicators-multiline="indicatorsMultiline"
        @indicators-overflowing="indicatorsOverflowUpdate"
      />
      <button
        class="l-shell__head__button"
        :class="[indicatorsMultilineCssClass, indicatorsOverflowingCssClass]"
        :aria-label="`Display as ${indicatorsMultiline ? 'single line' : 'multiple lines'}`"
        :title="`Display as ${indicatorsMultiline ? 'single line' : 'multiple lines'}`"
        @click="toggleIndicatorsMultiline"
      ></button>
      <button
        class="l-shell__head__button"
        :class="headExpanded ? 'icon-items-collapse' : 'icon-items-expand'"
        :aria-label="`Show ${headExpanded ? 'icon only' : 'icon and name'}`"
        :title="`Show ${headExpanded ? 'icon only' : 'icon and name'}`"
        @click="toggleShellHead"
      ></button>
      <NotificationBanner />
      <div class="l-shell__head-section l-shell__controls">
        <button
          class="c-icon-button c-icon-button--major icon-new-window"
          title="Open in a new browser tab"
          target="_blank"
          @click="openInNewTab"
        ></button>
        <button
          :class="[
            'c-icon-button c-icon-button--major',
            fullScreen ? 'icon-fullscreen-collapse' : 'icon-fullscreen-expand'
          ]"
          :aria-label="`${fullScreen ? 'Exit' : 'Enable'} full screen mode`"
          :title="`${fullScreen ? 'Exit' : 'Enable'} full screen mode`"
          @click="fullScreenToggle"
        ></button>
      </div>
      <AppLogo />
    </div>

    <div class="l-shell__drawer c-drawer c-drawer--push c-drawer--align-top"></div>

    <Multipane class="l-shell__main" :class="[resizingClass]" type="horizontal">
      <Pane
        class="l-shell__pane-tree"
        handle="after"
        label="Browse"
        hide-param="hideTree"
        :persist-position="true"
        @start-resizing="onStartResizing"
        @end-resizing="onEndResizing"
      >
        <template #controls>
          <button
            class="c-icon-button l-shell__reset-tree-button icon-folders-collapse"
            aria-label="Collapse all tree items"
            title="Collapse all tree items"
            @click="handleTreeReset"
          ></button>
          <button
            class="c-icon-button l-shell__sync-tree-button icon-target"
            aria-label="Show selected item in tree"
            title="Show selected item in tree"
            @click="handleSyncTreeNavigation"
          ></button>
        </template>
        <Multipane type="vertical">
          <Pane>
            <MctTree
              ref="mctTree"
              :sync-tree-navigation="triggerSync"
              :reset-tree-navigation="triggerReset"
              class="l-shell__tree"
            />
          </Pane>
          <Pane
            handle="before"
            label="Recently Viewed"
            :persist-position="true"
            collapse-type="horizontal"
            hide-param="hideRecents"
          >
            <RecentObjectsList
              ref="recentObjectsList"
              class="l-shell__tree"
              @open-and-scroll-to="openAndScrollTo($event)"
              @set-clear-button-disabled="setClearButtonDisabled"
            />
            <template #controls>
              <button
                class="c-icon-button icon-clear-data"
                aria-label="Clear Recently Viewed"
                title="Clear Recently Viewed"
                :disabled="disableClearButton"
                @click="handleClearRecentObjects"
              ></button>
            </template>
          </Pane>
        </Multipane>
      </Pane>
      <Pane class="l-shell__pane-main" role="main">
        <BrowseBar
          ref="browseBar"
          class="l-shell__main-view-browse-bar"
          :action-collection="actionCollection"
          @sync-tree-navigation="handleSyncTreeNavigation"
        />
        <Toolbar v-if="toolbar" class="l-shell__toolbar" />
        <ObjectView
          ref="browseObject"
          class="l-shell__main-container js-main-container js-notebook-snapshot-item"
          data-selectable
          :show-edit-view="true"
          @change-action-collection="setActionCollection"
        />
        <component
          :is="conductorComponent"
          class="l-shell__time-conductor"
          aria-label="Global Time Conductor"
        />
      </Pane>
      <Pane
        class="l-shell__pane-inspector l-pane--holds-multipane"
        handle="before"
        label="Inspect"
        hide-param="hideInspector"
        :persist-position="true"
        @start-resizing="onStartResizing"
        @end-resizing="onEndResizing"
      >
        <Inspector ref="inspector" :is-editing="isEditing" />
      </Pane>
    </Multipane>
  </div>
</template>

<script>
import ObjectView from '../components/ObjectView.vue';
import Inspector from '../inspector/InspectorPanel.vue';
import Toolbar from '../toolbar/ToolbarContainer.vue';
import AppLogo from './AppLogo.vue';
import BrowseBar from './BrowseBar.vue';
import CreateButton from './CreateButton.vue';
import MctTree from './MctTree.vue';
import Multipane from './MultipaneContainer.vue';
import Pane from './PaneContainer.vue';
import RecentObjectsList from './RecentObjectsList.vue';
import GrandSearch from './search/GrandSearch.vue';
import NotificationBanner from './status-bar/NotificationBanner.vue';
import StatusIndicators from './status-bar/StatusIndicators.vue';
import { useObserveOverflow } from './useOverflowToggle.js';
const SHELL_HEAD_LOCAL_STORAGE_KEY = 'openmct-shell-head';
import { onMounted, ref } from 'vue';

export default {
  components: {
    Inspector,
    MctTree,
    ObjectView,
    CreateButton,
    GrandSearch,
    Multipane,
    Pane,
    BrowseBar,
    Toolbar,
    AppLogo,
    StatusIndicators,
    NotificationBanner,
    RecentObjectsList
  },
  inject: ['openmct'],
  setup() {
    const indicatorsComponent = ref(null);

    const { isOverflowing, observeOverflow, unObserveOverflow } = useObserveOverflow(undefined, indicatorsComponent, 'indicatorsContainer');

    return {
      indicatorsComponent,
      isOverflowing,
      observeOverflow,
      unObserveOverflow
    };
  },
  data() {
    const DEFAULT_HEAD_EXPANDED = true;
    const DEFAULT_INDICATORS_MULTILINE = true;

    const storedHeadProps = localStorage.getItem(SHELL_HEAD_LOCAL_STORAGE_KEY);
    const storedHeadPropsObject = JSON.parse(storedHeadProps);
    const storedHeadExpanded = storedHeadPropsObject?.expanded;
    const storedIndicatorsMultiline = storedHeadPropsObject?.multiline;

    const headExpanded = storedHeadExpanded ?? DEFAULT_HEAD_EXPANDED;
    const indicatorsMultiline = storedIndicatorsMultiline ?? DEFAULT_INDICATORS_MULTILINE;

    const initialHeadProps = JSON.stringify({
      expanded: headExpanded,
      multiline: indicatorsMultiline
    });
    if (initialHeadProps !== storedHeadProps) {
      localStorage.setItem(SHELL_HEAD_LOCAL_STORAGE_KEY, initialHeadProps);
    }

    return {
      fullScreen: false,
      conductorComponent: undefined,
      isEditing: false,
      hasToolbar: false,
      actionCollection: undefined,
      triggerSync: false,
      triggerReset: false,
      headExpanded,
      indicatorsMultiline,
      indicatorsOverflowing: false,
      isResizing: false,
      disableClearButton: false
    };
  },
  computed: {
    toolbar() {
      return this.hasToolbar && this.isEditing;
    },
    resizingClass() {
      return this.isResizing ? 'l-shell__resizing' : '';
    },
    indicatorsMultilineCssClass() {
      return this.indicatorsMultiline ? 'icon-singleline' : 'icon-multiline';
    },
    indicatorsOverflowingCssClass() {
      return this.indicatorsOverflowing ? 'c-button c-button--major' : 'c-icon-button';
    }
  },
  watch: {
    isOverflowing() {
      console.log(this.isOverflowing);
    }
  },
  mounted() {
    this.observeOverflow();
    this.openmct.editor.on('isEditing', (isEditing) => {
      this.isEditing = isEditing;
    });

    this.openmct.selection.on('change', this.toggleHasToolbar);
  },
  methods: {
    enterFullScreen() {
      let docElm = document.documentElement;

      if (docElm.requestFullscreen) {
        docElm.requestFullscreen();
      } else if (docElm.mozRequestFullScreen) {
        /* Firefox */
        docElm.mozRequestFullScreen();
      } else if (docElm.webkitRequestFullscreen) {
        /* Chrome, Safari and Opera */
        docElm.webkitRequestFullscreen();
      } else if (docElm.msRequestFullscreen) {
        /* IE/Edge */
        docElm.msRequestFullscreen();
      }
    },
    exitFullScreen() {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitCancelFullScreen) {
        document.webkitCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    },
    toggleShellHead() {
      this.headExpanded = !this.headExpanded;
      this.setLocalStorageShellHead();
    },
    toggleIndicatorsMultiline() {
      this.indicatorsMultiline = !this.indicatorsMultiline;
      this.setLocalStorageShellHead();
    },
    setLocalStorageShellHead() {
      localStorage.setItem(
        SHELL_HEAD_LOCAL_STORAGE_KEY,
        JSON.stringify({
          expanded: this.headExpanded,
          multiline: this.indicatorsMultiline
        })
      );
    },
    fullScreenToggle() {
      if (this.fullScreen) {
        this.fullScreen = false;
        this.exitFullScreen();
      } else {
        this.fullScreen = true;
        this.enterFullScreen();
      }
    },
    openInNewTab(event) {
      window.open(window.location.href);
    },
    toggleHasToolbar(selection) {
      let structure = undefined;

      if (!selection || !selection[0]) {
        structure = [];
      } else {
        structure = this.openmct.toolbars.get(selection);
      }

      this.hasToolbar = structure.length > 0;
    },
    openAndScrollTo(navigationPath) {
      this.$refs.mctTree.openAndScrollTo(navigationPath);
      this.$refs.mctTree.targetedPath = navigationPath;
    },
    setActionCollection(actionCollection) {
      this.actionCollection = actionCollection;
    },
    handleSyncTreeNavigation() {
      this.triggerSync = !this.triggerSync;
    },
    handleTreeReset() {
      this.triggerReset = !this.triggerReset;
    },
    handleClearRecentObjects() {
      this.$refs.recentObjectsList.clearRecentObjects();
    },
    onStartResizing() {
      this.isResizing = true;
    },
    onEndResizing() {
      this.isResizing = false;
    },
    setClearButtonDisabled(isDisabled) {
      this.disableClearButton = isDisabled;
    },
    indicatorsOverflowUpdate(isOverflowing) {
      this.indicatorsOverflowing = isOverflowing;
    }
  }
};
</script>
