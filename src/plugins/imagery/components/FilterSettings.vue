<template>
<div
    class="c-control-menu c-menu--to-left c-menu--has-close-btn c-image-controls c-image-controls--filters"
    @click="handleClose"
>
    <div
        class="c-image-controls__controls"
        @click="$event.stopPropagation()"
    >
        <span class="c-image-controls__sliders">
            <div class="c-image-controls__slider-wrapper icon-brightness">
                <input
                    v-model="filters.brightness"
                    type="range"
                    min="0"
                    max="500"
                    @change="notifyFiltersChanged"
                    @input="notifyFiltersChanged"
                >
            </div>
            <div class="c-image-controls__slider-wrapper icon-contrast">
                <input
                    v-model="filters.contrast"
                    type="range"
                    min="0"
                    max="500"
                    @change="notifyFiltersChanged"
                    @input="notifyFiltersChanged"
                >
            </div>
        </span>
        <span class="c-image-controls__reset-btn">
            <a
                class="s-icon-button icon-reset t-btn-reset"
                @click="resetFilters"
            ></a>
        </span>
    </div>

    <button class="c-click-icon icon-x t-btn-close c-switcher-menu__close-button"></button>
</div>
</template>

<script>
export default {
    inject: ['openmct'],
    data() {
        return {
            filters: {
                brightness: 100,
                contrast: 100
            }
        };
    },
    methods: {
        handleClose(e) {
            const closeButton = e.target.classList.contains('c-switcher-menu__close-button');
            if (!closeButton) {
                e.stopPropagation();
            }
        },
        notifyFiltersChanged() {
            this.$emit('filterChanged', this.filters);
        },
        resetFilters() {
            this.filters = {
                brightness: 100,
                contrast: 100
            };
            this.notifyFiltersChanged();
        }
    }
};
</script>
