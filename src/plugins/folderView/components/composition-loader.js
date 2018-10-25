const unknownObjectType = {
    definition: {
        cssClass: 'icon-object-unknown',
        name: 'Unknown Type'
    }
};

export default {
    inject: ['openmct', 'domainObject'],
    data() {
        return {
            items: []
        };
    },
    mounted() {
        this.composition = this.openmct.composition.get(this.domainObject);
        if (!this.composition) {
            return;
        }
        this.composition.on('add', this.add);
        this.composition.on('remove', this.remove);
        this.composition.load();
    },
    destroyed() {
        if (!this.composition) {
            return;
        }
        this.composition.off('add', this.add);
        this.composition.off('remove', this.remove);
    },
    methods: {
        add(child, index, anything) {
            var type = this.openmct.types.get(child.type) || unknownObjectType;
            this.items.push({
                model: child,
                type: type.definition,
                isAlias: this.domainObject.identifier.key !== child.location,
                objectPath: [child].concat(openmct.router.path)
            });
        },
        remove(identifier) {
            this.items = this.items
                .filter((i) => {
                    return i.model.identifier.key !== identifier.key
                        || i.model.identifier.namespace !== identifier.namespace
                });
        }
    }
}
