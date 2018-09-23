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
    <div class="l-axis-holder" ref="axisHolder"
        @mousedown="dragStart($event)"></div>
</template>

<style lang="scss">
    .l-axis-holder {
        user-select: none;
    }
</style>

<script>

import * as d3Selection from 'd3-selection';
import * as d3Axis from 'd3-axis';
import * as d3Scale from 'd3-scale';
import utcMultiTimeFormat from './utcMultiTimeFormat.js';

const PADDING = 1;
const DEFAULT_DURATION_FORMATTER = 'duration';

export default {
    inject: ['openmct'],
    props: {
        bounds: Object
    },
    methods: {
        setViewFromClock() {
            //this.formatter = this.getAc;
        },
        setScale() {
            let width = this.$refs.axisHolder.offsetWidth;
            let timeSystem = this.openmct.time.timeSystem();
            let bounds = this.bounds;

            if (timeSystem.isUTCBased) {
                this.xScale = this.xScale || d3Scale.scaleUtc();
                this.xScale.domain([new Date(bounds.start), new Date(bounds.end)]);
            } else {
                this.xScale = this.xScale || d3Scale.scaleLinear();
                this.xScale.domain([bounds.start, bounds.end]);
            }

            this.xAxis.scale(this.xScale);

            this.xScale.range([PADDING, width - PADDING * 2]);
            this.axisElement.call(this.xAxis);

            this.msPerPixel = (bounds.end - bounds.start) / width;
        },
        setViewFromTimeSystem(timeSystem) {
            let format = this.getActiveFormatter();
            let bounds = this.openmct.time.bounds();

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
        },
        getActiveFormatter() {
            let timeSystem = this.openmct.time.timeSystem();
            let isFixed = this.openmct.time.clock() === undefined;

            if (isFixed) {
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
        dragStart($event){
            let isFixed = this.openmct.time.clock() === undefined;
            if (isFixed){
                this.dragStartX = $event.clientX;

                document.addEventListener('mousemove', this.drag);
                document.addEventListener('mouseup', this.dragEnd, {
                    once: true
                });
            }
        },
        drag($event) {
            if (this.dragStartX !== undefined) {
                let deltaX = $event.clientX - this.dragStartX;
                let totalWidth = this.$refs.axisHolder.offsetWidth;
                let percX = deltaX / totalWidth;
                let bounds = this.openmct.time.bounds();
                let deltaTime = bounds.end - bounds.start;
                let newStart = bounds.start - percX * deltaTime;
                let panZoomBounds = {
                    start: newStart,
                    end: newStart + deltaTime
                };
                this.setScale();
                this.$emit('panZoom', panZoomBounds);
            }
        },
        dragEnd() {
            this.dragStartX = undefined;
            document.removeEventListener('mousemove', this.drag);
            this.openmct.bounds(this.bounds);
        }
    },
    watch: {
        bounds: {
            handler() {
                this.setScale();
            },
            deep: true
        }
    },
    mounted() {
        let axisHolder = this.$refs.axisHolder;
        let height = axisHolder.offsetHeight;
        let vis = d3Selection.select(axisHolder)
            .append("svg:svg")
            .attr("width", "100%")
            .attr("height", height);

        this.xAxis = d3Axis.axisTop();

        // draw x axis with labels. CSS is used to position them.
        this.axisElement = vis.append("g");

        if (this.openmct.time.timeSystem() !== undefined) {
            this.setViewFromTimeSystem(this.openmct.time.timeSystem());
            this.setScale();
        }

        //Respond to changes in conductor
        this.openmct.time.on("timeSystem", this.setViewFromTimeSystem);
        this.openmct.time.on("clock", this.setViewFromClock);
    },
    destroyed() {
    }

}
</script>
