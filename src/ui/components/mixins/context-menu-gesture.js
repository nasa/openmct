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
        //TODO: touch support
        this.$el.addEventListener('contextmenu', this.showContextMenu);

        function updateObject(oldObject, newObject) {
            Object.assign(oldObject, newObject);
        }

        this.objectPath.forEach(object => this.$once('hook:destroy',
            this.openmct.objects.observe(object, '*', updateObject.bind(this, object)))
        );
    },
    destroyed() {
        this.$el.removeEventListener('contextMenu', this.showContextMenu);
    },
    methods: {
        showContextMenu(event) {
            event.preventDefault();
            this.openmct.contextMenu._showContextMenuForObjectPath(this.objectPath, event.clientX, event.clientY);
        }
    }
};
