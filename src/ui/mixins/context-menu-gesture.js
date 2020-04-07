export default {
    inject: ['openmct'],
    props: {
        'actionsToBeSkipped': {
            type: Array,
            default() {
                return [];
            }
        },
        'objectPath': {
            type: Array,
            default() {
                return [];
            }
        }
    },
    mounted() {
        //TODO: touch support
        this.$el.addEventListener('contextmenu', this.showContextMenu);

        function updateObject(oldObject, newObject) {
            Object.assign(oldObject, newObject);
        }

        this.objectPath.forEach(object => {
            if (object) {
                this.$once('hook:destroyed',
                    this.openmct.objects.observe(object, '*', updateObject.bind(this, object)))
            }
        });
    },
    destroyed() {
        this.$el.removeEventListener('contextMenu', this.showContextMenu);
    },
    methods: {
        showContextMenu(event) {
            event.preventDefault();
            event.stopPropagation();

            const options = {
                actionsToBeSkipped: this.actionsToBeSkipped
            };
            this.openmct.contextMenu._showContextMenuForObjectPath(this.objectPath, event.clientX, event.clientY, options);
        }
    }
};
