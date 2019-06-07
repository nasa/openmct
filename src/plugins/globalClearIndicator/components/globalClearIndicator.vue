<template>
    <div class="c-indicator c-indicator--clickable icon-session"
         @click="globalClearEmit">
        <span class="label">Global Clear</span>
    </div>
</template>

<script>
export default {
    inject: ['openmct'],
    methods: {
        globalClearEmit() {
            this.openmct.notifications.emit('clear');
        }
    }
}
</script>
