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
