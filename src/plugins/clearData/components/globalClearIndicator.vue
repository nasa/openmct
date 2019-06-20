<template>
    <div class="c-indicator c-indicator--clickable icon-session">
        <span class="label c-indicator__label">
            <button @click="globalClearEmit">Clear All Data</button>
        </span>
    </div>
</template>

<script>
export default {
    inject: ['openmct'],
    methods: {
        globalClearEmit() {
            this.openmct.objectViews.emit('clear');
        }
    }
}
</script>
