export default {
    inject: ['openmct'],
    props: {
        'objectPath': {
            type: Array,
            default() {
                return [];
            }
        }
    },
    mounted() {
        // TODO: handle mobile contet menu listeners.
        this.$el.addEventListener('contextmenu', this.showContextMenu);
        this.objectPath.forEach((o, i) => {
            let removeListener = this.openmct.objects.observe(
                o,
                '*',
                (newDomainObject) => {
                    this.objectPath.splice(i, 1, newDomainObject);
                }
            );
            this.$once('hook:destroyed', removeListener);
        });
    },
    destroyed() {
        this.$el.removeEventListener('contextmenu', this.showContextMenu);
    },
    methods: {
        showContextMenu(event) {
            let legacyObject = this.openmct.legacyObject(this.objectPath);
            legacyObject.getCapability('action').perform({
                key: 'menu',
                domainObject: legacyObject,
                event: event
            });
        }
    }
};
