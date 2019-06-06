<template>
    <div class="h-indicator">
        <div class="ls-indicator icon-session"
            @click="globalClearEmit">
            <span class="label">Global Clear</span>
        </div>
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
