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
  <div class="c-compass" :style="`width: 100%; height: 100%`">
    <CompassHUD
      :camera-angle-of-view="cameraAngleOfView"
      :heading="heading"
      :camera-azimuth="cameraAzimuth"
      :transformations="transformations"
      :has-gimble="hasGimble"
      :normalized-camera-azimuth="normalizedCameraAzimuth"
      :sun-heading="sunHeading"
    />
    <CompassRose
      :camera-angle-of-view="cameraAngleOfView"
      :heading="heading"
      :camera-azimuth="cameraAzimuth"
      :transformations="transformations"
      :has-gimble="hasGimble"
      :normalized-camera-azimuth="normalizedCameraAzimuth"
      :sun-heading="sunHeading"
      :sized-image-dimensions="sizedImageDimensions"
    />
  </div>
</template>

<script>
import CompassHUD from './CompassHUD.vue';
import CompassRose from './CompassRose.vue';
import { rotate } from './utils';

export default {
  components: {
    CompassHUD,
    CompassRose
  },
  props: {
    image: {
      type: Object,
      required: true
    },
    sizedImageDimensions: {
      type: Object,
      required: true
    }
  },
  computed: {
    hasGimble() {
      return this.cameraAzimuth !== undefined;
    },
    // compass ordinal orientation of camera
    normalizedCameraAzimuth() {
      return this.hasGimble
        ? rotate(this.cameraAzimuth)
        : rotate(this.heading, -this.transformations.rotation || 0);
    },
    // horizontal rotation from north in degrees
    heading() {
      return this.image.heading;
    },
    hasHeading() {
      return this.heading !== undefined;
    },
    // horizontal rotation from north in degrees
    sunHeading() {
      return this.image.sunOrientation;
    },
    // horizontal rotation from north in degrees
    cameraAzimuth() {
      return this.image.cameraPan;
    },
    cameraAngleOfView() {
      return this.transformations.cameraAngleOfView;
    },
    transformations() {
      return this.image.transformations;
    }
  },
  methods: {
    toggleLockCompass() {
      this.$emit('toggle-lock-compass');
    }
  }
};
</script>
