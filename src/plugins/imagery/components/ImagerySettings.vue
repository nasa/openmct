<template>
<div class="h-local-controls h-local-controls--overlay-content c-local-controls--show-on-hover l-flex-row c-imagery__lc"
     @click="$event.stopPropagation()"
>
    <span class="holder flex-elem grows c-imagery__lc__sliders">
        <input v-model="filters.brightness"
               class="icon-brightness"
               type="range"
               min="0"
               max="500"
               @change="notifyFiltersChanged"
               @input="notifyFiltersChanged"
        >
        <input v-model="filters.contrast"
               class="icon-contrast"
               type="range"
               min="0"
               max="500"
               @change="notifyFiltersChanged"
               @input="notifyFiltersChanged"
        >
    </span>
    <span class="holder flex-elem t-reset-btn-holder c-imagery__lc__reset-btn">
        <a class="s-icon-button icon-reset t-btn-reset"
           @click="resetFilters"
        ></a>
    </span>
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
        }
    },
    methods: {
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
}
</script>
