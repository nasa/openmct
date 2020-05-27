<template>
<div class="t-message-list c-overlay__contents">
    <div class="c-overlay__top-bar">
        <div class="c-overlay__dialog-title">Notifications</div>
        <div class="c-overlay__dialog-hint">
            Displaying {{ notifications.length }} notification<span v-show="notifications.length > 1 || notifications.length === 0">s</span>
        </div>
    </div>
    <div class="w-messages c-overlay__messages">
        <notification-message
            v-for="(notification, index) in notifications"
            :key="index"
            :notification="notification"
        />
    </div>
</div>
</template>

<script>
import NotificationMessage from './NotificationMessage.vue';

export default {
    components: {
        NotificationMessage
    },
    inject: ['openmct'],
    props: {
        notifications: {
            type: Array,
            required: true
        }
    },
    data() {
        return {}
    },
    mounted() {
        this.openOverlay();
    },
    methods: {
        openOverlay() {
            this.overlay = this.openmct.overlays.overlay({
                element: this.$el,
                size: 'large',
                dismissable: true,
                buttons: [
                    {
                        label: 'Clear All Notifications',
                        emphasis: true,
                        callback:() => {
                            this.$emit('clear-all');
                            this.overlay.dismiss();
                        }
                    }
                ],
                onDestroy: () => {
                    this.$emit('close', false);
                }
            });
        }
    }
}
</script>
