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
     class="c-imagery c-timeline-holder"
>
    <div ref="imageryHolder"
         class="c-imagery__contents u-contents"
    >
    </div>
</div>
</template>

<script>
import * as d3Scale from 'd3-scale';
import SwimLane from "@/ui/components/swim-lane/SwimLane.vue";
// import ImageryOverlay from "./ImageryOverlay.vue";
import Vue from "vue";

const PADDING = 1;
const RESIZE_POLL_INTERVAL = 200;
const ROW_HEIGHT = 100;
const DEFAULT_COLOR = '#cc9922';

export default {
    inject: ['openmct', 'domainObject', 'objectPath', 'currentView'],
    props: {
        imageHistory: {
            type: Array,
            required: true,
            default() {
                return [];
            }
        }
    },
    data() {
        return {
            viewBounds: undefined,
            timeSystem: undefined,
            height: 0
        };
    },
    watch: {
        imageHistory() {
            this.updatePlotImagery();
        }
    },
    mounted() {
        this.canvas = this.$refs.imagery.appendChild(document.createElement('canvas'));
        this.canvas.height = 0;
        this.canvasContext = this.canvas.getContext('2d');
        this.setDimensions();

        this.updateViewBounds();

        this.openmct.time.on("timeSystem", this.setScaleAndPlotImagery);
        this.openmct.time.on("bounds", this.updateViewBounds);
        this.resizeTimer = setInterval(this.resize, RESIZE_POLL_INTERVAL);
        this.unlisten = this.openmct.objects.observe(this.domainObject, '*', this.observeForChanges);
    },
    beforeDestroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
            delete this.unsubscribe;
        }

        clearInterval(this.resizeTimer);
        this.openmct.time.off("timeSystem", this.setScaleAndPlotImagery);
        this.openmct.time.off("bounds", this.updateViewBounds);
        if (this.unlisten) {
            this.unlisten();
        }
    },
    methods: {
        expand(imageObject, index) {
            this.$emit('expand', imageObject, index);
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

            this.setScaleAndPlotImagery();

        },
        setScaleAndPlotImagery(timeSystem) {
            if (timeSystem !== undefined) {
                this.timeSystem = timeSystem;
                this.timeFormatter = this.getFormatter(this.timeSystem.key);
            }

            this.setScale(this.timeSystem);
            this.updatePlotImagery();
        },
        updatePlotImagery() {
            this.clearPreviousImagery();
            if (this.xScale) {
                this.drawImagery();
            }
        },
        clearPreviousImagery() {
            //TODO: Only clear items that are out of bounds
            let imagery = this.$el.querySelectorAll(".c-imagery__contents > div");
            imagery.forEach(item => item.remove());
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
            let svgWidth = 200;

            if (this.imageHistory.length) {
                svgWidth = this.width;
            }

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
                template: `<swim-lane :is-nested="isNested" :hide-label="true"><template slot="object"><svg :height="height" :width="width"></svg></template></swim-lane>`
            });

            this.$refs.imageryHolder.appendChild(component.$mount().$el);

            let groupLabel = component.$el.querySelector('div:nth-child(1)');
            let groupSVG = component.$el.querySelector('svg');

            return {
                groupLabel,
                groupSVG
            };
        },
        drawImagery() {
            const currentStart = this.viewBounds.start;
            const currentEnd = this.viewBounds.end;
            const rectX = this.xScale(currentStart);
            const rectY = this.xScale(currentEnd);
            const imageContainerWidth = this.imageHistory.length ? (rectY - rectX) / this.imageHistory.length : 0;
            const showPlaceholders = imageContainerWidth < 40;

            const groupElements = this.getImageryContainer();
            let groupSVG = groupElements.groupSVG;

            if (this.imageHistory.length) {
                this.imageHistory.forEach((imageObject, index) => {
                    if (this.isImageryInBounds(imageObject)) {
                        this.plotImagery(imageObject, showPlaceholders, groupSVG, index);
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
                class: "activity-label--outside-rect"
            });
            textElement.innerHTML = 'No activities within timeframe';

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
        plotImagery(item, showPlaceholders, svgElement, index) {
            //TODO: Placeholder image
            let url = showPlaceholders ? '' : item.url;
            let handleElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');

            // rx: don't round corners if the width of the rect is smaller than the rounding radius
            this.setNSAttributesForElement(handleElement, {
                class: 'activity-bounds',
                x: this.xScale(item.time),
                y: 0,
                rx: 0,
                width: 1,
                height: String(ROW_HEIGHT),
                fill: 'currentColor'
            });
            svgElement.appendChild(handleElement);

            let imageElement = document.createElementNS('http://www.w3.org/2000/svg', 'image');
            this.setNSAttributesForElement(imageElement, {
                class: 'activity-bounds',
                x: this.xScale(item.time) + 2,
                y: 0,
                rx: 0,
                width: String(ROW_HEIGHT),
                height: String(ROW_HEIGHT),
                fill: DEFAULT_COLOR,
                url: url,
                id: `${index}-${item.time}`
            });
            imageElement.addEventListener('mouseover', (event) => {
                this.bringToForeground(event, svgElement, imageElement, item, index);
            });

            svgElement.appendChild(imageElement);
            svgElement.addEventListener('mouseout', (event) => {
                if (event.target.nodeName === 'svg' || event.target.nodeName === 'use') {
                    this.removeFromForeground();
                }
            });
        },
        bringToForeground(event, svgElement, imageElement, item, index) {
            let useEls = this.$el.querySelectorAll(".c-imagery__contents use");
            if (useEls.length <= 0
              || (`#${this.getNSAttributesForElement(event.currentTarget, 'id')}` !== this.getNSAttributesForElement(useEls[0], 'href'))) {
                this.removeFromForeground();

                let borderEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');

                // Border for the highlighted element
                this.setNSAttributesForElement(borderEl, {
                    x: this.xScale(item.time),
                    y: 0,
                    rx: 0,
                    width: String(ROW_HEIGHT + 2),
                    height: String(ROW_HEIGHT),
                    stroke: DEFAULT_COLOR,
                    id: `border-${imageElement.id}`
                });
                svgElement.appendChild(borderEl);

                let useElement = document.createElementNS('http://www.w3.org/2000/svg', 'use');
                this.setNSAttributesForElement(useElement, {
                    x: 0,
                    fill: DEFAULT_COLOR,
                    href: `#${imageElement.id}`
                });
                useElement.addEventListener('click', () => {
                    this.expand(item, index);
                });
                svgElement.appendChild(useElement);
            }
        },
        removeFromForeground() {
            let useEls = this.$el.querySelectorAll(".c-imagery__contents use");
            useEls.forEach(item => item.remove());
            let borderEls = this.$el.querySelectorAll(".c-imagery__contents rect[id*=border]");
            borderEls.forEach(item => item.remove());
        }
    }
};
</script>
