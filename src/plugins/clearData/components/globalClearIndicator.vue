<template>
<div class="c-indicator c-indicator--clickable icon-clear-data s-status-caution">
    <span class="label c-indicator__label">
        <button @click="globalClearEmit">Clear Data</button>
    </span>
</div>
</template>

<script>
export default {
    inject: ['openmct'],
    methods: {
        globalClearEmit() {
            this.openmct.objectViews.emit('clearData');
        }
    }
};
</script>
