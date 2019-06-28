<template>
    <ul class="tree c-tree c-properties__section" v-if="Object.keys(children).length">
        <h2 class="c-properties__header">Data Filters</h2>
        <global-filters
            :globalFilters="globalFilters"
            :globalObject="globalObject"
            @persistGlobalFilters="persistGlobalFilters">
        </global-filters>
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
import GlobalFilters from './GlobalFilters.vue'

export default {
    components: {
        FilterObject,
        GlobalFilters
    },
    inject: [
        'openmct'
    ],
    data() {
        let providedObject = this.openmct.selection.get()[0][0].context.item;
        let configuration = providedObject.configuration;
        let persistedFilters = {};
        let globalFilters = {};

        if (providedObject.configuration && providedObject.configuration.filters) {
            persistedFilters = providedObject.configuration.filters;
        }

        if (configuration && configuration.globalFilters) {
            globalFilters = configuration.globalFilters;
        }

        return {
            providedObject,
            persistedFilters,
            globalFilters,
            globalObject: {},
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
            }

            valuesWithFilters.forEach(field => {
                if (!this.globalFilters[field.key]) {
                    this.globalFilters[field.key] = {};                    
                }
                this.globalObject[field.key] = field;
            });
        },
        removeChildren(identifier) {
            let keyString = this.openmct.objects.makeKeyString(identifier);
            this.$delete(this.children, keyString);
            this.persistFilters(keyString);
            // TODO: make sure globalFitlers is updated with the removed object filters
        },
        persistFilters(keyString, userSelects) {
            this.persistedFilters[keyString] = userSelects;
            this.openmct.objects.mutate(this.providedObject, 'configuration.filters', this.persistedFilters);
        },
        updatePersistedFilters(filters) {
            this.persistedFilters = filters;
        },
        persistGlobalFilters(key, userSelects) {
            this.globalFilters[key] = userSelects[key];
            this.openmct.objects.mutate(this.providedObject, 'configuration.globalFilters', this.globalFilters);

            Object.keys(this.children).forEach(keyString => {
                if (this.persistedFilters[keyString].useGlobal !== false && this.containsField(keyString, key)) {
                    if (!this.persistedFilters[keyString][key]) {
                        this.$set(this.persistedFilters[keyString], key, {});
                    }

                    this.persistedFilters[keyString][key] = userSelects[key];
                }
            });
            this.openmct.objects.mutate(this.providedObject, 'configuration.filters', this.persistedFilters);
        },
        updateGlobalFilters(filters) {
            this.globalFilters = filters;
        },
        containsField(keyString, field) {
            let hasField = false;
            this.children[keyString].valuesWithFilters.forEach(value => {
                if (value.key === field) {
                    hasField = true;
                    return;
                }
            });
            return hasField;
        }
    },
    mounted(){
        this.composition = this.openmct.composition.get(this.providedObject);
        this.composition.on('add', this.addChildren);
        this.composition.on('remove', this.removeChildren);
        this.composition.load();
        this.unobserve = this.openmct.objects.observe(this.providedObject, 'configuration.filters', this.updatePersistedFilters);
        this.unobserveGlobalFilters = this.openmct.objects.observe(this.providedObject, 'configuration.globalFilters', this.updateGlobalFilters);
        this.unobserveAllMutation = this.openmct.objects.observe(this.providedObject, '*', (mutatedObject) => this.providedObject = mutatedObject);
    },
    beforeDestroy() {
        this.composition.off('add', this.addChildren);
        this.composition.off('remove', this.removeChildren);
        this.unobserve();
        this.unobserveGlobalFilters();
        this.unobserveAllMutation();
    }
}
</script>
