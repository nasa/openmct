<template>
    <ul class="tree c-tree c-properties__section" v-if="Object.keys(children).length">
        <h2 class="c-properties__header">Filters</h2>
        <filter-object 
            v-for="(child, key) in children"
            :key="key"
            :filterObject="child"
            :persistedFilters="persistedFilters[key]"
            @updateFilters="persistFilters">
        </filter-object>
    </ul>
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
        'openmct'
    ],
    data() {
        let providedObject = this.openmct.selection.get()[0][0].context.item;
        let persistedFilters = {};

        if (providedObject.configuration && providedObject.configuration.filters) {
            persistedFilters = providedObject.configuration.filters;
        }

        return {
            providedObject,
            persistedFilters,
            children: {}
        }
    },
    methods: {
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
            this.$delete(this.children, keyString);
            this.persistFilters(keyString);
        },
        persistFilters(keyString, userSelects) {
            this.persistedFilters[keyString] = userSelects;
            this.openmct.objects.mutate(this.providedObject, 'configuration.filters', this.persistedFilters);
        },
        updatePersistedFilters(filters) {
            this.persistedFilters = filters;
        }
    },
    mounted(){
        this.composition = this.openmct.composition.get(this.providedObject);
        this.composition.on('add', this.addChildren);
        this.composition.on('remove', this.removeChildren);
        this.composition.load();
        this.unobserve = this.openmct.objects.observe(this.providedObject, 'configuration.filters', this.updatePersistedFilters);
    },
    beforeDestroy() {
        this.composition.off('add', this.addChildren);
        this.composition.off('remove', this.removeChildren);
        this.unobserve();
    }
}
</script>
