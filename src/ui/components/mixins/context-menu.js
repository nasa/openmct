export default {
    inject: ['openmct'],
    props: {
        'objectPath': {
            type: Array,
            default() {
                return [];
            }
        },
        'leftClick': {
            type: Boolean,
            default() {
                return false;
            }
        }
    },
    mounted() {
        // TODO: handle mobile context menu listeners.

        if (this.leftClick) {
            this.$el.addEventListener('click', this.showContextMenu);
        } else {
            this.$el.addEventListener('contextmenu', this.showContextMenu);
        }

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
        if (this.rightclick) {
            this.$el.removeEventListener('click', this.showContextMenu);
        } else {
            this.$el.removeEventListener('contextmenu', this.showContextMenu);
        }
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
