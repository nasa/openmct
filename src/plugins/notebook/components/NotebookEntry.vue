<!-- eslint-disable vue/no-v-html -->
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
    class="c-notebook__entry c-ne has-local-controls"
    aria-label="Notebook Entry"
    :class="{ locked: isLocked, 'is-selected': isSelectedEntry, 'is-editing': editMode }"
    @dragover="changeCursor"
    @drop.capture="cancelEditMode"
    @drop.prevent="dropOnEntry"
    @click="selectAndEmitEntry($event, entry)"
  >
    <div class="c-ne__time-and-content">
      <div class="c-ne__time-and-creator-and-delete">
        <div class="c-ne__time-and-creator">
          <span class="c-ne__created-date">{{ createdOnDate }}</span>
          <span class="c-ne__created-time">{{ createdOnTime }}</span>
          <span v-if="entry.createdBy" class="c-ne__creator">
            <span class="icon-person"></span>
            {{
              entry.createdByRole ? `${entry.createdBy}: ${entry.createdByRole}` : entry.createdBy
            }}
          </span>
        </div>
        <span v-if="!readOnly && !isLocked" class="c-ne__local-controls--hidden">
          <button
            class="c-ne__remove c-icon-button c-icon-button--major icon-trash"
            title="Delete this entry"
            tabindex="-1"
            @click.stop.prevent="deleteEntry"
          ></button>
        </span>
      </div>
      <div class="c-ne__content">
        <template v-if="readOnly && result">
          <div :id="entry.id" class="c-ne__text highlight" tabindex="0">
            <TextHighlight
              :text="formatValidUrls(entry.text)"
              :highlight="highlightText"
              :highlight-class="'search-highlight'"
            />
          </div>
        </template>
        <template v-else-if="!isLocked">
          <div
            v-bind.prop="formattedText"
            :id="entry.id"
            class="c-ne__text c-ne__input"
            aria-label="Notebook Entry Input"
            tabindex="-1"
            :contenteditable="canEdit"
            @mouseover="checkEditability($event)"
            @mouseleave="canEdit = true"
            @mousedown="preventFocusIfNotSelected($event)"
            @focus="editingEntry()"
            @blur="updateEntryValue($event)"
          ></div>
          <div v-if="editMode" class="c-ne__save-button">
            <button class="c-button c-button--major icon-check"></button>
          </div>
        </template>

        <template v-else>
          <div
            v-bind.prop="formattedText"
            :id="entry.id"
            class="c-ne__text"
            contenteditable="false"
            tabindex="0"
          ></div>
        </template>

        <div class="c-ne__tags c-tag-holder">
          <div
            v-for="(tag, index) in entryTags"
            :key="index"
            class="c-tag"
            :style="{ backgroundColor: tag.backgroundColor, color: tag.foregroundColor }"
          >
            {{ tag.label }}
          </div>
        </div>

        <div :class="{ 'c-scrollcontainer': enableEmbedsWrapperScroll }">
          <div ref="embedsWrapper" class="c-snapshots c-ne__embeds-wrapper">
            <NotebookEmbed
              v-for="embed in entry.embeds"
              ref="embeds"
              :key="embed.id"
              :embed="embed"
              :is-locked="isLocked"
              @removeEmbed="removeEmbed"
              @updateEmbed="updateEmbed"
            />
          </div>
        </div>
      </div>
    </div>
    <div v-if="readOnly" class="c-ne__section-and-page">
      <a
        class="c-click-link"
        :class="{ 'search-highlight': result.metadata.sectionHit }"
        @click="navigateToSection()"
      >
        {{ result.section.name }}
      </a>
      <span class="icon-arrow-right"></span>
      <a
        class="c-click-link"
        :class="{ 'search-highlight': result.metadata.pageHit }"
        @click="navigateToPage()"
      >
        {{ result.page.name }}
      </a>
    </div>
  </div>
</template>

<script>
import _ from 'lodash';
import Moment from 'moment';
import sanitizeHtml from 'sanitize-html';

import TextHighlight from '../../../utils/textHighlight/TextHighlight.vue';
import { createNewEmbed, selectEntry } from '../utils/notebook-entries';
import {
  saveNotebookImageDomainObject,
  updateNamespaceOfDomainObject
} from '../utils/notebook-image';
import NotebookEmbed from './NotebookEmbed.vue';

const SANITIZATION_SCHEMA = {
  allowedTags: [],
  allowedAttributes: {}
};
const URL_REGEX =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/g;
const UNKNOWN_USER = 'Unknown';

export default {
  components: {
    NotebookEmbed,
    TextHighlight
  },
  inject: ['openmct', 'snapshotContainer', 'entryUrlWhitelist'],
  props: {
    domainObject: {
      type: Object,
      default() {
        return {};
      }
    },
    notebookAnnotations: {
      type: Array,
      default() {
        return [];
      }
    },
    entry: {
      type: Object,
      default() {
        return {};
      }
    },
    result: {
      type: Object,
      default() {
        return {};
      }
    },
    selectedPage: {
      type: Object,
      default() {
        return {};
      }
    },
    selectedSection: {
      type: Object,
      default() {
        return {};
      }
    },
    readOnly: {
      type: Boolean,
      default() {
        return true;
      }
    },
    isLocked: {
      type: Boolean,
      default() {
        return false;
      }
    },
    selectedEntryId: {
      type: String,
      default() {
        return '';
      }
    }
  },
  data() {
    return {
      editMode: false,
      canEdit: true,
      enableEmbedsWrapperScroll: false,
      urlWhitelist: []
    };
  },
  computed: {
    createdOnDate() {
      return this.formatTime(this.entry.createdOn, 'YYYY-MM-DD');
    },
    createdOnTime() {
      return this.formatTime(this.entry.createdOn, 'HH:mm:ss');
    },
    formattedText() {
      // remove ANY tags
      const text = sanitizeHtml(this.entry.text, SANITIZATION_SCHEMA);

      if (this.editMode || this.urlWhitelist.length === 0) {
        return { innerText: text };
      }

      const html = this.formatValidUrls(text);

      return { innerHTML: html };
    },
    isSelectedEntry() {
      return this.selectedEntryId === this.entry.id;
    },
    entryTags() {
      const tagsFromAnnotations = this.openmct.annotation.getTagsFromAnnotations(
        this.notebookAnnotations
      );

      return tagsFromAnnotations;
    },
    entryText() {
      let text = this.entry.text;

      if (!this.result.metadata.entryHit) {
        text = `[ no result for '${this.result.metadata.originalSearchText}' in entry ]`;
      }

      return text;
    },
    highlightText() {
      let text = '';

      if (this.result.metadata.entryHit) {
        text = this.result.metadata.originalSearchText;
      }

      return text;
    }
  },
  mounted() {
    this.manageEmbedLayout = _.debounce(this.manageEmbedLayout, 400);

    if (this.$refs.embedsWrapper) {
      this.embedsWrapperResizeObserver = new ResizeObserver(this.manageEmbedLayout);
      this.embedsWrapperResizeObserver.observe(this.$refs.embedsWrapper);
    }

    this.manageEmbedLayout();
    this.dropOnEntry = this.dropOnEntry.bind(this);
    if (this.entryUrlWhitelist?.length > 0) {
      this.urlWhitelist = this.entryUrlWhitelist;
    }
  },
  beforeUnmount() {
    if (this.embedsWrapperResizeObserver) {
      this.embedsWrapperResizeObserver.unobserve(this.$refs.embedsWrapper);
    }
  },
  methods: {
    async addNewEmbed(objectPath) {
      const bounds = this.openmct.time.bounds();
      const snapshotMeta = {
        bounds,
        link: null,
        objectPath,
        openmct: this.openmct
      };
      const newEmbed = await createNewEmbed(snapshotMeta);
      this.entry.embeds.push(newEmbed);

      this.manageEmbedLayout();
    },
    cancelEditMode(event) {
      const isEditing = this.openmct.editor.isEditing();
      if (isEditing) {
        this.openmct.editor.cancel();
      }
    },
    changeCursor(event) {
      event.preventDefault();

      if (!this.isLocked) {
        event.dataTransfer.dropEffect = 'copy';
      } else {
        event.dataTransfer.dropEffect = 'none';
        event.dataTransfer.effectAllowed = 'none';
      }
    },
    checkEditability($event) {
      if ($event.target.nodeName === 'A') {
        this.canEdit = false;
      }
    },
    deleteEntry() {
      this.$emit('deleteEntry', this.entry.id);
    },
    formatValidUrls(text) {
      return text.replace(URL_REGEX, (match) => {
        const url = new URL(match);
        const domain = url.hostname;
        let result = match;
        let isMatch = this.urlWhitelist.find((partialDomain) => {
          return domain.endsWith(partialDomain);
        });

        if (isMatch) {
          result = `<a class="c-hyperlink" target="_blank" href="${match}">${match}</a>`;
        }

        return result;
      });
    },
    manageEmbedLayout() {
      if (this.$refs.embeds) {
        const embedsWrapperLength = this.$refs.embedsWrapper.clientWidth;
        const embedsTotalWidth = this.$refs.embeds.reduce((total, embed) => {
          return embed.$el.clientWidth + total;
        }, 0);

        this.enableEmbedsWrapperScroll = embedsTotalWidth > embedsWrapperLength;
      }
    },
    async dropOnEntry($event) {
      $event.stopImmediatePropagation();

      const snapshotId = $event.dataTransfer.getData('openmct/snapshot/id');
      if (snapshotId.length) {
        const snapshot = this.snapshotContainer.getSnapshot(snapshotId);
        this.entry.embeds.push(snapshot.embedObject);
        this.snapshotContainer.removeSnapshot(snapshotId);

        const namespace = this.domainObject.identifier.namespace;
        const notebookImageDomainObject = updateNamespaceOfDomainObject(
          snapshot.notebookImageDomainObject,
          namespace
        );
        saveNotebookImageDomainObject(this.openmct, notebookImageDomainObject);
      } else {
        const data = $event.dataTransfer.getData('openmct/domain-object-path');
        const objectPath = JSON.parse(data);
        await this.addNewEmbed(objectPath);
      }

      this.timestampAndUpdate();
    },
    findPositionInArray(array, id) {
      let position = -1;
      array.some((item, index) => {
        const found = item.id === id;
        if (found) {
          position = index;
        }

        return found;
      });

      return position;
    },
    forceBlur(event) {
      event.target.blur();
    },
    formatTime(unixTime, timeFormat) {
      return Moment.utc(unixTime).format(timeFormat);
    },
    navigateToPage() {
      this.$emit('changeSectionPage', {
        sectionId: this.result.section.id,
        pageId: this.result.page.id
      });
    },
    navigateToSection() {
      this.$emit('changeSectionPage', {
        sectionId: this.result.section.id,
        pageId: null
      });
    },
    removeEmbed(id) {
      const embedPosition = this.findPositionInArray(this.entry.embeds, id);
      // TODO: remove notebook snapshot object using object remove API
      this.entry.embeds.splice(embedPosition, 1);

      this.timestampAndUpdate();

      this.manageEmbedLayout();
    },
    updateEmbed(newEmbed) {
      this.entry.embeds.some((e) => {
        const found = e.id === newEmbed.id;
        if (found) {
          e = newEmbed;
        }

        return found;
      });

      this.timestampAndUpdate();
    },
    async timestampAndUpdate() {
      const [user, activeRole] = await Promise.all([
        this.openmct.user.getCurrentUser(),
        this.openmct.user.getActiveRole?.()
      ]);
      if (user === undefined) {
        this.entry.modifiedBy = UNKNOWN_USER;
      } else {
        this.entry.modifiedBy = user.getName();
        if (activeRole) {
          this.entry.modifiedByRole = activeRole;
        }
      }

      this.entry.modified = this.openmct.time.now();

      this.$emit('updateEntry', this.entry);
    },
    preventFocusIfNotSelected($event) {
      if (!this.isSelectedEntry) {
        $event.preventDefault();
        // blur the previous focused entry if clicking on non selected entry input
        const focusedElementId = document.activeElement?.id;
        if (focusedElementId !== this.entry.id) {
          document.activeElement.blur();
        }
      }
    },
    editingEntry() {
      this.editMode = true;
      this.$emit('editingEntry');
    },
    updateEntryValue($event) {
      this.editMode = false;
      const value = $event.target.innerText;
      this.entry.text = sanitizeHtml(value, SANITIZATION_SCHEMA);
      this.timestampAndUpdate();
    },
    selectAndEmitEntry(event, entry) {
      selectEntry({
        element: event.currentTarget,
        entryId: entry.id,
        domainObject: this.domainObject,
        openmct: this.openmct,
        onAnnotationChange: this.timestampAndUpdate,
        notebookAnnotations: this.notebookAnnotations
      });
      event.stopPropagation();
      this.$emit('entry-selection', this.entry);
    }
  }
};
</script>
