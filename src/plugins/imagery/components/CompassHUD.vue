<template>
<div
    class="c-compass-hud__container"
    :style="compassHUDStyle"
>
    <div
        class="c-compass-hud__display"
    >
        <div
            class="c-compass-hud__dir"
            style="left: 90%"
        >N</div>
        <div
            class="c-compass-hud__dir"
            style="left: 22%"
        >NW</div>
        <div
            class="c-sun"
            style="left: 83%"
        ></div>
        <div class="c-compass-hud__range"></div>
    </div>
</div>
</template>

<script>
export default {
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
        // degrees from north heading
        roverHeading: {
            type: Number,
            required: true
        },
        // degrees from north heading
        sunHeading: {
            type: Number,
            default: undefined
        }
    },
    computed: {
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
