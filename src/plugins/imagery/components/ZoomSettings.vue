<template>
<div
    class="c-image-controls__controls-wrapper"
    @click="handleClose"
>
    <div class="c-image-controls__control c-image-controls__zoom">
        <div class="c-button-set c-button-set--strip-h">
            <button
                class="c-button t-btn-zoom-out icon-minus"
                title="Zoom out"
                @click="zoomOut"
            ></button>

            <button
                class="c-button t-btn-zoom-in icon-plus"
                title="Zoom in"
                @click="zoomIn"
            ></button>

            <button
                class="c-button t-btn-zoom-lock"
                title="Lock current zoom and pan across all images"
                :class="{'icon-unlocked': !panZoomLocked, 'icon-lock': panZoomLocked}"
                @click="toggleZoomLock"
            ></button>

            <button
                class="c-button icon-reset t-btn-zoom-reset"
                title="Remove zoom and pan"
                @click="handleResetImage"
            ></button>
        </div>
        <div class="c-image-controls__zoom-factor">x{{ formattedZoomFactor }}</div>
    </div>
    <button
        v-if="isMenu"
        class="c-click-icon icon-x t-btn-close c-switcher-menu__close-button"
    ></button>
</div>
</template>

<script>
export default {
    inject: ['openmct'],
    props: {
        zoomFactor: {
            type: Number,
            required: true
        },
        panZoomLocked: {
            type: Boolean,
            required: true
        },
        isMenu: {
            type: Boolean,
            required: false
        }
    },
    data() {
        return {
        };
    },
    computed: {
        formattedZoomFactor() {
            return Number.parseFloat(this.zoomFactor).toPrecision(2);
        }
    },
    methods: {
        handleClose(e) {
            const closeButton = e.target.classList.contains('c-switcher-menu__close-button');
            if (!closeButton) {
                e.stopPropagation();
            }
        },
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
