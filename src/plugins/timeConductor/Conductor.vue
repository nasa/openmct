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
<!-- Parent holder for time conductor. follow-mode | fixed-mode -->
<div class="holder grows flex-elem l-flex-row l-time-conductor" 
    :class="[isFixed ? 'fixed-mode' : 'realtime-mode', panning ? 'status-panning' : '']">
    <div class="flex-elem holder time-conductor-icon">
        <div class="hand-little"></div>
        <div class="hand-big"></div>
    </div>

    <div class="flex-elem holder grows l-flex-col l-time-conductor-inner">
        <!-- Holds inputs and ticks -->
        <div class="l-time-conductor-inputs-and-ticks l-row-elem flex-elem no-margin">
            <form class="l-time-conductor-inputs-holder"
                  @submit="isFixed ? setBoundsFromView(boundsModel) : setOffsetsFromView(boundsModel)">
                <span class="l-time-range-w start-w">
                    <span class="l-time-conductor-inputs">
                        <span class="l-time-range-input-w start-date">
                            <span class="title"></span>
                            <input type="text" :value="boundsModel.start">
                        </span>
                            <span class="l-time-range-input-w time-delta start-delta"
                              :class="{'hide': isFixed}">
                                -
                            <input type="text" :value="boundsModel.startOffset" @blur="setOffsetsFromView(boundsModel)">
                        </span>
                    </span>
                </span>
                <span class="l-time-range-w end-w">
                    <span class="l-time-conductor-inputs">
                        <span class="l-time-range-input-w end-date">
                            <span class="title"></span>
                            <input type="text" :value="boundsModel.end" @blur="setBoundsFromView(boundsModel)">
                        </span>
                        <span class="l-time-range-input-w time-delta end-delta"
                              :class="{'hide': isFixed}">
                                +
                            <input type="text" :value="boundsModel.endOffset">
                        </span>
                    </span>
                </span>
                <input type="submit" class="invisible">
            </form>
            <div>Axis goes here</div>
        </div>

        <!-- Holds time system and session selectors, and zoom control -->
        <div class="l-time-conductor-controls l-row-elem l-flex-row flex-elem">
            <ConductorOptions />
            <!-- Zoom control -->
            <div v-if="zoom"
                 class="l-time-conductor-zoom-w grows flex-elem l-flex-row">
                {{currentZoom}}
                <span class="time-conductor-zoom-current-range flex-elem flex-fixed holder">{{timeUnits}}</span>
                <input class="time-conductor-zoom flex-elem" type="range"
                       @mouseUp="onZoomStop(currentZoom)"
                       @change="onZoom(currentZoom)"
                       min="0.01"
                       step="0.01"
                       max="0.99" />
            </div>
        </div>

    </div>
</div>
</template>

<style lang="scss">
</style>

<script>
import ConductorOptions from './ConductorOptions.vue';

export default {
    inject: ['openmct', 'configuration'],
    data: function () {
        let bounds = this.openmct.time.bounds();
        let offsets = this.openmct.time.clockOffsets();
        let timeSystem = this.openmct.time.timeSystem();
        let formatter = this.openmct.telemetry.getValueFormatter({
            format: timeSystem.timeFormat
        });

        return {
            timeFormatter: formatter,
            boundsModel: {
                start: formatter.format(bounds.start),
                startOffset: offsets.start,
                end: formatter.format(bounds.end),
                endOffset: offsets.end
            },
            isFixed: this.openmct.time.clock() === undefined,
            panning: false,
            currentZoom: undefined,
            zoom: false
        }
    },
    methods: {
        onBoundsChange: function (bounds) {
            this.boundsModel.start = this.timeFormatter.format(bounds.start);
            this.boundsModel.end = this.timeFormatter.format(bounds.end);
        },
        setTimeSystem: function (timeSystem) {
            this.timeFormatter = this.openmct.telemetry.getValueFormatter({
                format: timeSystem.timeFormat
            });
        },
        formatTime: function (time) {
            let timeSystem = this.openmct.time.timeSystem();
            let formatter = this.openmct.telemetry.getValueFormatter({
                format: timeSystem.timeFormat
            });
            return formatter.format(time);
        }
    },
    mounted: function () {
        this.setTimeSystem(this.openmct.time.timeSystem());

        this.openmct.time.on('bounds', this.onBoundsChange);
        this.openmct.time.on('timeSystem', this.setTimeSystem);
    },
    destroyed: function () {
        this.openmct.time.off('bounds', this.onBoundsChange);
        this.openmct.time.off('timeSystem', this.setTimeSystem);
    }

}
</script>


