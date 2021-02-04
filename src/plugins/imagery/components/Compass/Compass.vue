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
<div
    class="c-compass"
    :style="compassDimensionsStyle"
>
    <CompassHUD
        v-if="shouldDisplayCompassHUD"
        :rover-heading="roverHeading"
        :rover-roll="roverRoll"
        :sun-heading="sunHeading"
        :camera-field-of-view="cameraFieldOfView"
        :camera-pan="cameraPan"
    />
    <CompassRose
        v-if="shouldDisplayCompassRose"
        :rover-heading="roverHeading"
        :sun-heading="sunHeading"
        :camera-field-of-view="cameraFieldOfView"
        :camera-pan="cameraPan"
    />
</div>
</template>

<script>
import CompassHUD from './CompassHUD.vue';
import CompassRose from './CompassRose.vue';

const CAM_FIELD_OF_VIEW = 70;

export default {
    components: {
        CompassHUD,
        CompassRose
    },
    props: {
        containerWidth: {
            type: Number,
            required: true
        },
        containerHeight: {
            type: Number,
            required: true
        },
        naturalAspectRatio: {
            type: Number,
            required: true
        },
        image: {
            type: Object,
            required: true
        }
    },
    computed: {
        shouldDisplayCompassRose() {
            return this.roverHeading !== undefined;
        },
        shouldDisplayCompassHUD() {
            return this.roverHeading !== undefined;
        },
        // degrees from north heading
        roverHeading() {
            return this.image['Rover Heading'];
        },
        roverRoll() {
            return this.image['Rover Roll'];
        },
        roverYaw() {
            return this.image['Rover Yaw'];
        },
        roverPitch() {
            return this.image['Rover Pitch'];
        },
        // degrees from north heading
        sunHeading() {
            return this.image['Sun Orientation'];
        },
        // degrees from rover heading
        cameraPan() {
            return this.image['Camera Pan'];
        },
        cameraTilt() {
            return this.image['Camera Tilt'];
        },
        cameraFieldOfView() {
            return CAM_FIELD_OF_VIEW;
        },
        compassDimensionsStyle() {
            const containerAspectRatio = this.containerWidth / this.containerHeight;

            let width;
            let height;

            if (containerAspectRatio < this.naturalAspectRatio) {
                width = '100%';
                height = `${ this.containerWidth / this.naturalAspectRatio }px`;
            } else {
                width = `${ this.containerHeight * this.naturalAspectRatio }px`;
                height = '100%';
            }

            return {
                width: width,
                height: height
            };
        }
    }
};
</script>
