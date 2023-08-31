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
    ref="compassRoseWrapper"
    class="w-direction-rose"
    :class="compassRoseSizingClasses"
    @click="toggleLockCompass"
  >
    <svg ref="compassRoseSvg" class="c-compass-rose-svg" viewBox="0 0 100 100">
      <mask
        id="mask0"
        mask-type="alpha"
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="100"
        height="100"
      >
        <circle cx="50" cy="50" r="50" fill="black" />
      </mask>
      <g class="c-cr__compass-wrapper">
        <g class="c-cr__compass-main" mask="url(#mask0)">
          <!-- Background and clipped elements -->
          <rect class="c-cr__bg" width="100" height="100" fill="black" />
          <rect class="c-cr__edge" width="100" height="100" fill="url(#gradient_edge)" />
          <rect
            v-if="hasSunHeading"
            class="c-cr__sun"
            width="100"
            height="100"
            fill="url(#gradient_sun)"
            :style="sunHeadingStyle"
          />

          <mask
            id="mask2"
            class="c-cr__cam-fov-l-mask"
            mask-type="alpha"
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="50"
            height="100"
          >
            <rect width="51" height="100" />
          </mask>
          <mask
            id="mask1"
            class="c-cr__cam-fov-r-mask"
            mask-type="alpha"
            maskUnits="userSpaceOnUse"
            x="50"
            y="0"
            width="50"
            height="100"
          >
            <rect x="49" width="51" height="100" />
          </mask>
          <g class="c-cr-cam-and-body" :style="cameraHeadingStyle">
            <!-- Equipment (spacecraft) body holder. Transforms relative to the camera position. -->
            <g v-if="hasHeading" class="cr-vrover" :style="camAngleAndPositionStyle">
              <!-- Equipment body. Rotates relative to the camera pan value for cameras that gimble. -->
              <path
                class="cr-vrover__body"
                :style="gimbledCameraPanStyle"
                x
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M5 0C2.23858 0 0 2.23858 0 5V95C0 97.7614 2.23858 100 5 100H95C97.7614 100 100 97.7614 100 95V5C100 2.23858 97.7614 0 95 0H5ZM85 59L50 24L15 59H33V75H67.0455V59H85Z"
              />
            </g>

            <!-- Camera FOV -->
            <g class="c-cr__cam-fov">
              <g mask="url(#mask2)">
                <rect
                  class="c-cr__cam-fov-r"
                  x="49"
                  width="51"
                  height="100"
                  :style="cameraFOVStyleRightHalf"
                />
              </g>
              <g mask="url(#mask1)">
                <rect
                  class="c-cr__cam-fov-l"
                  width="51"
                  height="100"
                  :style="cameraFOVStyleLeftHalf"
                />
              </g>
              <polygon class="c-cr__cam" points="0,0 100,0 70,40 70,100 30,100 30,40" />
            </g>
          </g>
        </g>

        <!-- NSEW and ticks -->
        <g class="c-cr__nsew" :style="compassDialStyle">
          <g class="c-cr__ticks-major">
            <path d="M50 3L43 10H57L50 3Z" />
            <path d="M4 51V49H10V51H4Z" class="--hide-min" />
            <path d="M49 96V90H51V96H49Z" class="--hide-min" />
            <path d="M90 49V51H96V49H90Z" class="--hide-min" />
          </g>
          <g class="c-cr__ticks-minor --hide-small">
            <path d="M4 51V49H10V51H4Z" />
            <path d="M90 51V49H96V51H90Z" />
            <path d="M51 96H49V90H51V96Z" />
            <path d="M51 10L49 10V4L51 4V10Z" />
          </g>
          <g class="c-cr__nsew-text">
            <path
              :style="cardinalTextRotateW"
              class="c-cr__nsew-w --hide-small"
              d="M56.7418 45.004H54.1378L52.7238 52.312H52.6958L51.2258 45.004H48.7758L47.3058 52.312H47.2778L45.8638 45.004H43.2598L45.9618 55H48.6078L49.9798 48.112H50.0078L51.3798 55H53.9838L56.7418 45.004Z"
            />
            <path
              :style="cardinalTextRotateE"
              class="c-cr__nsew-e --hide-small"
              d="M46.104 55H54.21V52.76H48.708V50.856H53.608V48.84H48.708V47.09H54.07V45.004H46.104V55Z"
            />
            <path
              :style="cardinalTextRotateS"
              class="c-cr__nsew-s --hide-small"
              d="M45.6531 51.64C45.6671 54.202 47.6971 55.21 49.9931 55.21C52.1911 55.21 54.3471 54.398 54.3471 51.864C54.3471 50.058 52.8911 49.386 51.4491 48.98C49.9931 48.574 48.5511 48.434 48.5511 47.664C48.5511 47.006 49.2511 46.81 49.8111 46.81C50.6091 46.81 51.4631 47.104 51.4211 48.014H54.0251C54.0111 45.76 52.0091 44.794 50.0211 44.794C48.1451 44.794 45.9471 45.648 45.9471 47.832C45.9471 49.666 47.4451 50.31 48.8731 50.716C50.3151 51.122 51.7431 51.29 51.7431 52.172C51.7431 52.914 50.9311 53.194 50.1471 53.194C49.0411 53.194 48.3131 52.816 48.2571 51.64H45.6531Z"
            />
            <path
              :style="cardinalTextRotateN"
              class="c-cr__nsew-n"
              d="M42.5935 60H46.7935V49.32H46.8415L52.7935 60H57.3775V42.864H53.1775V53.424H53.1295L47.1775 42.864H42.5935V60Z"
            />
          </g>
        </g>
      </g>
      <defs>
        <radialGradient
          id="gradient_edge"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(50 50) rotate(90) scale(50)"
        >
          <stop offset="0.6" stop-opacity="0" />
          <stop offset="1" stop-color="white" />
        </radialGradient>
        <radialGradient
          id="gradient_sun"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(50 -7) rotate(-90) scale(18.5)"
        >
          <stop offset="0.7" stop-color="#FFCC00" />
          <stop offset="0.7" stop-color="#FFCC00" stop-opacity="0.6" />
          <stop offset="1" stop-color="#FF6600" stop-opacity="0" />
        </radialGradient>
      </defs>
    </svg>
  </div>
</template>

<script>
import { rotate } from './utils';
import { throttle } from 'lodash';

export default {
  props: {
    cameraAngleOfView: {
      type: Number,
      required: true
    },
    heading: {
      type: Number,
      required: true
    },
    cameraAzimuth: {
      type: Number,
      default: undefined
    },
    transformations: {
      type: Object,
      required: true
    },
    hasGimble: {
      type: Boolean,
      required: true
    },
    normalizedCameraAzimuth: {
      type: Number,
      required: true
    },
    sunHeading: {
      type: Number,
      default: undefined
    },
    sizedImageDimensions: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      lockCompass: true
    };
  },
  computed: {
    camAngleAndPositionStyle() {
      const translateX = this.transformations?.translateX;
      const translateY = this.transformations?.translateY;
      const rotation = this.transformations?.rotation;
      const scale = this.transformations?.scale;

      return {
        transform: `translate(${translateX}%, ${translateY}%) rotate(${rotation}deg) scale(${scale})`
      };
    },
    gimbledCameraPanStyle() {
      if (!this.hasGimble) {
        return;
      }

      const gimbledCameraPan = rotate(this.normalizedCameraAzimuth, -this.heading);

      return {
        transform: `rotate(${-gimbledCameraPan}deg)`
      };
    },
    compassDialStyle() {
      return { transform: `rotate(${this.north}deg)` };
    },
    north() {
      return this.lockCompass ? rotate(-this.normalizedCameraAzimuth) : 0;
    },
    cardinalTextRotateN() {
      return { transform: `translateY(-27%) rotate(${-this.north}deg)` };
    },
    cardinalTextRotateS() {
      return { transform: `translateY(30%) rotate(${-this.north}deg)` };
    },
    cardinalTextRotateE() {
      return { transform: `translateX(30%) rotate(${-this.north}deg)` };
    },
    cardinalTextRotateW() {
      return { transform: `translateX(-30%) rotate(${-this.north}deg)` };
    },
    hasHeading() {
      return this.heading !== undefined;
    },
    hasSunHeading() {
      return this.sunHeading !== undefined;
    },
    sunHeadingStyle() {
      const rotation = rotate(this.north, this.sunHeading);

      return {
        transform: `rotate(${rotation}deg)`
      };
    },
    cameraHeadingStyle() {
      const rotation = rotate(this.north, this.normalizedCameraAzimuth);

      return {
        transform: `rotate(${rotation}deg)`
      };
    },
    // left half of camera field of view
    // rotated counter-clockwise from camera pan angle
    cameraFOVStyleLeftHalf() {
      return {
        transform: `rotate(${this.cameraAngleOfView / 2}deg)`
      };
    },
    // right half of camera field of view
    // rotated clockwise from camera pan angle
    cameraFOVStyleRightHalf() {
      return {
        transform: `rotate(${-this.cameraAngleOfView / 2}deg)`
      };
    },
    compassRoseSizingClasses() {
      let compassRoseSizingClasses = '';
      if (this.sizedImageWidth < 300) {
        compassRoseSizingClasses = '--rose-small --rose-min';
      } else if (this.sizedImageWidth < 500) {
        compassRoseSizingClasses = '--rose-small';
      } else if (this.sizedImageWidth > 1000) {
        compassRoseSizingClasses = '--rose-max';
      }

      return compassRoseSizingClasses;
    },
    sizedImageWidth() {
      return this.sizedImageDimensions.width;
    },
    sizedImageHeight() {
      return this.sizedImageDimensions.height;
    }
  },
  watch: {
    sizedImageDimensions() {
      this.debounceResizeSvg();
    }
  },
  mounted() {
    this.debounceResizeSvg = throttle(this.resizeSvg, 100);

    this.$nextTick(() => {
      this.debounceResizeSvg();
    });
  },
  methods: {
    resizeSvg() {
      const svg = this.$refs.compassRoseSvg;
      svg.setAttribute('width', this.$refs.compassRoseWrapper.clientWidth);
      svg.setAttribute('height', this.$refs.compassRoseWrapper.clientHeight);
    },
    toggleLockCompass() {
      this.lockCompass = !this.lockCompass;
    }
  }
};
</script>
