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
  <div ref="imagery" class="c-imagery-tsv js-imagery-tsv" :style="alignmentStyle">
    <div ref="imageryHolder" class="c-imagery-tsv__contents u-contents"></div>
  </div>
</template>

<script>
import { scaleLinear, scaleUtc } from 'd3-scale';
import _ from 'lodash';
import mount from 'utils/mount';
import { inject } from 'vue';

import SwimLane from '@/ui/components/swim-lane/SwimLane.vue';
import { PREVIEW_ACTION_KEY } from '@/ui/preview/PreviewAction.js';

import { useAlignment } from '../../../ui/composables/alignmentContext';
import imageryData from '../../imagery/mixins/imageryData.js';

const AXES_PADDING = 20;
const PADDING = 1;
const IMAGE_WIDTH_THRESHOLD = 25;
const CONTAINER_CLASS = 'c-imagery-tsv-container';
const NO_ITEMS_CLASS = 'c-timeline__no-items';
const IMAGE_WRAPPER_CLASS = 'c-imagery-tsv__image-wrapper';
const ID_PREFIX = 'wrapper-';

export default {
  mixins: [imageryData],
  inject: ['openmct', 'domainObject', 'objectPath'],
  setup() {
    const domainObject = inject('domainObject');
    const objectPath = inject('objectPath');
    const openmct = inject('openmct');
    const { alignment: alignmentData } = useAlignment(domainObject, objectPath, openmct);
    return { alignmentData };
  },
  data() {
    let timeSystem = this.openmct.time.getTimeSystem();
    this.metadata = {};
    this.requestCount = 0;

    return {
      viewBounds: undefined,
      height: 0,
      durationFormatter: undefined,
      imageHistory: [],
      timeSystem: timeSystem,
      keyString: undefined
    };
  },
  computed: {
    alignmentStyle() {
      let leftOffset = 0;
      const rightOffset = this.alignmentData.rightWidth ? AXES_PADDING : 0;
      if (this.alignmentData.leftWidth) {
        leftOffset = this.alignmentData.multiple ? 2 * AXES_PADDING : AXES_PADDING;
      }
      return {
        margin: `0 ${this.alignmentData.rightWidth + rightOffset}px 0 ${this.alignmentData.leftWidth + leftOffset}px`
      };
    }
  },
  watch: {
    imageHistory: {
      handler(newHistory, oldHistory) {
        this.updatePlotImagery();
      },
      deep: true
    }
  },
  mounted() {
    this.previewAction = this.openmct.actions.getAction(PREVIEW_ACTION_KEY);

    // Why are we doing this? This element causes scroll problems in the swimlane.
    // this.canvas = this.$refs.imagery.appendChild(document.createElement('canvas'));
    // this.canvas.height = 0;
    // this.canvas.width = 10;
    // this.canvasContext = this.canvas.getContext('2d');
    this.setDimensions();

    this.setScaleAndPlotImagery = this.setScaleAndPlotImagery.bind(this);
    this.updateViewBounds = this.updateViewBounds.bind(this);
    this.setTimeContext = this.setTimeContext.bind(this);
    this.setTimeContext();

    this.updateViewBounds();

    this.resize = _.debounce(this.resize, 400);
    this.imageryStripResizeObserver = new ResizeObserver(this.resize);
    this.imageryStripResizeObserver.observe(this.$refs.imagery);

    this.unlisten = this.openmct.objects.observe(this.domainObject, '*', this.observeForChanges);
  },
  beforeUnmount() {
    if (this.imageryStripResizeObserver) {
      this.imageryStripResizeObserver.disconnect();
    }

    this.stopFollowingTimeContext();
    if (this.unlisten) {
      this.unlisten();
    }
    if (this.destroyImageryContainer) {
      this.destroyImageryContainer();
    }
  },
  methods: {
    setTimeContext() {
      this.stopFollowingTimeContext();
      this.timeContext = this.openmct.time.getContextForView(this.objectPath);
      this.timeContext.on('timeSystem', this.setScaleAndPlotImagery);
      this.timeContext.on('boundsChanged', this.updateViewBounds);
    },
    stopFollowingTimeContext() {
      if (this.timeContext) {
        this.timeContext.off('timeSystem', this.setScaleAndPlotImagery);
        this.timeContext.off('boundsChanged', this.updateViewBounds);
      }
    },
    expand(imageTimestamp) {
      const path = this.objectPath[0];
      this.previewAction.invoke([path], {
        timestamp: imageTimestamp,
        objectPath: this.objectPath
      });
    },
    observeForChanges(mutatedObject) {
      this.updateViewBounds();
    },
    resize() {
      let clientWidth = this.getClientWidth();
      if (clientWidth !== this.width) {
        this.setDimensions();
        this.updateViewBounds();
      }
    },
    getClientWidth() {
      let clientWidth = this.$refs.imagery.clientWidth;

      if (!clientWidth) {
        //this is a hack - need a better way to find the parent of this component
        let parent = this.openmct.layout.$refs.browseObject.$el;
        if (parent) {
          clientWidth = parent.getBoundingClientRect().width;
        }
      }

      return clientWidth;
    },
    updateViewBounds(bounds, isTick) {
      this.viewBounds = this.timeContext.getBounds();

      if (this.timeSystem === undefined) {
        this.timeSystem = this.timeContext.getTimeSystem();
      }

      this.setScaleAndPlotImagery(this.timeSystem, !isTick);
    },
    setScaleAndPlotImagery(timeSystem, clearAllImagery) {
      if (timeSystem !== undefined) {
        this.timeSystem = timeSystem;
        this.timeFormatter = this.getFormatter(this.timeSystem.key);
      }

      this.setScale(this.timeSystem);
      this.updatePlotImagery(clearAllImagery);
    },
    getFormatter(key) {
      const metadata = this.openmct.telemetry.getMetadata(this.domainObject);

      let metadataValue = metadata.value(key) || { format: key };
      let valueFormatter = this.openmct.telemetry.getValueFormatter(metadataValue);

      return valueFormatter;
    },
    updatePlotImagery(clearAllImagery) {
      this.clearPreviousImagery(clearAllImagery);
      if (this.xScale) {
        this.drawImagery();
      }
    },
    clearPreviousImagery(clearAllImagery) {
      //TODO: Only clear items that are out of bounds
      let noItemsEl = this.$el.querySelectorAll(`.${NO_ITEMS_CLASS}`);
      noItemsEl.forEach((item) => {
        item.remove();
      });
      let imagery = this.$el.querySelectorAll(`.${IMAGE_WRAPPER_CLASS}`);
      imagery.forEach((imageElm) => {
        if (clearAllImagery) {
          imageElm.remove();
        } else {
          const id = imageElm.getAttributeNS(null, 'id');
          if (id) {
            const timestamp = id.replace(ID_PREFIX, '');
            if (
              !this.isImageryInBounds({
                time: timestamp
              })
            ) {
              imageElm.remove();
            }
          }
        }
      });
    },
    setDimensions() {
      const imageryHolder = this.$refs.imagery;
      this.width = this.getClientWidth();
      this.height = Math.round(imageryHolder.getBoundingClientRect().height);
      this.imageHeight = this.height - 10;
    },
    setScale(timeSystem) {
      if (!this.width) {
        return;
      }

      if (timeSystem === undefined) {
        timeSystem = this.timeContext.getTimeSystem();
      }

      if (timeSystem.isUTCBased) {
        this.xScale = scaleUtc();
        this.xScale.domain([new Date(this.viewBounds.start), new Date(this.viewBounds.end)]);
      } else {
        this.xScale = scaleLinear();
        this.xScale.domain([this.viewBounds.start, this.viewBounds.end]);
      }

      this.xScale.range([PADDING, this.width - PADDING * 2]);
    },
    isImageryInBounds(imageObj) {
      return imageObj.time <= this.viewBounds.end && imageObj.time >= this.viewBounds.start;
    },
    getImageryContainer() {
      let imageryContainer;

      let existingContainer = this.$el.querySelector(`.${CONTAINER_CLASS}`);
      if (existingContainer) {
        imageryContainer = existingContainer;
      } else {
        if (this.destroyImageryContainer) {
          this.destroyImageryContainer();
        }
        const { vNode, destroy } = mount(
          {
            components: {
              SwimLane
            },
            provide: {
              openmct: this.openmct
            },
            data() {
              return {
                isNested: true
              };
            },
            template: `<swim-lane :is-nested="isNested" :hide-label="true"><template v-slot:object><div class="c-imagery-tsv-container"></div></template></swim-lane>`
          },
          {
            app: this.openmct.app
          }
        );

        this.destroyImageryContainer = destroy;
        const component = vNode.componentInstance;
        this.$refs.imageryHolder.appendChild(component.$el);

        imageryContainer = component.$el.querySelector(`.${CONTAINER_CLASS}`);
      }

      return imageryContainer;
    },
    isImageryWidthAcceptable() {
      // We're calculating if there is enough space between images to show the thumbnails.
      // This algorithm could probably be enhanced to check the x co-ordinate distance between 2 consecutive images, but
      // we will go with this for now assuming imagery is not sorted by asc time so it's difficult to calculate.
      // TODO: Use telemetry.requestCollection to get sorted telemetry
      const currentStart = this.viewBounds.start;
      const currentEnd = this.viewBounds.end;
      const rectX = this.xScale(currentStart);
      const rectY = this.xScale(currentEnd);
      const imageContainerWidth = this.imageHistory.length
        ? (rectY - rectX) / this.imageHistory.length
        : 0;

      return imageContainerWidth < IMAGE_WIDTH_THRESHOLD;
    },
    drawImagery() {
      let imageryContainer = this.getImageryContainer();
      const showImagePlaceholders = this.isImageryWidthAcceptable();
      let index = 0;
      if (this.imageHistory.length) {
        this.imageHistory.forEach((currentImageObject) => {
          if (this.isImageryInBounds(currentImageObject)) {
            this.plotImagery(currentImageObject, showImagePlaceholders, imageryContainer, index);
            index = index + 1;
          }
        });
      } else {
        this.plotNoItems(imageryContainer);
      }
    },
    plotNoItems(containerElement) {
      let textElement = document.createElement('div');
      textElement.classList.add(NO_ITEMS_CLASS);
      textElement.innerHTML = 'No images within timeframe';

      containerElement.appendChild(textElement);
    },
    setNSAttributesForElement(element, attributes) {
      if (!element) {
        return;
      }

      Object.keys(attributes).forEach((key) => {
        element.setAttributeNS(null, key, attributes[key]);
      });
    },
    setStyles(element, styles) {
      if (!element) {
        return;
      }

      Object.keys(styles).forEach((key) => {
        element.style[key] = styles[key];
      });
    },
    getImageWrapper(item) {
      const id = `${ID_PREFIX}${item.time}`;

      return this.$el.querySelector(`.c-imagery-tsv__contents div[id=${id}]`);
    },
    plotImagery(item, showImagePlaceholders, containerElement, index) {
      let existingImageWrapper = this.getImageWrapper(item);
      //imageWrapper wraps the vertical tick and the image
      if (existingImageWrapper) {
        this.updateExistingImageWrapper(existingImageWrapper, item, showImagePlaceholders);
      } else {
        let imageWrapper = this.createImageWrapper(index, item, showImagePlaceholders);
        containerElement.appendChild(imageWrapper);
      }
    },
    setImageDisplay(imageElement, showImagePlaceholders) {
      if (showImagePlaceholders) {
        imageElement.style.display = 'none';
      } else {
        imageElement.style.display = 'block';
      }
    },
    updateExistingImageWrapper(existingImageWrapper, image, showImagePlaceholders) {
      //Update the x co-ordinates of the image wrapper and the url of image
      //this is to avoid tearing down all elements completely and re-drawing them
      this.setNSAttributesForElement(existingImageWrapper, {
        'data-show-image-placeholders': showImagePlaceholders
      });
      existingImageWrapper.style.left = `${this.xScale(image.time)}px`;

      let imageElement = existingImageWrapper.querySelector('img');
      this.setNSAttributesForElement(imageElement, {
        src: image.thumbnailUrl || image.url
      });
      this.setImageDisplay(imageElement, showImagePlaceholders);
    },
    createImageWrapper(index, image, showImagePlaceholders) {
      const id = `${ID_PREFIX}${image.time}`;
      let imageWrapper = document.createElement('div');
      imageWrapper.ariaLabel = id;
      imageWrapper.classList.add(IMAGE_WRAPPER_CLASS);
      imageWrapper.style.left = `${this.xScale(image.time)}px`;
      this.setNSAttributesForElement(imageWrapper, {
        id,
        'data-show-image-placeholders': showImagePlaceholders
      });
      //create image vertical tick indicator
      let imageTickElement = document.createElement('div');
      imageTickElement.classList.add('c-imagery-tsv__image-handle');
      imageWrapper.appendChild(imageTickElement);

      //create placeholder - this will also hold the actual image
      let imagePlaceholder = document.createElement('div');
      imagePlaceholder.classList.add('c-imagery-tsv__image-placeholder');
      imageWrapper.appendChild(imagePlaceholder);

      //create image element
      let imageElement = document.createElement('img');
      this.setNSAttributesForElement(imageElement, {
        src: image.thumbnailUrl || image.url
      });
      this.setImageDisplay(imageElement, showImagePlaceholders);

      //handle mousedown event to show the image in a large view
      imageWrapper.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
          this.expand(image.time);
        }
      });

      imagePlaceholder.appendChild(imageElement);

      return imageWrapper;
    }
  }
};
</script>
