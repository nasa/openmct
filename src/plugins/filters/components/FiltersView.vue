<template>
    <div>
        <template v-if="isEditing && Object.keys(children).length">
            <h2 class="c-properties__header">Filters</h2>
            <filter-object 
                v-for="(child, key) in children"
                :key="key"
                :filterObject="child">
            </filter-object>
        </template>
    </div>
</template>

<style lang="scss">

</style>

<script>
import FilterObject from './FilterObject.vue';

export default {
    components: {
        FilterObject
    },
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
                columnsWithFilters = metadata.valueMetadatas.filter((value) => value.filters),
                childObject = {
                    name: child.name,
                    domainObject: child,
                    columnsWithFilters
                };

            if (childObject.columnsWithFilters.length) {
                this.$set(this.children, keyString, childObject);
            } else {
                return;
            }
        },
        removeChildren(identifier) {
            let keyString = this.openmct.objects.makeKeyString(identifier);
            this.$delete(this.children, keyString);
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
