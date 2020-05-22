<template>
<div 
    v-if="notifications.length > 0" 
    class="c-indicator c-indicator--clickable icon-bell"
    :class="[severityClass]">
    <span 
        class="c-indicator__label"
        style="display:flex; flex-direction:column;">
        <span 
            class="angular-w">
            <button 
                @click="toggleNotificationsList(true)">
                {{notifications.length}} Notification<span v-show="notifications.length > 1">s</span>
            </button>
            <button 
                class="angular-w"
                @click="dismissAllNotifications()">
                Clear All
            </button>
        </span>
    </span>
    <span class="c-indicator__count">{{notifications.length}}</span>

    <notifications-list 
        v-if="showNotificationsOverlay"
        :notifications="notifications"
        @close="toggleNotificationsList"
        @clear-all="dismissAllNotifications"
        >
    </notifications-list>
</div>
</template>

<script>
import NotificationsList from './NotificationsList.vue';

export default {
    inject: ['openmct'],
    components: {
        NotificationsList
    },
    computed: {
        severityClass() {
            return `s-status-${this.highest.severity}`;
        }
    },
    data() {
        return {
            notifications: this.openmct.notifications.notifications,
            highest: this.openmct.notifications.highest,
            showNotificationsOverlay: false
        }
    },
    methods: {
        dismissAllNotifications() {
            this.openmct.notifications.dismissAllNotifications();
        },
        toggleNotificationsList(flag) {
            this.showNotificationsOverlay = flag;
        },
        updateNotifications() {
            this.notifications = this.openmct.notifications.notifications;
            this.highest = this.openmct.notifications.highest;
        },
        generateMockMessages() {
            for (let i = 0; i < 100; i++) {
                this.openmct.notifications.alert('Test Error Messages');
            }
        }
    },
    mounted() {
        this.openmct.notifications.on('notification', this.updateNotifications);
        this.openmct.notifications.on('dismiss-all', this.updateNotifications);

        // window.setTimeout(this.generateMockMessages, 3000)
    }
}
</script>