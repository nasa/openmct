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
  <div class="c-notebook" :class="[{ 'c-notebook--restricted': isRestricted }]">
    <div class="c-notebook__head">
      <Search
        class="c-notebook__search"
        :value="search"
        @input="search = $event"
        @clear="resetSearch()"
      />
    </div>
    <SearchResults
      v-if="search.length"
      ref="searchResults"
      :domain-object="domainObject"
      :results="searchResults"
      @cancelEdit="cancelTransaction"
      @editingEntry="startTransaction"
      @changeSectionPage="changeSelectedSection"
      @updateEntries="updateEntries"
    />
    <div v-if="!search.length" class="c-notebook__body">
      <Sidebar
        ref="sidebar"
        class="c-notebook__nav c-sidebar c-drawer c-drawer--align-left"
        :class="sidebarClasses"
        :default-page-id="defaultPageId"
        :selected-page-id="getSelectedPageId()"
        :default-section-id="defaultSectionId"
        :selected-section-id="getSelectedSectionId()"
        :domain-object="domainObject"
        :page-title="domainObject.configuration.pageTitle"
        :section-title="domainObject.configuration.sectionTitle"
        :sections="sections"
        :sidebar-covers-entries="sidebarCoversEntries"
        @defaultPageDeleted="cleanupDefaultNotebook"
        @defaultSectionDeleted="cleanupDefaultNotebook"
        @pagesChanged="pagesChanged"
        @selectPage="selectPage"
        @sectionsChanged="sectionsChanged"
        @selectSection="selectSection"
        @toggleNav="toggleNav"
      />
      <div class="c-notebook__page-view">
        <div class="c-notebook__page-view__header">
          <button
            class="c-notebook__toggle-nav-button c-icon-button c-icon-button--major icon-menu-hamburger"
            @click="toggleNav"
          ></button>
          <div class="c-notebook__page-view__path c-path">
            <span class="c-notebook__path__section c-path__item">
              {{ selectedSection ? selectedSection.name : '' }}
            </span>
            <span class="c-notebook__path__page c-path__item">
              {{ selectedPage ? selectedPage.name : '' }}
            </span>
          </div>
          <div class="c-notebook__page-view__controls">
            <select v-model="showTime" class="c-notebook__controls__time">
              <option value="0" :selected="showTime === 0">Show all</option>
              <option value="1" :selected="showTime === 1">Last hour</option>
              <option value="8" :selected="showTime === 8">Last 8 hours</option>
              <option value="24" :selected="showTime === 24">Last 24 hours</option>
            </select>
            <select v-model="defaultSort" class="c-notebook__controls__time">
              <option value="newest" :selected="defaultSort === 'newest'">Newest first</option>
              <option value="oldest" :selected="defaultSort === 'oldest'">Oldest first</option>
            </select>
          </div>
        </div>
        <div
          v-if="selectedPage && !selectedPage.isLocked"
          :class="{ disabled: activeTransaction }"
          class="c-notebook__drag-area icon-plus"
          @click="newEntry(null, $event)"
          @dragover="dragOver"
          @drop.capture="dropCapture"
          @drop="dropOnEntry($event)"
        >
          <span class="c-notebook__drag-area__label">
            To start a new entry, click here or drag and drop any object
          </span>
        </div>
        <progress-bar
          v-if="savingTransaction"
          class="c-telemetry-table__progress-bar"
          :model="{ progressPerc: undefined }"
        />
        <div v-if="selectedPage && selectedPage.isLocked" class="c-notebook__page-locked">
          <div class="icon-lock"></div>
          <div class="c-notebook__page-locked__message">
            This page has been committed and cannot be modified or removed
          </div>
        </div>
        <div
          v-if="selectedSection && selectedPage"
          ref="notebookEntries"
          class="c-notebook__entries"
          aria-label="Notebook Entries"
        >
          <NotebookEntry
            v-for="entry in filteredAndSortedEntries"
            :key="entry.id"
            :entry="entry"
            :domain-object="domainObject"
            :notebook-annotations="notebookAnnotations[entry.id]"
            :selected-page="selectedPage"
            :selected-section="selectedSection"
            :read-only="false"
            :is-locked="selectedPage.isLocked"
            :selected-entry-id="selectedEntryId"
            @cancelEdit="cancelTransaction"
            @editingEntry="startTransaction"
            @deleteEntry="deleteEntry"
            @updateEntry="updateEntry"
            @entry-selection="entrySelection(entry)"
          />
        </div>
        <div v-if="showLockButton" class="c-notebook__commit-entries-control">
          <button
            class="c-button c-button--major commit-button icon-lock"
            title="Commit entries and lock this page from further changes"
            @click="lockPage()"
          >
            <span class="c-button__label">Commit Entries</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import NotebookEntry from './NotebookEntry.vue';
import Search from '@/ui/components/search.vue';
import SearchResults from './SearchResults.vue';
import Sidebar from './Sidebar.vue';
import ProgressBar from '../../../ui/components/ProgressBar.vue';
import {
  clearDefaultNotebook,
  getDefaultNotebook,
  setDefaultNotebook,
  setDefaultNotebookSectionId,
  setDefaultNotebookPageId
} from '../utils/notebook-storage';
import {
  addNotebookEntry,
  createNewEmbed,
  getEntryPosById,
  getNotebookEntries,
  mutateObject,
  selectEntry
} from '../utils/notebook-entries';
import {
  saveNotebookImageDomainObject,
  updateNamespaceOfDomainObject
} from '../utils/notebook-image';
import { isNotebookViewType, RESTRICTED_NOTEBOOK_TYPE } from '../notebook-constants';

import { debounce } from 'lodash';
import objectLink from '../../../ui/mixins/object-link';

function objectCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export default {
  components: {
    NotebookEntry,
    Search,
    SearchResults,
    Sidebar,
    ProgressBar
  },
  inject: ['agent', 'openmct', 'snapshotContainer'],
  props: {
    domainObject: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      defaultPageId: this.getDefaultPageId(),
      defaultSectionId: this.getDefaultSectionId(),
      selectedSectionId: this.getSelectedSectionId(),
      selectedPageId: this.getSelectedPageId(),
      defaultSort: this.domainObject.configuration.defaultSort,
      focusEntryId: null,
      isRestricted: this.domainObject.type === RESTRICTED_NOTEBOOK_TYPE,
      search: '',
      searchResults: [],
      lastLocalAnnotationCreation: 0,
      showTime: this.domainObject.configuration.showTime || 0,
      showNav: false,
      sidebarCoversEntries: false,
      filteredAndSortedEntries: [],
      notebookAnnotations: {},
      selectedEntryId: undefined,
      activeTransaction: false,
      savingTransaction: false
    };
  },
  computed: {
    pages() {
      return this.getPages() || [];
    },
    sections() {
      return this.getSections();
    },
    selectedPage() {
      const pages = this.getPages();
      if (!pages.length) {
        return undefined;
      }

      const selectedPage = pages.find((page) => page.id === this.selectedPageId);
      if (selectedPage) {
        return selectedPage;
      }

      const defaultPage = pages.find((page) => page.id === this.defaultPageId);
      if (defaultPage) {
        return defaultPage;
      }

      return this.pages[0];
    },
    selectedSection() {
      if (!this.sections.length) {
        return undefined;
      }

      const selectedSection = this.sections.find(
        (section) => section.id === this.selectedSectionId
      );
      if (selectedSection) {
        return selectedSection;
      }

      const defaultSection = this.sections.find((section) => section.id === this.defaultSectionId);
      if (defaultSection) {
        return defaultSection;
      }

      return this.sections[0];
    },
    sidebarClasses() {
      let sidebarClasses = [];
      if (this.showNav) {
        sidebarClasses.push('is-expanded');
      }

      if (this.sidebarCoversEntries) {
        sidebarClasses.push('c-drawer--overlays');
      } else {
        sidebarClasses.push('c-drawer--push');
      }

      return sidebarClasses;
    },
    showLockButton() {
      const entries = getNotebookEntries(
        this.domainObject,
        this.selectedSection,
        this.selectedPage
      );

      return entries && entries.length > 0 && this.isRestricted && !this.selectedPage.isLocked;
    }
  },
  watch: {
    search() {
      this.getSearchResults();
    },
    defaultSort() {
      mutateObject(this.openmct, this.domainObject, 'configuration.defaultSort', this.defaultSort);
      this.filterAndSortEntries();
    },
    showTime() {
      mutateObject(this.openmct, this.domainObject, 'configuration.showTime', this.showTime);
    }
  },
  beforeMount() {
    this.getSearchResults = debounce(this.getSearchResults, 500);
    this.syncUrlWithPageAndSection = debounce(this.syncUrlWithPageAndSection, 100);
  },
  async mounted() {
    await this.loadAnnotations();
    this.formatSidebar();
    this.setSectionAndPageFromUrl();

    this.openmct.selection.on('change', this.updateSelection);
    this.transaction = null;

    window.addEventListener('orientationchange', this.formatSidebar);
    window.addEventListener('hashchange', this.setSectionAndPageFromUrl);
    this.filterAndSortEntries();
    this.unobserveEntries = this.openmct.objects.observe(
      this.domainObject,
      '*',
      this.filterAndSortEntries
    );
  },
  beforeDestroy() {
    if (this.unlisten) {
      this.unlisten();
    }

    if (this.unobserveEntries) {
      this.unobserveEntries();
    }

    Object.keys(this.notebookAnnotations).forEach((entryID) => {
      const notebookAnnotationsForEntry = this.notebookAnnotations[entryID];
      notebookAnnotationsForEntry.forEach((notebookAnnotation) => {
        this.openmct.objects.destroyMutable(notebookAnnotation);
      });
    });

    window.removeEventListener('orientationchange', this.formatSidebar);
    window.removeEventListener('hashchange', this.setSectionAndPageFromUrl);
    this.openmct.selection.off('change', this.updateSelection);
  },
  updated: function () {
    this.$nextTick(() => {
      this.focusOnEntryId();
    });
  },
  methods: {
    changeSectionPage(newParams, oldParams, changedParams) {
      if (isNotebookViewType(newParams.view)) {
        return;
      }

      let pageId = newParams.pageId;
      let sectionId = newParams.sectionId;

      if (!pageId && !sectionId) {
        return;
      }

      this.sections.forEach((section) => {
        section.isSelected = Boolean(section.id === sectionId);

        if (section.isSelected) {
          section.pages.forEach((page) => {
            page.isSelected = Boolean(page.id === pageId);
          });
        }
      });
    },
    updateSelection(selection) {
      const keyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);

      if (selection?.[0]?.[0]?.context?.targetDetails?.[keyString]?.entryId === undefined) {
        this.selectedEntryId = undefined;
      }
    },
    async loadAnnotations() {
      if (!this.openmct.annotation.getAvailableTags().length) {
        // don't bother loading annotations if there are no tags
        return;
      }

      this.lastLocalAnnotationCreation = this.domainObject.annotationLastCreated ?? 0;

      const foundAnnotations = await this.openmct.annotation.getAnnotations(
        this.domainObject.identifier
      );
      foundAnnotations.forEach((foundAnnotation) => {
        const targetId = Object.keys(foundAnnotation.targets)[0];
        const entryId = foundAnnotation.targets[targetId].entryId;
        if (!this.notebookAnnotations[entryId]) {
          this.$set(this.notebookAnnotations, entryId, []);
        }

        const annotationExtant = this.notebookAnnotations[entryId].some((existingAnnotation) => {
          return this.openmct.objects.areIdsEqual(
            existingAnnotation.identifier,
            foundAnnotation.identifier
          );
        });
        if (!annotationExtant) {
          const annotationArray = this.notebookAnnotations[entryId];
          const mutableAnnotation = this.openmct.objects.toMutable(foundAnnotation);
          annotationArray.push(mutableAnnotation);
        }
      });
    },
    filterAndSortEntries() {
      const filterTime = Date.now();
      const pageEntries =
        getNotebookEntries(this.domainObject, this.selectedSection, this.selectedPage) || [];

      const hours = parseInt(this.showTime, 10);
      const filteredPageEntriesByTime = hours
        ? pageEntries.filter((entry) => filterTime - entry.createdOn <= hours * 60 * 60 * 1000)
        : pageEntries;

      this.filteredAndSortedEntries =
        this.defaultSort === 'oldest'
          ? filteredPageEntriesByTime
          : [...filteredPageEntriesByTime].reverse();

      if (this.lastLocalAnnotationCreation < this.domainObject.annotationLastCreated) {
        this.loadAnnotations();
      }
    },
    changeSelectedSection({ sectionId, pageId }) {
      const sections = this.sections.map((s) => {
        s.isSelected = false;

        if (s.id === sectionId) {
          s.isSelected = true;
        }

        s.pages.forEach((p, i) => {
          p.isSelected = false;

          if (pageId && pageId === p.id) {
            p.isSelected = true;
          }

          if (!pageId && i === 0) {
            p.isSelected = true;
          }
        });

        return s;
      });

      this.sectionsChanged({ sections });
      this.resetSearch();
    },
    cleanupDefaultNotebook() {
      this.defaultPageId = undefined;
      this.defaultSectionId = undefined;
      this.removeDefaultClass(this.domainObject.identifier);
      clearDefaultNotebook();
    },
    lockPage() {
      let prompt = this.openmct.overlays.dialog({
        iconClass: 'alert',
        message:
          'This action will lock this page and disallow any new entries, or editing of existing entries. Do you want to continue?',
        buttons: [
          {
            label: 'Lock Page',
            callback: () => {
              let sections = this.getSections();
              this.selectedPage.isLocked = true;

              // cant be default if it's locked
              if (this.selectedPage.id === this.defaultPageId) {
                this.cleanupDefaultNotebook();
              }

              if (!this.selectedSection.isLocked) {
                this.selectedSection.isLocked = true;
              }

              mutateObject(this.openmct, this.domainObject, 'configuration.sections', sections);

              if (!this.domainObject.locked) {
                mutateObject(this.openmct, this.domainObject, 'locked', true);
              }

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
    setSectionAndPageFromUrl() {
      let sectionId =
        this.getSectionIdFromUrl() || this.getDefaultSectionId() || this.getSelectedSectionId();
      let pageId = this.getPageIdFromUrl() || this.getDefaultPageId() || this.getSelectedPageId();

      this.selectSection(sectionId);
      this.selectPage(pageId);
    },
    createNotebookStorageObject() {
      const page = this.selectedPage;
      const section = this.selectedSection;

      return {
        name: this.domainObject.name,
        identifier: this.domainObject.identifier,
        link: this.getLinktoNotebook(),
        defaultSectionId: section.id,
        defaultPageId: page.id
      };
    },
    deleteEntry(entryId) {
      const entryPos = getEntryPosById(
        entryId,
        this.domainObject,
        this.selectedSection,
        this.selectedPage
      );
      if (entryPos === -1) {
        this.openmct.notifications.alert('Warning: unable to delete entry');
        console.error(
          `unable to delete entry ${entryId} from section ${this.selectedSection}, page ${this.selectedPage}`
        );

        this.cancelTransaction();

        return;
      }

      const dialog = this.openmct.overlays.dialog({
        iconClass: 'alert',
        message: 'This action will permanently delete this entry. Do you wish to continue?',
        buttons: [
          {
            label: 'Ok',
            emphasis: true,
            callback: () => {
              const entries = getNotebookEntries(
                this.domainObject,
                this.selectedSection,
                this.selectedPage
              );
              if (entries) {
                entries.splice(entryPos, 1);
                this.updateEntries(entries);
                this.filterAndSortEntries();
                this.removeAnnotations(entryId);
              } else {
                this.cancelTransaction();
              }

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
    removeAnnotations(entryId) {
      if (this.notebookAnnotations[entryId]) {
        this.openmct.annotation.deleteAnnotations(this.notebookAnnotations[entryId]);
      }
    },
    checkEntryPos(entry) {
      const entryPos = getEntryPosById(
        entry.id,
        this.domainObject,
        this.selectedSection,
        this.selectedPage
      );
      if (entryPos === -1) {
        this.openmct.notifications.alert('Warning: unable to tag entry');
        console.error(
          `unable to tag entry ${entry} from section ${this.selectedSection}, page ${this.selectedPage}`
        );

        return false;
      }

      return true;
    },
    dragOver(event) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    },
    dropCapture(event) {
      const isEditing = this.openmct.editor.isEditing();
      if (isEditing) {
        this.openmct.editor.cancel();
      }
    },
    async dropOnEntry(event) {
      event.preventDefault();
      event.stopImmediatePropagation();

      const snapshotId = event.dataTransfer.getData('openmct/snapshot/id');
      if (snapshotId.length) {
        const snapshot = this.snapshotContainer.getSnapshot(snapshotId);
        this.newEntry(snapshot.embedObject);
        this.snapshotContainer.removeSnapshot(snapshotId);

        const namespace = this.domainObject.identifier.namespace;
        const notebookImageDomainObject = updateNamespaceOfDomainObject(
          snapshot.notebookImageDomainObject,
          namespace
        );
        saveNotebookImageDomainObject(this.openmct, notebookImageDomainObject);

        return;
      }

      const data = event.dataTransfer.getData('openmct/domain-object-path');
      const objectPath = JSON.parse(data);
      const bounds = this.openmct.time.bounds();
      const snapshotMeta = {
        bounds,
        link: null,
        objectPath,
        openmct: this.openmct
      };
      const embed = await createNewEmbed(snapshotMeta);

      this.newEntry(embed);
    },
    focusOnEntryId() {
      if (!this.focusEntryId) {
        return;
      }

      const element = this.$refs.notebookEntries.querySelector(`#${this.focusEntryId}`);

      if (!element) {
        return;
      }

      element.focus();
      this.focusEntryId = null;
    },
    formatSidebar() {
      /*
                Determine if the sidebar should slide over content, or compress it
                Slide over checks:
                - phone (all orientations)
                - tablet portrait
                - in a layout frame (within .c-so-view)
            */
      const isPhone = this.agent.isPhone();
      const isTablet = this.agent.isTablet();
      const isPortrait = this.agent.isPortrait();
      const isInLayout = Boolean(this.$el.closest('.c-so-view'));
      const sidebarCoversEntries = isPhone || (isTablet && isPortrait) || isInLayout;
      this.sidebarCoversEntries = sidebarCoversEntries;
    },
    getDefaultPageId() {
      return this.isDefaultNotebook() ? getDefaultNotebook().defaultPageId : undefined;
    },
    isDefaultNotebook() {
      const defaultNotebook = getDefaultNotebook();
      const defaultNotebookIdentifier = defaultNotebook && defaultNotebook.identifier;

      return (
        defaultNotebookIdentifier !== null &&
        this.openmct.objects.areIdsEqual(defaultNotebookIdentifier, this.domainObject.identifier)
      );
    },
    getDefaultSectionId() {
      return this.isDefaultNotebook() ? getDefaultNotebook().defaultSectionId : undefined;
    },
    getLinktoNotebook() {
      const objectPath = this.openmct.router.path;
      const link = objectLink.computed.objectLink.call({
        objectPath,
        openmct: this.openmct
      });

      const selectedSection = this.selectedSection;
      const selectedPage = this.selectedPage;
      const sectionId = selectedSection ? selectedSection.id : '';
      const pageId = selectedPage ? selectedPage.id : '';

      return `${link}?sectionId=${sectionId}&pageId=${pageId}`;
    },
    getPage(section, id) {
      return section.pages.find((p) => p.id === id);
    },
    getSection(id) {
      return this.sections.find((s) => s.id === id);
    },
    getSections() {
      return this.domainObject.configuration.sections || [];
    },
    getSearchResults() {
      if (!this.search.length) {
        return [];
      }

      const output = [];
      const sections = this.domainObject.configuration.sections;
      const entries = this.domainObject.configuration.entries;
      const searchTextLower = this.search.toLowerCase();
      const originalSearchText = this.search;
      let sectionTrackPageHit;
      let pageTrackEntryHit;
      let sectionTrackEntryHit;

      sections.forEach((section) => {
        const pages = section.pages;
        let resultMetadata = {
          originalSearchText,
          sectionHit: section.name && section.name.toLowerCase().includes(searchTextLower)
        };
        sectionTrackPageHit = false;
        sectionTrackEntryHit = false;

        pages.forEach((page) => {
          resultMetadata.pageHit = page.name && page.name.toLowerCase().includes(searchTextLower);
          pageTrackEntryHit = false;

          if (resultMetadata.pageHit) {
            sectionTrackPageHit = true;
          }

          // check for no entries first
          if (entries[section.id] && entries[section.id][page.id]) {
            const pageEntries = entries[section.id][page.id];

            pageEntries.forEach((entry) => {
              const entryHit = entry.text && entry.text.toLowerCase().includes(searchTextLower);

              // any entry hit goes in, it's the most unique of the hits
              if (entryHit) {
                resultMetadata.entryHit = entryHit;
                pageTrackEntryHit = true;
                sectionTrackEntryHit = true;

                output.push(
                  objectCopy({
                    metadata: resultMetadata,
                    section,
                    page,
                    entry
                  })
                );
              }
            });
          }

          // all entries checked, now in pages,
          // if page hit, but not in results, need to add
          if (resultMetadata.pageHit && !pageTrackEntryHit) {
            resultMetadata.entryHit = false;

            output.push(
              objectCopy({
                metadata: resultMetadata,
                section,
                page
              })
            );
          }
        });

        // all pages checked, now in sections,
        // if section hit, but not in results, need to add and default page
        if (resultMetadata.sectionHit && !sectionTrackPageHit && !sectionTrackEntryHit) {
          resultMetadata.entryHit = false;
          resultMetadata.pageHit = false;

          output.push(
            objectCopy({
              metadata: resultMetadata,
              section,
              page: pages[0]
            })
          );
        }
      });

      this.searchResults = output;
    },
    getPages() {
      const selectedSection = this.selectedSection;
      if (!selectedSection || !selectedSection.pages.length) {
        return [];
      }

      return selectedSection.pages;
    },
    getSelectedPageId() {
      const page = this.selectedPage;
      if (!page) {
        return undefined;
      }

      return page.id;
    },
    getSelectedSectionId() {
      const section = this.selectedSection;
      if (!section) {
        return undefined;
      }

      return section.id;
    },
    async newEntry(embed, event) {
      this.startTransaction();
      this.resetSearch();
      const notebookStorage = this.createNotebookStorageObject();
      this.updateDefaultNotebook(notebookStorage);
      const id = await addNotebookEntry(this.openmct, this.domainObject, notebookStorage, embed);

      const element = this.$refs.notebookEntries.querySelector(`#${id}`);
      const entryAnnotations = this.notebookAnnotations[id] ?? {};
      selectEntry({
        element,
        entryId: id,
        domainObject: this.domainObject,
        openmct: this.openmct,
        notebookAnnotations: entryAnnotations
      });
      if (event) {
        event.stopPropagation();
      }

      this.filterAndSortEntries();
      this.focusEntryId = id;
      this.selectedEntryId = id;
    },
    orientationChange() {
      this.formatSidebar();
    },
    pagesChanged({ pages = [], id = null }) {
      const selectedSection = this.selectedSection;
      if (!selectedSection) {
        return;
      }

      selectedSection.pages = pages;
      const sections = this.sections.map((section) => {
        if (section.id === selectedSection.id) {
          section = selectedSection;
        }

        return section;
      });

      this.sectionsChanged({ sections });
    },
    removeDefaultClass(identifier) {
      this.openmct.status.delete(identifier);
    },
    resetSearch() {
      this.search = '';
      this.searchResults = [];
    },
    toggleNav() {
      this.showNav = !this.showNav;
    },
    updateDefaultNotebook(updatedNotebookStorageObject) {
      if (!this.isDefaultNotebook()) {
        const persistedNotebookStorageObject = getDefaultNotebook();
        if (
          persistedNotebookStorageObject &&
          persistedNotebookStorageObject.identifier !== undefined
        ) {
          this.removeDefaultClass(persistedNotebookStorageObject.identifier);
        }

        setDefaultNotebook(this.openmct, updatedNotebookStorageObject, this.domainObject);
      }

      if (this.defaultSectionId !== updatedNotebookStorageObject.defaultSectionId) {
        setDefaultNotebookSectionId(updatedNotebookStorageObject.defaultSectionId);
        this.defaultSectionId = updatedNotebookStorageObject.defaultSectionId;
      }

      if (this.defaultPageId !== updatedNotebookStorageObject.defaultPageId) {
        setDefaultNotebookPageId(updatedNotebookStorageObject.defaultPageId);
        this.defaultPageId = updatedNotebookStorageObject.defaultPageId;
      }
    },
    updateDefaultNotebookSection(sections, id) {
      if (!id) {
        return;
      }

      const notebookStorage = getDefaultNotebook();
      if (!notebookStorage || notebookStorage.identifier.key !== this.domainObject.identifier.key) {
        return;
      }

      const defaultNotebookSectionId = notebookStorage.defaultSectionId;
      if (defaultNotebookSectionId === id) {
        const section = sections.find((s) => s.id === id);
        if (!section) {
          this.removeDefaultClass(this.domainObject.identifier);
          clearDefaultNotebook();

          return;
        }
      }

      if (id !== defaultNotebookSectionId) {
        return;
      }

      setDefaultNotebookSectionId(defaultNotebookSectionId);
    },
    updateEntry(entry) {
      const entries = getNotebookEntries(
        this.domainObject,
        this.selectedSection,
        this.selectedPage
      );
      const entryPos = getEntryPosById(
        entry.id,
        this.domainObject,
        this.selectedSection,
        this.selectedPage
      );
      entries[entryPos] = entry;

      this.updateEntries(entries);
    },
    updateEntries(entries) {
      const configuration = this.domainObject.configuration;
      const notebookEntries = configuration.entries || {};
      notebookEntries[this.selectedSection.id][this.selectedPage.id] = entries;

      mutateObject(this.openmct, this.domainObject, 'configuration.entries', notebookEntries);

      this.saveTransaction();
    },
    getPageIdFromUrl() {
      return this.openmct.router.getParams().pageId;
    },
    getSectionIdFromUrl() {
      return this.openmct.router.getParams().sectionId;
    },
    syncUrlWithPageAndSection() {
      this.openmct.router.updateParams({
        pageId: this.selectedPageId,
        sectionId: this.selectedSectionId
      });
    },
    sectionsChanged({ sections, id = undefined }) {
      mutateObject(this.openmct, this.domainObject, 'configuration.sections', sections);
      this.updateDefaultNotebookSection(sections, id);
    },
    selectPage(pageId) {
      if (!pageId) {
        return;
      }

      this.selectedPageId = pageId;
      this.syncUrlWithPageAndSection();
      this.filterAndSortEntries();
    },
    selectSection(sectionId) {
      if (!sectionId) {
        return;
      }

      this.selectedSectionId = sectionId;

      const pageId = this.selectedSection.pages[0].id;
      this.selectPage(pageId);

      this.syncUrlWithPageAndSection();
      this.filterAndSortEntries();
    },
    startTransaction() {
      if (!this.openmct.objects.isTransactionActive()) {
        this.activeTransaction = true;
        this.transaction = this.openmct.objects.startTransaction();
      }
    },
    async saveTransaction() {
      if (this.transaction !== null) {
        this.savingTransaction = true;
        try {
          await this.transaction.commit();
        } finally {
          this.endTransaction();
        }
      }
    },
    async cancelTransaction() {
      if (this.transaction !== null) {
        try {
          await this.transaction.cancel();
        } finally {
          this.endTransaction();
        }
      }
    },
    entrySelection(entry) {
      this.selectedEntryId = entry.id;
    },
    endTransaction() {
      this.openmct.objects.endTransaction();
      this.transaction = null;
      this.savingTransaction = false;
      this.activeTransaction = false;
    }
  }
};
</script>
