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
    class="c-gsearch-result c-gsearch-result--annotation"
    aria-label="Annotation Search Result"
    role="listitem"
  >
    <div class="c-gsearch-result__type-icon" :class="resultTypeIcon"></div>
    <div class="c-gsearch-result__body">
      <div class="c-gsearch-result__title" @click="clickedResult">
        {{ getResultName }}
      </div>

      <ObjectPath :domain-object="domainObject" :read-only="false" :show-object-itself="true" />

      <div class="c-gsearch-result__tags">
        <div
          v-for="(tag, index) in result.fullTagModels"
          :key="index"
          class="c-tag"
          :class="{ '--is-not-search-match': !isSearchMatched(tag) }"
          :style="{ backgroundColor: tag.backgroundColor, color: tag.foregroundColor }"
        >
          {{ tag.label }}
        </div>
      </div>
    </div>
    <div class="c-gsearch-result__more-options-button">
      <button class="c-icon-button icon-3-dots"></button>
    </div>
  </div>
</template>

<script>
import { Marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

import { identifierToString } from '../../../../src/tools/url.js';
import ObjectPath from '../../components/ObjectPath.vue';
import PreviewAction from '../../preview/PreviewAction.js';

export default {
  name: 'AnnotationSearchResult',
  components: {
    ObjectPath
  },
  inject: ['openmct'],
  props: {
    result: {
      type: Object,
      required: true,
      default() {
        return {};
      }
    }
  },
  data() {
    return {};
  },
  computed: {
    domainObject() {
      return this.result.targetModels[0];
    },
    getResultName() {
      if (this.result.annotationType === this.openmct.annotation.ANNOTATION_TYPES.NOTEBOOK) {
        const previewText = this.getNotebookPreviewText(this.result);
        return previewText;
      } else if (
        this.result.annotationType === this.openmct.annotation.ANNOTATION_TYPES.GEOSPATIAL
      ) {
        const previewText = this.getGeospatialPreviewText(this.result);
        return previewText;
      } else {
        return this.result.targetModels[0].name;
      }
    },
    resultTypeIcon() {
      return this.openmct.types.get(this.result.type).definition.cssClass;
    },
    tagBackgroundColor() {
      return this.result.fullTagModels[0].backgroundColor;
    },
    tagForegroundColor() {
      return this.result.fullTagModels[0].foregroundColor;
    }
  },
  beforeMount() {
    this.marked = new Marked();
  },
  mounted() {
    this.previewAction = new PreviewAction(this.openmct);
    this.previewAction.on('isVisible', this.togglePreviewState);
    this.fireAnnotationSelection = this.fireAnnotationSelection.bind(this);
  },
  unmounted() {
    this.previewAction.off('isVisible', this.togglePreviewState);
    this.openmct.selection.off('change', this.fireAnnotationSelection);
  },
  methods: {
    getNotebookEntryTextById(entryIdToFind, notebookModel) {
      const sections = Object.values(notebookModel);
      for (const section of sections) {
        const pages = Object.values(section);
        for (const entries of pages) {
          for (const entry of entries) {
            if (entry.id === entryIdToFind) {
              return entry.text;
            }
          }
        }
      }
      return null;
    },
    getNotebookPreviewText(result) {
      const targetID = Object.keys(this.result.targets)[0];
      const entryIdToFind = this.result.targets[targetID].entryId;
      const notebookModel = this.result.targetModels[0].configuration.entries;

      const entryText = this.getNotebookEntryTextById(entryIdToFind, notebookModel);
      if (entryText === null) {
        return 'Could not find any matching Notebook entries';
      }
      const markDownHtml = this.marked.parse(entryText, {
        breaks: true
      });
      // strip everything
      const cleanedHtml = sanitizeHtml(markDownHtml, { allowedAttributes: [], allowedTags: [] });
      // strip to 64 characters
      let truncatedText = cleanedHtml.substring(0, 64);
      // add ellipsis if necessary
      if (truncatedText.length < entryText.length) {
        truncatedText = `${truncatedText}...`;
      }
      return truncatedText;
    },
    getGeospatialPreviewText(result) {
      const targetID = Object.keys(this.result.targets)[0];
      const { layerName, name } = this.result.targets[targetID];

      return layerName ? `${layerName} - ${name}` : name;
    },
    clickedResult(event) {
      const objectPath = this.domainObject.originalPath;
      if (this.openmct.editor.isEditing()) {
        event.preventDefault();
        this.preview(objectPath);
      } else {
        const resultUrl = identifierToString(this.openmct, objectPath);
        if (!this.openmct.router.isNavigatedObject(objectPath)) {
          // if we're not on the correct page, navigate to the object,
          // then wait for the selection event to fire before issuing a new selection
          if (this.result.annotationType) {
            this.openmct.selection.on('change', this.fireAnnotationSelection);
          }

          this.openmct.router.navigate(resultUrl);
        } else {
          // if this is the navigated object, then we are already on the correct page
          // and just need to issue the selection event
          this.fireAnnotationSelection();
        }
      }
    },
    preview(objectPath) {
      if (this.previewAction.appliesTo(objectPath)) {
        this.previewAction.invoke(objectPath);
      }
    },
    fireAnnotationSelection() {
      this.openmct.selection.off('change', this.fireAnnotationSelection);
      const selection = [
        {
          element: this.$el,
          context: {
            item: this.result.targetModels[0],
            type: 'annotation-search-result',
            targetDetails: this.result.targets,
            targetDomainObjects: this.result.targetModels,
            annotations: [this.result],
            annotationType: this.result.annotationType,
            onAnnotationChange: () => {}
          }
        }
      ];
      this.openmct.selection.select(selection, true);
    },
    isSearchMatched(tag) {
      if (this.result.matchingTagKeys) {
        return this.result.matchingTagKeys.includes(tag.tagID);
      }

      return false;
    }
  }
};
</script>
