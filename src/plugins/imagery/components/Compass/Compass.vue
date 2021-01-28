<template>
<div
    class="c-compass"
    :style="compassDimensionsStyle"
>
    <CompassHUD
        v-if="shouldDisplayCompassHUD"
        :rover-heading="roverHeading"
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
