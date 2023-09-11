<template>
<div v-if="camerasWithImagesInBounds.length > 0" class="c-inspect-properties c-inspector__imagery-view">
  <div class="c-inspect-properties__header">
    Imagery View
  </div>
  <div v-for="(camera, index) in camerasWithImagesInBounds" :key="index" class="c-imagery-view__camera-image-set">
    <TelemetryFrame :bounds="bounds" :telemetryObject="camera">
      <div class="c-imagery-view__camera-image-list">
        <span v-for="(cameraImage, imageIndex) in camera.imagesInBounds" :key="imageIndex"
          class="c-imagery-view__camera-image">
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
  inject: [
    'openmct'
  ],
  components: {
    TelemetryFrame
  },
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
      // const { start, end } = this.bounds;
      const start = 1731393638000;
      const end = 1732393738000;
      const cameraObjectPromises = [];
      this.telemetryKeys.forEach(telemetryKey => {
        const cameraPromise = this.openmct.objects.get(telemetryKey);
        cameraObjectPromises.push(cameraPromise);
      });
      const cameraObjects = await Promise.all(cameraObjectPromises);

      const cameraTelemetryPromises = [];
      cameraObjects.forEach((cameraObject) => {
        const cameraTelemetryPromise = this.openmct.telemetry
          .request(cameraObject, {
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
            if (!imageDetails.timestamp) return false;
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
