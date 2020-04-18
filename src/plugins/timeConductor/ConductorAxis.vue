/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2018, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
<template>
<div
    ref="axisHolder"
    class="c-conductor-axis"
    @mousedown="dragStart($event)"
>
    <div
        v-show="isZooming"
        ref="zoom"
        class="c-conductor-axis__zoom-indicator"
        :style="zoomStyle"
    ></div>
</div>
</template>

<script>

import * as d3Selection from 'd3-selection';
import * as d3Axis from 'd3-axis';
import * as d3Scale from 'd3-scale';
import utcMultiTimeFormat from './utcMultiTimeFormat.js';

const PADDING = 1;
const DEFAULT_DURATION_FORMATTER = 'duration';
const RESIZE_POLL_INTERVAL = 200;
const PIXELS_PER_TICK = 100;
const PIXELS_PER_TICK_WIDE = 200;

export default {
    inject: ['openmct'],
    props: {
        bounds: {
            type: Object,
            required: true
        },
        isFixed: {
            type: Boolean,
            required: true
        }
    },
    data() {
        return {
            isPanMode: false,
            isZooming: false,
            dragStartX: undefined,
            dragX: undefined,
            zoomStyle: {}
        }
    },
    computed: {
        isZoomMode() {
            return !this.isPanMode;
        }
    },
    watch: {
        bounds: {
            handler(bounds) {
                this.setScale();
            },
            deep: true
        }
    },
    created() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Alt') {
                this.isPanMode = true;
            }
        });
        document.addEventListener('keyup', (e) => {
            if (e.key === 'Alt') {
                this.isPanMode = false;
            }
        });
    },
    mounted() {
        let axisHolder = this.$refs.axisHolder;
        const rect = axisHolder.getBoundingClientRect();
        this.height = axisHolder.offsetHeight;
        this.left = Math.round(rect.left);
        this.width = axisHolder.clientWidth;

        let vis = d3Selection.select(axisHolder)
            .append("svg:svg")
            .attr("width", "100%")
            .attr("height", this.height);


        this.xAxis = d3Axis.axisTop();
        this.dragging = false;

        // draw x axis with labels. CSS is used to position them.
        this.axisElement = vis.append("g")
            .attr("class", "axis");

        this.setViewFromTimeSystem(this.openmct.time.timeSystem());
        this.setScale();

        //Respond to changes in conductor
        this.openmct.time.on("timeSystem", this.setViewFromTimeSystem);
        setInterval(this.resize, RESIZE_POLL_INTERVAL);
    },
    destroyed() {
    },
    methods: {
        setScale() {
            let timeSystem = this.openmct.time.timeSystem();
            let bounds = this.bounds;

            if (timeSystem.isUTCBased) {
                this.xScale.domain([new Date(bounds.start), new Date(bounds.end)]);
            } else {
                this.xScale.domain([bounds.start, bounds.end]);
            }

            this.xAxis.scale(this.xScale);

            this.xScale.range([PADDING, this.width - PADDING * 2]);
            this.axisElement.call(this.xAxis);

            if (this.width > 1800) {
                this.xAxis.ticks(this.width / PIXELS_PER_TICK_WIDE);
            } else {
                this.xAxis.ticks(this.width / PIXELS_PER_TICK);
            }

            this.msPerPixel = (bounds.end - bounds.start) / this.width;
        },
        setViewFromTimeSystem(timeSystem) {
            //The D3 scale used depends on the type of time system as d3
            // supports UTC out of the box.
            if (timeSystem.isUTCBased) {
                this.xScale = d3Scale.scaleUtc();
            } else {
                this.xScale = d3Scale.scaleLinear();
            }

            this.xAxis.scale(this.xScale);
            this.xAxis.tickFormat(utcMultiTimeFormat);
            this.axisElement.call(this.xAxis);
            this.setScale();
        },
        getActiveFormatter() {
            let timeSystem = this.openmct.time.timeSystem();

            if (this.isFixed) {
                return this.getFormatter(timeSystem.timeFormat);
            } else {
                return this.getFormatter(timeSystem.durationFormat || DEFAULT_DURATION_FORMATTER);
            }
        },
        getFormatter(key) {
            return this.openmct.telemetry.getValueFormatter({
                format: key
            }).formatter;
        },
        dragStart($event) {
            if (this.isFixed) {
                this.dragStartX = $event.clientX;

                if (this.isZoomMode) {
                    this.startZoom($event);
                }

                document.addEventListener('mousemove', this.drag);
                document.addEventListener('mouseup', this.dragEnd, {
                    once: true
                });
            }
        },
        startZoom() {
            const bounds = this.openmct.time.bounds();
            this.dragX = this.dragStartX;

            this.zoomStyle = {
                left: `${this.dragStartX - this.left}px`
            };

            this.$emit('zoomAxis', {
                start: this.scaleToBounds(this.dragStartX),
                end: bounds.end
            });
            this.isZooming = true;
        },
        scaleToBounds(value) {
            const bounds = this.openmct.time.bounds();
            const timeDelta = bounds.end - bounds.start;
            const valueDelta = value - this.left;
            const offset = valueDelta / this.width * timeDelta;
            return bounds.start + offset;
        },
        drag($event) {
            if (!this.dragging) {
                this.dragging = true;
                if (this.isPanMode) {
                    requestAnimationFrame(()=>{
                        let deltaX = $event.clientX - this.dragStartX;
                        let percX = deltaX / this.width;
                        let bounds = this.openmct.time.bounds();
                        let deltaTime = bounds.end - bounds.start;
                        let newStart = bounds.start - percX * deltaTime;
                        this.$emit('panAxis',{
                            start: newStart,
                            end: newStart + deltaTime
                        });
                    })
                } else {
                    requestAnimationFrame(() => {
                        const leftBound = this.left;
                        const rightBound = this.left + this.width;
                        const dragCurrent = $event.clientX;

                        const start = dragCurrent < leftBound
                            ? 0
                            : Math.min(dragCurrent, this.dragStartX);

                        const end = dragCurrent > rightBound
                            ? this.width
                            : Math.max(dragCurrent, this.dragStartX);



                        this.zoomStyle = {
                            left: `${start - leftBound}px`,
                            width: `${end - start}px`
                        };

                        this.$emit('zoomAxis', {
                            start: this.scaleToBounds(start),
                            end: this.scaleToBounds(end)
                        });
                    });
                }
                this.dragging = false;
            } else {
                console.log('Rejected drag due to RAF cap');
            }
        },
        dragEnd() {
            this.isZooming = false;
            this.dragStartX = undefined;
            this.dragX = undefined;
            this.zoomStyle = {};

            document.removeEventListener('mousemove', this.drag);
            this.openmct.time.bounds({
                start: this.bounds.start,
                end: this.bounds.end
            });
        },
        resize() {
            if (this.$refs.axisHolder.clientWidth !== this.width) {
                this.width = this.$refs.axisHolder.clientWidth;
                this.setScale();
            }
        }
    }

}
</script>
