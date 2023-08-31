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
    class="c-gsearch-result c-gsearch-result--object"
    aria-label="Search Result"
    role="presentation"
  >
    <div class="c-gsearch-result__type-icon" :class="resultTypeIcon"></div>
    <div
      class="c-gsearch-result__body"
      role="option"
      :aria-label="`${resultName} ${resultType} result`"
    >
      <div
        ref="resultName"
        class="c-gsearch-result__title"
        :name="resultName"
        draggable="true"
        @dragstart="dragStart"
        @click="clickedResult"
        @mouseover.ctrl="showToolTip"
        @mouseleave="hideToolTip"
      >
        {{ resultName }}
      </div>

      <ObjectPath :read-only="false" :domain-object="result" />
    </div>
    <div class="c-gsearch-result__more-options-button">
      <button class="c-icon-button icon-3-dots"></button>
    </div>
  </div>
</template>

<script>
import tooltipHelpers from '../../../api/tooltips/tooltipMixins';
import identifierToString from '../../../tools/url';
import ObjectPath from '../../components/ObjectPath.vue';
import PreviewAction from '../../preview/PreviewAction';

export default {
  name: 'ObjectSearchResult',
  components: {
    ObjectPath
  },
  mixins: [tooltipHelpers],
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
  computed: {
    resultName() {
      return this.result.name;
    },
    resultTypeIcon() {
      return this.openmct.types.get(this.result.type).definition.cssClass;
    },
    resultType() {
      return this.result.type;
    }
  },
  mounted() {
    this.previewAction = new PreviewAction(this.openmct);
    this.previewAction.on('isVisible', this.togglePreviewState);
  },
  unmounted() {
    this.previewAction.off('isVisible', this.togglePreviewState);
  },
  methods: {
    clickedResult(event) {
      const { objectPath } = this.result;
      if (this.openmct.editor.isEditing()) {
        event.preventDefault();
        this.preview(objectPath);
      } else {
        let resultUrl = identifierToString(this.openmct, objectPath);

        // Remove the vestigial 'ROOT' identifier from url if it exists
        if (resultUrl.includes('/ROOT')) {
          resultUrl = resultUrl.split('/ROOT').join('');
        }

        this.openmct.router.navigate(resultUrl);
      }
    },
    togglePreviewState(previewState) {
      this.$emit('preview-changed', previewState);
    },
    preview(objectPath) {
      if (this.previewAction.appliesTo(objectPath)) {
        this.previewAction.invoke(objectPath);
      }
    },
    dragStart(event) {
      const navigatedObject = this.openmct.router.path[0];
      const { objectPath } = this.result;
      const serializedPath = JSON.stringify(objectPath);
      const keyString = this.openmct.objects.makeKeyString(this.result.identifier);
      if (this.openmct.composition.checkPolicy(navigatedObject, this.result)) {
        event.dataTransfer.setData('openmct/composable-domain-object', JSON.stringify(this.result));
      }

      event.dataTransfer.setData('openmct/domain-object-path', serializedPath);
      event.dataTransfer.setData(`openmct/domain-object/${keyString}`, this.result);
    },
    async showToolTip() {
      const { BELOW } = this.openmct.tooltips.TOOLTIP_LOCATIONS;
      this.buildToolTip(await this.getObjectPath(this.result.identifier), BELOW, 'resultName');
    }
  }
};
</script>
