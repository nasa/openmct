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
        this.$el.addEventListener('contextmenu', this.showContextMenu);
    },
    destroyed() {
        this.$el.removeEventListener('contextMenu', this.showContextMenu);
    },
    methods: {
        showContextMenu(event) {
            this.openmct.contextMenu._showContextMenuForObjectPath(this.objectPath, event);
        }
    }
};
