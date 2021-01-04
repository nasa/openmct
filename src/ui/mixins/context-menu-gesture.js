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
            if (oldObject.name == 'drag n drop sg') console.log({ oldObject, newObject});
            Object.assign(oldObject, newObject);
        }

        if (!this.liteObject) {
            this.objectPath.forEach(object => {
                if (object) {
                    this.$once('hook:destroyed',
                        this.openmct.objects.observe(object, '*', updateObject.bind(this, object)));
                }
            });
        }
    },
    destroyed() {
        this.$el.removeEventListener('contextMenu', this.showContextMenu);
    },
    methods: {
        async showContextMenu(event) {
            event.preventDefault();
            event.stopPropagation();

            let objectPath = this.objectPath;

            if (this.liteObject && this.beforeInteraction) {
                let fullObjectInfo = await this.beforeInteraction();
                objectPath = fullObjectInfo.objectPath;
            }

            let actionsCollection = this.openmct.actions.get(objectPath);
            let actions = actionsCollection.getVisibleActions();
            let sortedActions = this.openmct.actions._groupAndSortActions(actions);

            this.openmct.menus.showMenu(event.clientX, event.clientY, sortedActions);
        }
    }
};
