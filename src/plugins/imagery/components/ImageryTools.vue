<!--
 Open MCT, Copyright (c) 2014-2026, United States Government
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
    role="dialog"
    aria-label="Imagery Tools Container"
    class="l-imagery-tools-window js-imagery-tools-window c-measuring-tool"
  >
    <div
      class="l-imagery-tools-window__object-view js-notebook-snapshot-item c-measuring-tool__main"
    >
      <div ref="objectView" class="c-notebook-snapshot__image c-measuring-tool__image-wrapper">
        <div
          class="c-measuring-tool__image"
          :style="{ backgroundImage: `url(${viewImageUrl})` }"
        ></div>
      </div>
      <div class="c-measuring-tool__sidebar">
        <div class="__header c-object-label__name">
          Measuring:
          <span v-if="isScaling"
            ><span class="mt__point">A</span> <span class="icon-arrow-right"></span>
            <span class="mt__point">B</span></span
          >
          <span v-else
            >Rover <span class="icon-arrow-right"></span> <span class="mt__point">B</span></span
          >
        </div>
        <div
          class="__properties c-inspect-properties"
          aria-label="Measuring Tool Properties Details"
        >
          <div class="c-inspect-properties__header">Points</div>
          <ul class="c-inspect-properties__section">
            <li class="c-inspect-properties__row" aria-label="Range">
              <div class="c-inspect-properties__label" aria-label="inspector property name">
                {{ isScaling ? 'Scale' : 'Range' }}
              </div>
              <div class="c-inspect-properties__value" aria-label="inspector property value">
                0.269 m
              </div>
            </li>
            <li class="c-inspect-properties__row" aria-label="Heading">
              <div class="c-inspect-properties__label" aria-label="inspector property name">
                Heading
              </div>
              <div class="c-inspect-properties__value" aria-label="inspector property value">
                334 deg
              </div>
            </li>
            <li class="c-inspect-properties__row" aria-label="Slope">
              <div class="c-inspect-properties__label" aria-label="inspector property name">
                Slope
              </div>
              <div class="c-inspect-properties__value" aria-label="inspector property value">
                1.9 deg
              </div>
            </li>
            <li class="c-inspect-properties__row" aria-label="Elevation">
              <div class="c-inspect-properties__label" aria-label="inspector property name">
                Elevation
              </div>
              <div class="c-inspect-properties__value" aria-label="inspector property value">
                0.009 m
              </div>
            </li>
          </ul>
          <div class="c-inspect-properties__header">Rover and Camera</div>
          <ul class="c-inspect-properties__section">
            <li class="c-inspect-properties__row" aria-label="Rover Heading">
              <div class="c-inspect-properties__label" aria-label="inspector property name">
                Rover Heading
              </div>
              <div class="c-inspect-properties__value" aria-label="inspector property value">
                158 deg
              </div>
            </li>
            <li class="c-inspect-properties__row" aria-label="Camera Pan">
              <div class="c-inspect-properties__label" aria-label="inspector property name">
                Camera Pan
              </div>
              <div class="c-inspect-properties__value" aria-label="inspector property value">
                -14.3 deg
              </div>
            </li>
            <li class="c-inspect-properties__row" aria-label="Camera Tilt">
              <div class="c-inspect-properties__label" aria-label="inspector property name">
                Camera Tilt
              </div>
              <div class="c-inspect-properties__value" aria-label="inspector property value">
                -25.8 deg
              </div>
            </li>
            <li class="c-inspect-properties__row" aria-label="Auto-level">
              <div class="c-inspect-properties__label" aria-label="inspector property name">
                Auto-level
              </div>
              <div class="c-inspect-properties__value" aria-label="inspector property value">
                ON
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div class="c-measuring-tool__load-status">
      <div class="mt__status-title">Data Load Status</div>
      <div
        class="mt__status --good"
        ref="status-disparity-map"
        title="Disparity Map loaded successfully."
      >
        Disparity Map
      </div>
      <div
        class="mt__status --bad"
        ref="status-camera-model"
        title="Camera Model could not be loaded, check system."
      >
        Camera Model
      </div>
    </div>
  </div>
</template>

<script>
export default {
  inject: ['openmct', 'domainObject'],
  props: {
    viewImageUrl: {
      type: String,
      required: true
    },
    isScaling: {
      type: Boolean,
      default: true
    }
  },
  mounted() {},
  beforeUnmount() {},
  unmounted() {
    //TODO: Close window and go back to calling parent view
  },
  methods: {}
};
</script>
