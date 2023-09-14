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
    v-if="camerasWithImagesInBounds.length > 0"
    class="c-inspect-properties c-inspector__imagery-view"
  >
    <div class="c-inspect-properties__header">Imagery View</div>
    <div
      v-for="(camera, index) in camerasWithImagesInBounds"
      :key="index"
      class="c-imagery-view__camera-image-set"
    >
      <TelemetryFrame :bounds="bounds" :telemetry-object="camera">
        <div class="c-imagery-view__camera-image-list">
          <span
            v-for="(cameraImage, imageIndex) in camera.imagesInBounds"
            :key="imageIndex"
            class="c-imagery-view__camera-image"
          >
            <img :src="cameraImage.value" />
            <span class="c-imagery-view__camera-image-timestamp">
              {{ cameraImage.timestamp }}
            </span>
          </span>
        </div>
      </TelemetryFrame>
    </div>
  </div>
</template>

<script>
import TelemetryFrame from './TelemetryFrame.vue';

export default {
  components: {
    TelemetryFrame
  },
  inject: ['openmct'],
  props: {
    bounds: {
      type: Object,
      default: () => {}
    },
    telemetryKeys: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      camerasWithImagesInBounds: []
    };
  },
  watch: {
    bounds() {
      this.getCameraImagesInBounds();
    }
  },
  mounted() {
    this.getCameraImagesInBounds();
  },
  methods: {
    async getCameraImagesInBounds() {
      this.camerasWithImagesInBounds = [];
      this.cameraImagesList = [];
      const { start, end } = this.bounds;
      const cameraObjectPromises = [];
      this.telemetryKeys.forEach((telemetryKey) => {
        const cameraPromise = this.openmct.objects.get(telemetryKey);
        cameraObjectPromises.push(cameraPromise);
      });
      const cameraObjects = await Promise.all(cameraObjectPromises);

      const cameraTelemetryPromises = [];
      cameraObjects.forEach((cameraObject) => {
        const cameraTelemetryPromise = this.openmct.telemetry.request(cameraObject, {
          start,
          end
        });
        cameraTelemetryPromises.push(cameraTelemetryPromise);
      });
      const cameraImages = await Promise.all(cameraTelemetryPromises);

      cameraObjects.forEach((cameraObject, index) => {
        cameraObject.images = cameraImages[index];
      });

      cameraObjects.forEach((cameraObject) => {
        if (cameraObject.images.length > 0) {
          const imagesInBounds = cameraObject.images.filter((imageDetails) => {
            if (!imageDetails.timestamp) {
              return false;
            }
            const timestamp = Date.parse(imageDetails.timestamp);
            return timestamp >= start && timestamp <= end;
          });
          if (imagesInBounds.length > 0) {
            cameraObject.imagesInBounds = imagesInBounds;
            this.camerasWithImagesInBounds.push(cameraObject);
          }
        }
      });
    }
  }
};
</script>
