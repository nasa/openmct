<template>
    <div class="t-message-list c-overlay__contents">
        <div class="c-overlay__top-bar">
            <div class="c-overlay__dialog-title">Notifications</div>
            <div class="c-overlay__dialog-hint">
                Displaying {{notifications.length}} notification<span v-show="notifications.length > 1 || notifications.length === 0">s</span>
            </div>
        </div>
        <div class="w-messages c-overlay__messages">
            <!-- <mct-include
                ng-repeat="msg in ngModel.dialog.messages | orderBy: '-'"
                key="'notification-message'" ng-model="msg.model"></mct-include> -->
        </div>
    </div>
</template>

<script>
export default {
    inject: ['openmct'],
    props: ['notifications'],
    data() {
        return {}
    },
    methods: {
        openOverlay() {
            this.overlay = this.openmct.overlays.overlay({
                element: this.$el,
                size: 'large',
                dismissable: true,
                onDestroy: () => {
                   this.$emit('close', false); 
                }
            });
        }
    },
    mounted() {
        this.openOverlay();
    }
}
</script>