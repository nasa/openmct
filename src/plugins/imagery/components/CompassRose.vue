/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

<template>
<div class="c-direction-rose">
    <div
        class="c-nsew"
        :style="rotateFrameStyle"
    >
        <svg
            class="c-nsew__ticks"
            viewBox="0 0 100 100"
        >
            <polygon
                class="c-nsew__tick c-tick-n"
                points="50,0 57,5 43,5"
            />
            <rect
                class="c-nsew__tick c-tick-e"
                x="95"
                y="49"
                width="5"
                height="2"
            />
            <rect
                class="c-nsew__tick c-tick-w"
                x="0"
                y="49"
                width="5"
                height="2"
            />
            <rect
                class="c-nsew__tick c-tick-s"
                x="49"
                y="95"
                width="2"
                height="5"
            />
            <!-- text elements here must be rotated to -1 * the amount applied to `c-nsew` -->
            <text
                class="c-nsew__label c-label-n"
                text-anchor="middle"
                :transform="northTransform"
            >N</text>
            <text
                class="c-nsew__label c-label-e"
                text-anchor="middle"
                :transform="eastTransform"
            >E</text>
            <text
                class="c-nsew__label c-label-w"
                text-anchor="middle"
                :transform="southTransform"
            >W</text>
            <text
                class="c-nsew__label c-label-s"
                text-anchor="middle"
                :transform="westTransform"
            >S</text>
        </svg>
    </div>

    <div
        class="c-rover-body"
        :style="roverHeadingStyle"
    >
    </div>

    <div
        class="c-sun"
        :style="sunHeadingStyle"
    ></div>

    <div
        class="c-cam-field"
        style="transform: rotate(0deg)"
    >
        <!-- Camera FOV is handled with two elements. Set rotate for each to half of the FOV, and note that `half-l` must be a negative version of that number. For a camera FOV of 70 deg, `half-l` would be `rotate(-35deg)` and `half-r` would be `rotate(35deg)` -->
        <div class="cam-field-half cam-field-half-l">
            <div
                class="cam-field-area"
                style="transform: translateX(50%) rotate(-35deg)"
            ></div>
        </div>
        <div class="cam-field-half cam-field-half-r">
            <div
                class="cam-field-area"
                style="transform: translateX(-50%) rotate(35deg)"
            ></div>
        </div>
    </div>
</div>
</template>

<script>
export default {
    props: {
        // assumption is degrees from north
        roverHeading: {
            type: Number,
            required: true
        },
        // assumption is degrees from north
        sunHeading: {
            type: Number,
            required: true
        }
    },

    data() {
        return {
            lockBezel: false
        };
    },

    computed: {
        north() {
            return this.lockBezel ? 0 : this.getDegrees(360 - this.roverHeading);
        },
        rotateFrameStyle() {
            return { transform: `rotate(${this.north}deg)` };
        },
        northTransform() {
            return this.cardinalPointsTransform.north;
        },
        eastTransform() {
            return this.cardinalPointsTransform.east;
        },
        southTransform() {
            return this.cardinalPointsTransform.south;
        },
        westTransform() {
            return this.cardinalPointsTransform.west;
        },
        cardinalPointsTransform() {
            const rotation = `rotate(${-this.north})`;

            return {
                north: `translate(50,15) ${rotation}`,
                east: `translate(87,50) ${rotation}`,
                south: `translate(13,50) ${rotation}`,
                west: `translate(50,87) ${rotation}`
            };
        },
        roverHeadingStyle() {
            const rotation = this.getDegrees(this.north + this.roverHeading);

            return {
                transform: `translateX(-50%) rotate(${rotation}deg)`
            };
        },
        sunHeadingStyle() {
            const rotation = this.getDegrees(this.north + this.sunHeading);

            return {
                transform: `rotate(${rotation}deg)`
            };
        }
    },

    mounted() {

    },

    methods: {
        getDegrees(degrees) {
            const base = degrees % 360;

            return base >= 0 ? base : 360 + base;
        }
    }
};
</script>
