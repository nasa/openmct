<template>
<div
    class="c-compass"
    :style="compassHUDStyle"
>
    <CompassHUD
        v-if="shouldDisplayCompassHUD"
        :rover-heading="roverHeading"
        :sun-heading="sunHeading"
    />
    <CompassRose
        v-if="shouldDisplayCompassRose"
        :rover-heading="roverHeading"
        :sun-heading="sunHeading"
        :cam-field-of-view="camFieldOfView"
    />
</div>
</template>

<script>
import CompassHUD from './CompassHUD.vue';
import CompassRose from './CompassRose.vue';

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
        // degrees from north heading
        sunHeading() {
            return this.image['Sun Orientation'];
        },
        camFieldOfView() {
            return 70;
        },
        compassHUDStyle() {
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
