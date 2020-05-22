<template>
<div v-if="notifications.length > 0" 
     class="c-indicator c-indicator--clickable icon-bell"
     :class="[severityClass]">
    <span class="c-indicator__label"
         style="display:flex; flex-direction:column;">
        <span class="angular-w">
            <button @click="showNotificationsList()">
                {{notifications.length}} Notification<span v-show="notifications.length > 1">s</span>
            </button>
            <button class="angular-w"
                    @click="dismissAllNotifications()">
                Clear All
            </button>
        </span>
    </span>
    <span class="c-indicator__count">{{notifications.length}}</span>
</div>
</template>

<script>
export default {
    inject: ['openmct'],
    computed: {
        severityClass() {
            return `s-status-${this.highest.severity}`;
        }
    },
    data() {
        return {
            notifications: this.openmct.notifications.notifications,
            highest: this.openmct.notifications.highest
        }
    },
    methods: {
        dismissAllNotifications() {
            this.openmct.notifications.dismissAllNotifications();
        },
        showNotificationsList() {
            console.log('show all');
        },
        updateNotifications() {
            this.notifications = this.openmct.notifications.notifications
        },
        generateMockMessages() {
            for (let i = 0; i < 100; i++) {
                this.openmct.notifications.error('Test Error Messages');
            }
        }
    },
    mounted() {
        this.openmct.notifications.on('notification', this.updateNotifications);
        this.openmct.notifications.on('dismiss-all', this.updateNotifications);

        window.setTimeout(this.generateMockMessages, 3000)
    }
}
</script>