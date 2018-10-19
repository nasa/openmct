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
                isAlias: this.domainObject.identifier.key !== child.location
            });
        },
        remove(child) {
            // TODO: implement remove action
            console.log('remove child? might be identifier');
        }
    }
}
