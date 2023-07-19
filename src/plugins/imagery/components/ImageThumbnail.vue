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
    class="c-imagery__thumb c-thumb"
    :class="{
      active: active,
      selected: selected,
      'real-time': realTime
    }"
    :title="image.formattedTime"
    @click="handleClick"
  >
    <a class="c-thumb__image-wrapper" href="" :download="image.imageDownloadName" @click.prevent>
      <img
        ref="img"
        class="c-thumb__image"
        :src="`${image.thumbnailUrl || image.url}`"
        fetchpriority="low"
        @load="imageLoadCompleted"
      />
      <i
        v-show="showAnnotationIndicator"
        class="c-thumb__annotation-indicator icon-status-poll-edit"
      >
      </i>
    </a>
    <div v-if="viewableArea" class="c-thumb__viewable-area" :style="viewableAreaStyle"></div>
    <div class="c-thumb__timestamp">{{ image.formattedTime }}</div>
  </div>
</template>

<script>
const THUMB_PADDING = 4;
const BORDER_WIDTH = 2;

export default {
  props: {
    image: {
      type: Object,
      required: true
    },
    active: {
      type: Boolean,
      required: true
    },
    selected: {
      type: Boolean,
      required: true
    },
    realTime: {
      type: Boolean,
      required: true
    },
    imageryAnnotations: {
      type: Array,
      default() {
        return [];
      }
    },
    viewableArea: {
      type: Object,
      default: function () {
        return null;
      }
    }
  },
  data() {
    return {
      imgWidth: 0,
      imgHeight: 0
    };
  },
  computed: {
    viewableAreaStyle() {
      if (!this.viewableArea || !this.imgWidth || !this.imgHeight) {
        return null;
      }

      const { widthRatio, heightRatio, xOffsetRatio, yOffsetRatio } = this.viewableArea;
      const imgWidth = this.imgWidth;
      const imgHeight = this.imgHeight;

      let translateX = imgWidth * xOffsetRatio;
      let translateY = imgHeight * yOffsetRatio;
      let width = imgWidth * widthRatio;
      let height = imgHeight * heightRatio;

      if (translateX < 0) {
        width += translateX;
        translateX = 0;
      }

      if (translateX + width > imgWidth) {
        width = imgWidth - translateX;
      }

      if (translateX + 2 * BORDER_WIDTH > imgWidth) {
        translateX = imgWidth - 2 * BORDER_WIDTH;
      }

      if (translateY < 0) {
        height += translateY;
        translateY = 0;
      }

      if (translateY + height > imgHeight) {
        height = imgHeight - translateY;
      }

      if (translateY + 2 * BORDER_WIDTH > imgHeight) {
        translateY = imgHeight - 2 * BORDER_WIDTH;
      }

      return {
        transform: `translate(${translateX + THUMB_PADDING}px, ${translateY + THUMB_PADDING}px)`,
        width: `${width}px`,
        height: `${height}px`
      };
    },
    showAnnotationIndicator() {
      return this.imageryAnnotations.some((annotation) => {
        return !annotation._deleted;
      });
    }
  },
  methods: {
    handleClick(event) {
      this.$emit('click', event);
    },
    imageLoadCompleted() {
      if (!this.$refs.img) {
        return;
      }

      const { width: imgWidth, height: imgHeight } = this.$refs.img;
      this.imgWidth = imgWidth;
      this.imgHeight = imgHeight;
    }
  }
};
</script>
