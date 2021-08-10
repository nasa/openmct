<template>
<div class="t-message-list c-overlay__contents">
    <div class="c-overlay__top-bar">
        <div class="c-overlay__dialog-title">Notifications</div>
        <div class="c-overlay__dialog-hint">
            {{ notificationsCountDisplayMessage(notifications.length) }}
        </div>
    </div>
    <div class="w-messages c-overlay__messages">
        <notification-message
            v-for="notification in notifications"
            :key="notification.model.timestamp"
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
        return {};
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
                        callback: () => {
                            this.$emit('clear-all');
                            this.overlay.dismiss();
                        }
                    }
                ],
                onDestroy: () => {
                    this.$emit('close', false);
                }
            });
        },
        notificationsCountDisplayMessage(count) {
            if (count > 1 || count === 0) {
                return `Displaying ${count} notifications`;
            } else {
                return `Displaying ${count} notification`;
            }
        }
    }
};
</script>
