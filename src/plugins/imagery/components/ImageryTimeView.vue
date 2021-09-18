<!--
 Open MCT, Copyright (c) 2014-2021, United States Government
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
<div ref="imagery"
     class="c-imagery-tsv c-timeline-holder"
>
    <div ref="imageryHolder"
         class="c-imagery-tsv__contents u-contents"
    >
    </div>
</div>
</template>

<script>
import * as d3Scale from 'd3-scale';
import SwimLane from "@/ui/components/swim-lane/SwimLane.vue";
import Vue from "vue";
import imageryData from "../../imagery/mixins/imageryData";
import PreviewAction from "@/ui/preview/PreviewAction";
import _ from "lodash";

const PADDING = 1;
const RESIZE_POLL_INTERVAL = 200;
const ROW_HEIGHT = 100;
const IMAGE_WIDTH_THRESHOLD = 40;

export default {
    mixins: [imageryData],
    inject: ['openmct', 'domainObject', 'objectPath'],
    data() {
        let timeSystem = this.openmct.time.timeSystem();
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
        imageHistorySize() {
            return this.imageHistory.length;
        }
    },
    watch: {
        imageHistorySize(newSize, oldSize) {
            this.updatePlotImagery();
        }
    },
    mounted() {
        this.previewAction = new PreviewAction(this.openmct);

        this.canvas = this.$refs.imagery.appendChild(document.createElement('canvas'));
        this.canvas.height = 0;
        this.canvasContext = this.canvas.getContext('2d');
        this.setDimensions();

        this.updateViewBounds();

        this.openmct.time.on("timeSystem", this.setScaleAndPlotImagery);
        this.openmct.time.on("bounds", this.updateViewBounds);

        this.resize = _.debounce(this.resize, 400);
        this.imageryStripResizeObserver = new ResizeObserver(this.resize);
        this.imageryStripResizeObserver.observe(this.$refs.imagery);

        this.unlisten = this.openmct.objects.observe(this.domainObject, '*', this.observeForChanges);
    },
    beforeDestroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
            delete this.unsubscribe;
        }

        if (this.imageryStripResizeObserver) {
            this.imageryStripResizeObserver.disconnect();
        }

        this.openmct.time.off("timeSystem", this.setScaleAndPlotImagery);
        this.openmct.time.off("bounds", this.updateViewBounds);
        if (this.unlisten) {
            this.unlisten();
        }
    },
    methods: {
        expand(index) {
            const path = this.objectPath[0];
            this.previewAction.invoke([path]);
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
            this.viewBounds = this.openmct.time.bounds();
            //Add a 50% padding to the end bounds to look ahead
            let timespan = (this.viewBounds.end - this.viewBounds.start);
            let padding = timespan / 2;
            this.viewBounds.end = this.viewBounds.end + padding;

            if (this.timeSystem === undefined) {
                this.timeSystem = this.openmct.time.timeSystem();
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
            let noItemsEl = this.$el.querySelectorAll(".c-imagery-tsv__no-items");
            noItemsEl.forEach(item => {
                item.remove();
            });
            let imagery = this.$el.querySelectorAll(".c-imagery-tsv__image-wrapper");
            imagery.forEach(item => {
                if (clearAllImagery) {
                    item.remove();
                } else {
                    const id = this.getNSAttributesForElement(item, 'id');
                    if (id) {
                        const timestamp = id.replace('id-', '');
                        if (!this.isImageryInBounds({
                            time: timestamp
                        })) {
                            item.remove();
                        }
                    }
                }
            });
        },
        setDimensions() {
            const imageryHolder = this.$refs.imagery;
            this.width = this.getClientWidth();

            this.height = Math.round(imageryHolder.getBoundingClientRect().height);
        },
        setScale(timeSystem) {
            if (!this.width) {
                return;
            }

            if (timeSystem === undefined) {
                timeSystem = this.openmct.time.timeSystem();
            }

            if (timeSystem.isUTCBased) {
                this.xScale = d3Scale.scaleUtc();
                this.xScale.domain(
                    [new Date(this.viewBounds.start), new Date(this.viewBounds.end)]
                );
            } else {
                this.xScale = d3Scale.scaleLinear();
                this.xScale.domain(
                    [this.viewBounds.start, this.viewBounds.end]
                );
            }

            this.xScale.range([PADDING, this.width - PADDING * 2]);
        },
        isImageryInBounds(imageObj) {
            return (imageObj.time < this.viewBounds.end) && (imageObj.time > this.viewBounds.start);
        },
        getImageryContainer() {
            let svgHeight = 100;
            let svgWidth = this.imageHistory.length ? this.width : 200;
            let groupSVG;

            let existingSVG = this.$el.querySelector(".c-imagery-tsv__contents svg");
            if (existingSVG) {
                groupSVG = existingSVG;
                this.setNSAttributesForElement(groupSVG, {
                    width: svgWidth
                });
            } else {
                let component = new Vue({
                    components: {
                        SwimLane
                    },
                    provide: {
                        openmct: this.openmct
                    },
                    data() {
                        return {
                            isNested: true,
                            height: svgHeight,
                            width: svgWidth
                        };
                    },
                    template: `<swim-lane :is-nested="isNested" :hide-label="true"><template slot="object"><svg class="c-imagery-tsv-container" :height="height" :width="width"></svg></template></swim-lane>`
                });

                this.$refs.imageryHolder.appendChild(component.$mount().$el);

                groupSVG = component.$el.querySelector('svg');

                groupSVG.addEventListener('mouseout', (event) => {
                    if (event.target.nodeName === 'svg' || event.target.nodeName === 'use') {
                        this.removeFromForeground();
                    }
                });
            }

            return groupSVG;
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
            const imageContainerWidth = this.imageHistory.length ? (rectY - rectX) / this.imageHistory.length : 0;

            return imageContainerWidth < IMAGE_WIDTH_THRESHOLD;
        },
        drawImagery() {
            let groupSVG = this.getImageryContainer();
            const showImagePlaceholders = this.isImageryWidthAcceptable();

            if (this.imageHistory.length) {
                this.imageHistory.forEach((currentImageObject, index) => {
                    if (this.isImageryInBounds(currentImageObject)) {
                        this.plotImagery(currentImageObject, showImagePlaceholders, groupSVG, index);
                    }
                });
            } else {
                this.plotNoItems(groupSVG);
            }
        },
        plotNoItems(svgElement) {
            let textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            this.setNSAttributesForElement(textElement, {
                x: "10",
                y: "20",
                class: "c-imagery-tsv__no-items"
            });
            textElement.innerHTML = 'No images within timeframe';

            svgElement.appendChild(textElement);
        },
        setNSAttributesForElement(element, attributes) {
            Object.keys(attributes).forEach((key) => {
                if (key === 'url') {
                    element.setAttributeNS('http://www.w3.org/1999/xlink', 'href', attributes[key]);
                } else {
                    element.setAttributeNS(null, key, attributes[key]);
                }
            });
        },
        getNSAttributesForElement(element, attribute) {
            return element.getAttributeNS(null, attribute);
        },
        getImageWrapper(item) {
            const id = `id-${item.time}`;

            return this.$el.querySelector(`.c-imagery-tsv__contents g[id=${id}]`);
        },
        plotImagery(item, showImagePlaceholders, svgElement, index) {
            //TODO: Placeholder image
            let existingImageWrapper = this.getImageWrapper(item);
            //imageWrapper wraps the vertical tick rect and the image
            if (existingImageWrapper) {
                this.updateExistingImageWrapper(existingImageWrapper, item, showImagePlaceholders);
            } else {
                let imageWrapper = this.createImageWrapper(index, item, showImagePlaceholders, svgElement);
                svgElement.appendChild(imageWrapper);
            }
        },
        updateExistingImageWrapper(existingImageWrapper, item, showImagePlaceholders) {
            //Update the x co-ordinates of the handle and image elements and the url of image
            //this is to avoid tearing down all elements completely and re-drawing them
            this.setNSAttributesForElement(existingImageWrapper, {
                showImagePlaceholders
            });
            let imageTickElement = existingImageWrapper.querySelector('rect.c-imagery-tsv__image-handle');
            this.setNSAttributesForElement(imageTickElement, {
                x: this.xScale(item.time)
            });

            let imageRect = existingImageWrapper.querySelector('rect.c-imagery-tsv__image-placeholder');
            this.setNSAttributesForElement(imageRect, {
                x: this.xScale(item.time) + 2
            });

            let imageElement = existingImageWrapper.querySelector('image');
            const selector = `href*=${existingImageWrapper.id}`;
            let hoverEl = this.$el.querySelector(`.c-imagery-tsv__contents use[${selector}]`);
            const hideImageUrl = (showImagePlaceholders && !hoverEl);
            this.setNSAttributesForElement(imageElement, {
                x: this.xScale(item.time) + 2,
                url: hideImageUrl ? '' : item.url
            });
        },
        createImageWrapper(index, item, showImagePlaceholders, svgElement) {
            const id = `id-${item.time}`;
            const imgSize = String(ROW_HEIGHT - 15);
            let imageWrapper = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            this.setNSAttributesForElement(imageWrapper, {
                id,
                class: 'c-imagery-tsv__image-wrapper',
                showImagePlaceholders
            });
            //create image tick indicator
            let imageTickElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            this.setNSAttributesForElement(imageTickElement, {
                class: 'c-imagery-tsv__image-handle',
                x: this.xScale(item.time),
                y: 5,
                rx: 0,
                width: 2,
                height: String(ROW_HEIGHT - 10)
            });
            imageWrapper.appendChild(imageTickElement);

            let imageRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            this.setNSAttributesForElement(imageRect, {
                class: 'c-imagery-tsv__image-placeholder',
                x: this.xScale(item.time) + 2,
                y: 10,
                rx: 0,
                width: imgSize,
                height: imgSize,
                mask: `#image-${item.time}`
            });
            imageWrapper.appendChild(imageRect);

            let imageElement = document.createElementNS('http://www.w3.org/2000/svg', 'image');
            this.setNSAttributesForElement(imageElement, {
                id: `image-${item.time}`,
                x: this.xScale(item.time) + 2,
                y: 10,
                rx: 0,
                width: imgSize,
                height: imgSize,
                url: showImagePlaceholders ? '' : item.url
            });
            imageWrapper.appendChild(imageElement);

            //TODO: Don't add the hover listener if the width is too small
            imageWrapper.addEventListener('mouseover', this.bringToForeground.bind(this, svgElement, imageWrapper, index, item.url));

            return imageWrapper;
        },
        bringToForeground(svgElement, imageWrapper, index, url, event) {
            const selector = `href*=${imageWrapper.id}`;
            let hoverEls = this.$el.querySelectorAll(`.c-imagery-tsv__contents use:not([${selector}])`);
            if (hoverEls.length > 0) {
                this.removeFromForeground(hoverEls);
            }

            hoverEls = this.$el.querySelectorAll(`.c-imagery-tsv__contents use[${selector}]`);
            if (hoverEls.length) {

                return;
            }

            let imageElement = imageWrapper.querySelector('image');
            this.setNSAttributesForElement(imageElement, {
                url: url,
                fill: 'none'
            });
            let hoverElement = document.createElementNS('http://www.w3.org/2000/svg', 'use');
            this.setNSAttributesForElement(hoverElement, {
                class: 'image-highlight',
                x: 0,
                href: `#${imageWrapper.id}`
            });
            this.setNSAttributesForElement(imageWrapper, {
                class: 'c-imagery-tsv__image-wrapper is-hovered'
            });
            // We're using mousedown here and not 'click' because 'click' doesn't seem to be triggered reliably
            hoverElement.addEventListener('mousedown', (e) => {
                if (e.button === 0) {
                    this.expand(index);
                }
            });

            svgElement.appendChild(hoverElement);

        },
        removeFromForeground(items) {
            let hoverEls;
            if (items) {
                hoverEls = items;
            } else {
                hoverEls = this.$el.querySelectorAll(".c-imagery-tsv__contents use");
            }

            hoverEls.forEach(item => {
                let selector = `id*=${this.getNSAttributesForElement(item, 'href').replace('#', '')}`;
                let imageWrapper = this.$el.querySelector(`.c-imagery-tsv__contents g[${selector}]`);
                this.setNSAttributesForElement(imageWrapper, {
                    class: 'c-imagery-tsv__image-wrapper'
                });
                let showImagePlaceholders = this.getNSAttributesForElement(imageWrapper, 'showImagePlaceholders');
                if (showImagePlaceholders === 'true') {
                    let imageElement = imageWrapper.querySelector('image');
                    this.setNSAttributesForElement(imageElement, {
                        url: ''
                    });
                }

                item.remove();
            });
        }
    }
};
</script>
