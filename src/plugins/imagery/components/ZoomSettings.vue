<template>
<div class="c-image-controls__control c-image-controls__zoom icon-magnify">
    <div class="c-button-set c-button-set--strip-h">
        <button class="c-button t-btn-zoom-out icon-minus"
                title="Zoom out"
                @click="zoomOut"
        ></button>

        <button class="c-button t-btn-zoom-in icon-plus"
                title="Zoom in"
                @click="zoomIn"
        ></button>
    </div>

    <button class="c-button t-btn-zoom-lock"
            title="Lock current zoom and pan across all images"
            :class="{'icon-unlocked': !panZoomLocked, 'icon-lock': panZoomLocked}"
            @click="toggleZoomLock"
    ></button>

    <button class="c-button icon-reset t-btn-zoom-reset"
            title="Remove zoom and pan"
            @click="handleResetImage"
    ></button>

    <span class="c-image-controls__zoom-factor">x{{ formattedZoomFactor }}</span>
</div>
</template>

<script>
export default {
    inject: ['openmct'],
    props: {
        formattedZoomFactor: {
            type: Number,
            required: true
        },
        panZoomLocked: {
            type: Boolean,
            required: true
        }
    },
    data() {
        return {
        };
    },
    methods: {
        handleResetImage() {
            this.$emit('handleResetImage');
        },
        toggleZoomLock() {
            this.$emit('toggleZoomLock');
        },
        zoomIn() {
            this.$emit('zoomIn');
        },
        zoomOut() {
            this.$emit('zoomOut');
        }
    }
};
</script>
