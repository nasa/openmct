export default {
    data() {
        return {
            isStale: false
        };
    },
    beforeDestroy() {
        this.triggerUnsubscribeFromStaleness();
    },
    methods: {
        subscribeToStaleness(domainObject) {
            this.unsubscribeFromStaleness = this.openmct.telemetry.subscribeToStaleness(domainObject, (isStale) => {
                this.isStale = isStale;
            });
        },
        triggerUnsubscribeFromStaleness() {
            if (this.unsubscribeFromStaleness) {
                this.unsubscribeFromStaleness();
            }
        }
    }
};
