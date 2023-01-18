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
        subscribeToStaleness(domainObject, callback) {
            this.unsubscribeFromStaleness = this.openmct.telemetry.subscribeToStaleness(domainObject, (isStale) => {
                if (callback && typeof callback === 'function') {
                    callback(isStale);
                } else {
                    this.isStale = isStale;
                }
            });
        },
        triggerUnsubscribeFromStaleness() {
            if (this.unsubscribeFromStaleness) {
                this.unsubscribeFromStaleness();
            }
        }
    }
};
