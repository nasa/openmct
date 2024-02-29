<!-- eslint-disable vue/no-v-html -->
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
    ref="entry"
    class="c-notebook__entry c-ne has-local-controls"
    aria-label="Notebook Entry"
    :class="{ locked: isLocked, 'is-selected': isSelectedEntry, 'is-editing': editMode }"
    @dragover="changeCursor"
    @drop.capture="cancelEditMode"
    @drop.prevent="dropOnEntry"
    @click="selectAndEmitEntry($event, entry)"
    @paste="addImageFromPaste"
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
              :text="convertMarkDownToHtml(entry.text)"
              :highlight="highlightText"
              :highlight-class="'search-highlight'"
            />
          </div>
        </template>
        <template v-else-if="!isLocked">
          <div
            v-if="!editMode"
            v-bind.prop="formattedText"
            :id="entry.id"
            tabindex="-1"
            aria-label="Notebook Entry Display"
            class="c-ne__text"
            @mouseover="checkEditability($event)"
            @click="editingEntry($event)"
          ></div>
          <textarea
            v-else
            :id="entry.id"
            ref="entryInput"
            v-model="entry.text"
            class="c-ne__input"
            aria-label="Notebook Entry Input"
            tabindex="-1"
            @mouseleave="canEdit = true"
            @blur="updateEntryValue($event)"
          ></textarea>
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
              @remove-embed="removeEmbed"
              @update-embed="updateEmbed"
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
import { Marked } from 'marked';
import Moment from 'moment';
import sanitizeHtml from 'sanitize-html';

import TextHighlight from '../../../utils/textHighlight/TextHighlight.vue';
import { createNewEmbed, createNewImageEmbed, selectEntry } from '../utils/notebook-entries.js';
import {
  saveNotebookImageDomainObject,
  updateNamespaceOfDomainObject
} from '../utils/notebook-image.js';
import NotebookEmbed from './NotebookEmbed.vue';

const SANITIZATION_SCHEMA = {
  allowedTags: [
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'blockquote',
    'p',
    'a',
    'ul',
    'ol',
    'li',
    'b',
    'i',
    'strong',
    'em',
    's',
    'strike',
    'code',
    'hr',
    'br',
    'div',
    'table',
    'thead',
    'caption',
    'tbody',
    'tr',
    'th',
    'td',
    'pre',
    'del',
    'ins',
    'mark',
    'abbr'
  ],
  allowedAttributes: {
    a: ['href', 'target', 'class', 'title'],
    code: ['class'],
    abbr: ['title']
  }
};

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
  emits: [
    'delete-entry',
    'change-section-page',
    'update-entry',
    'editing-entry',
    'entry-selection',
    'update-annotations'
  ],
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
      const text = this.entry.text;

      if (this.editMode) {
        return { innerText: text };
      }

      const markDownHtml = this.convertMarkDownToHtml(text);

      return { innerHTML: markDownHtml };
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
  watch: {
    editMode() {
      this.$nextTick(() => {
        // waiting for textarea to be rendered
        this.$refs.entryInput?.focus();
        this.adjustTextareaHeight();
      });
    }
  },
  beforeMount() {
    this.marked = new Marked();
    this.renderer = new this.marked.Renderer();
  },
  mounted() {
    const originalLinkRenderer = this.renderer.link;
    this.renderer.link = this.validateLink.bind(this, originalLinkRenderer);

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
      this.embedsWrapperResizeObserver.disconnect();
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
      if (!this.entry.embeds) {
        this.entry.embeds = [];
      }
      this.entry.embeds.push(newEmbed);

      this.manageEmbedLayout();
    },
    async addImageFromPaste(event) {
      const clipboardItems = Array.from(
        (event.clipboardData || event.originalEvent.clipboardData).items
      );
      const hasImage = clipboardItems.some(
        (clipboardItem) => clipboardItem.type.includes('image') && clipboardItem.kind === 'file'
      );
      // If the clipboard contained an image, prevent the paste event from reaching the textarea.
      if (hasImage) {
        event.preventDefault();
      }
      await Promise.all(
        Array.from(clipboardItems).map(async (clipboardItem) => {
          const isImage = clipboardItem.type.includes('image') && clipboardItem.kind === 'file';
          if (isImage) {
            const imageFile = clipboardItem.getAsFile();
            const imageEmbed = await createNewImageEmbed(imageFile, this.openmct, imageFile?.name);
            if (!this.entry.embeds) {
              this.entry.embeds = [];
            }
            this.entry.embeds.push(imageEmbed);
          }
        })
      );
      this.manageEmbedLayout();
      this.timestampAndUpdate();
    },
    convertMarkDownToHtml(text = '') {
      let markDownHtml = this.marked.parse(text, {
        breaks: true,
        renderer: this.renderer
      });
      markDownHtml = sanitizeHtml(markDownHtml, SANITIZATION_SCHEMA);
      return markDownHtml;
    },
    adjustTextareaHeight() {
      if (this.$refs.entryInput) {
        this.$refs.entryInput.style.height = 'auto';
        this.$refs.entryInput.style.height = `${this.$refs?.entryInput.scrollHeight}px`;
        this.$refs.entryInput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    },
    validateLink(originalLinkRenderer, href, title, text) {
      try {
        const domain = new URL(href).hostname;
        const urlIsWhitelisted = this.urlWhitelist.some((partialDomain) => {
          return domain.endsWith(partialDomain);
        });
        if (!urlIsWhitelisted) {
          return text;
        }
        const linkHtml = originalLinkRenderer.call(this.renderer, href, title, text);
        const linkHtmlWithTarget = linkHtml.replace(
          /^<a /,
          '<a class="c-hyperlink" target="_blank"'
        );
        return linkHtmlWithTarget;
      } catch (error) {
        // had error parsing this URL, just return the text
        return text;
      }
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
      this.$emit('delete-entry', this.entry.id);
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
    async dropOnEntry(dropEvent) {
      dropEvent.stopImmediatePropagation();
      const dataTransferFiles = Array.from(dropEvent.dataTransfer.files);

      const localImageDropped = dataTransferFiles.some((file) => file.type.includes('image'));
      const snapshotId = dropEvent.dataTransfer.getData('openmct/snapshot/id');
      const domainObjectData = dropEvent.dataTransfer.getData('openmct/domain-object-path');
      const imageUrl = dropEvent.dataTransfer.getData('URL');
      if (localImageDropped) {
        // local image(s) dropped from disk (file)
        await Promise.all(
          dataTransferFiles.map(async (file) => {
            if (file.type.includes('image')) {
              const imageData = file;
              const imageEmbed = await createNewImageEmbed(
                imageData,
                this.openmct,
                imageData?.name
              );
              if (!this.entry.embeds) {
                this.entry.embeds = [];
              }
              this.entry.embeds.push(imageEmbed);
            }
          })
        );
        this.manageEmbedLayout();
      } else if (imageUrl) {
        try {
          // remote image dropped (URL)
          const response = await fetch(imageUrl);
          const imageData = await response.blob();
          const imageEmbed = await createNewImageEmbed(imageData, this.openmct);
          if (!this.entry.embeds) {
            this.entry.embeds = [];
          }
          this.entry.embeds.push(imageEmbed);
          this.manageEmbedLayout();
        } catch (error) {
          this.openmct.notifications.error(`Unable to add image: ${error.message} `);
          console.error(`Problem embedding remote image`, error);
        }
      } else if (snapshotId.length) {
        // snapshot object
        const snapshot = this.snapshotContainer.getSnapshot(snapshotId);
        if (!this.entry.embeds) {
          this.entry.embeds = [];
        }
        this.entry.embeds.push(snapshot.embedObject);
        this.snapshotContainer.removeSnapshot(snapshotId);

        const namespace = this.domainObject.identifier.namespace;
        const notebookImageDomainObject = updateNamespaceOfDomainObject(
          snapshot.notebookImageDomainObject,
          namespace
        );
        saveNotebookImageDomainObject(this.openmct, notebookImageDomainObject);
      } else if (domainObjectData) {
        // plain domain object
        const objectPath = JSON.parse(domainObjectData);
        await this.addNewEmbed(objectPath);
      } else {
        this.openmct.notifications.error(
          `Unknown object(s) dropped and cannot embed. Try again with an image or domain object.`
        );
        console.warn(
          `Unknown object(s) dropped and cannot embed. Try again with an image or domain object.`
        );
        return;
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
    formatTime(unixTime, timeFormat) {
      return Moment.utc(unixTime).format(timeFormat);
    },
    navigateToPage() {
      this.$emit('change-section-page', {
        sectionId: this.result.section.id,
        pageId: this.result.page.id
      });
    },
    navigateToSection() {
      this.$emit('change-section-page', {
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

      this.$emit('update-entry', this.entry);
    },
    editingEntry(event) {
      this.selectAndEmitEntry(event, this.entry);
      if (this.isSelectedEntry) {
        // selected and click, so we're ready to edit
        this.selectAndEmitEntry(event, this.entry);
        this.editMode = true;
        this.adjustTextareaHeight();
        this.$emit('editing-entry');
      }
    },
    updateEntryValue($event) {
      this.editMode = false;
      const rawEntryValue = $event.target.value;
      const sanitizeInput = sanitizeHtml(rawEntryValue, { allowedAttributes: [], allowedTags: [] });
      // change &gt back to > for markdown to do blockquotes
      const restoredQuoteBrackets = sanitizeInput.replace(/&gt;/g, '>');
      this.entry.text = restoredQuoteBrackets;
      this.timestampAndUpdate();
    },
    updateAnnotations(newAnnotations) {
      this.$emit('update-annotations', newAnnotations);
    },
    selectAndEmitEntry(event, entry) {
      selectEntry({
        element: this.$refs.entry,
        entryId: entry.id,
        domainObject: this.domainObject,
        openmct: this.openmct,
        onAnnotationChange: this.updateAnnotations,
        notebookAnnotations: this.notebookAnnotations
      });
      event.stopPropagation();
      this.$emit('entry-selection', this.entry);
    }
  }
};
</script>
