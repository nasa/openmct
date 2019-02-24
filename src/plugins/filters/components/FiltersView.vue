<template>
    <div class="c-properties">
        <template v-if="isEditing">
            <div class="c-properties__header">Filters</div>
            <ul class="c-properties__section">
                <li class="c-properties__row"
                    v-for="(child, key) in children"
                    :key="key">
                    <div v-if="child">
                        <div class="c-properties__label" title="name">Name</div>
                        <div class="c-properties__value">{{child.name}}</div>
                        <ul class="c-properties__section">
                            <li class="c-properties__row"
                                v-for="value in child.valuesWithFilters"
                                :key="value.key">
                                <div class="c-properties__label" title="name">Value</div>
                                <div class="c-properties__value">{{value.name}}</div>
                            </li>
                        </ul>
                    </div>
                </li>
            </ul>
        </template>
    </div>
</template>

<style lang="scss">

</style>

<script>
export default {
    inject: [
        'openmct',
        'providedObject'
    ],
    data() {
        return {
            isEditing: openmct.editor.isEditing(),
            children: {}
        }
    },
    methods: {
        toggleIsEditing(isEditing) {
            this.isEditing = isEditing;
        },
        addChildren(child) {
            let keyString = this.openmct.objects.makeKeyString(child.identifier),
                metadata = this.openmct.telemetry.getMetadata(child),
                valuesWithFilters = metadata.valueMetadatas.filter((value) => value.filters),
                childObject = {
                    name: child.name,
                    domainObject: child,
                    valuesWithFilters
                };

            if (childObject.valuesWithFilters.length) {
                this.$set(this.children, keyString, childObject);
            } else {
                return;
            }
        },
        removeChildren(identifier) {
            let keyString = this.openmct.objects.makeKeyString(identifier);
            this.$set(this.children, keyString, undefined);
        }
    },
    mounted(){
        this.openmct.editor.on('isEditing', this.toggleIsEditing);
        this.composition = this.openmct.composition.get(this.providedObject);
        this.composition.on('add', this.addChildren);
        this.composition.on('remove', this.removeChildren);
        this.composition.load();
    },
    beforeDestroy() {
        this.openmct.editor.off('isEditing', this.toggleIsEditing);
        this.composition.off('add', this.addChildren);
        this.composition.off('remove', this.removeChildren);
    }
}
</script>
