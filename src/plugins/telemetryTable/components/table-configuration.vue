<template>
<div class="grid-properties">
    <!--form class="form" -->
        <ul class="l-inspector-part">
            <h2>Table Columns</h2>
            <li class="grid-row" v-for="(title, key) in headers">
                <div class="grid-cell label" title="Show or Hide Column"><label :for="key + 'ColumnControl'">{{title}}</label></div>
                <div class="grid-cell value"><input type="checkbox" :id="key + 'ColumnControl'" :checked="configuration.hiddenColumns[key] !== true" @change="toggleColumn(key)"></div>
            </li>
        </ul>
    <!--/form -->
</div>
</template>

<style>
</style>

<script>
export default {
    inject: ['tableConfiguration', 'openmct'],
    data() {
        return {
            headers: {},
            configuration: this.tableConfiguration.getConfiguration()
        }
    },
    methods: {
        updateHeaders(headers) {
            this.headers = headers;
        },
        toggleColumn(key) {
            let isHidden = this.configuration.hiddenColumns[key] === true;

            this.configuration.hiddenColumns[key] = !isHidden;
            this.tableConfiguration.updateConfiguration(this.configuration);
        },
        addObject(domainObject) {
            this.tableConfiguration.addColumnsForObject(domainObject, true);
            this.updateHeaders(this.tableConfiguration.getAllHeaders());
        },
        removeObject(objectIdentifier) {
            this.tableConfiguration.removeColumnsForObject(objectIdentifier, true);
            this.updateHeaders(this.tableConfiguration.getAllHeaders());
        }

    },
    mounted() {
        this.unlisteners = [];
        let compositionCollection = this.openmct.composition.get(this.tableConfiguration.domainObject);

        compositionCollection.load()
            .then((composition) => {
                this.tableConfiguration.addColumnsForAllObjects(composition);
                this.updateHeaders(this.tableConfiguration.getAllHeaders());

                compositionCollection.on('add', this.addObject);
                this.unlisteners.push(compositionCollection.off.bind(compositionCollection, 'add', this.addObject));

                compositionCollection.on('remove', this.removeObject);
                this.unlisteners.push(compositionCollection.off.bind(compositionCollection, 'remove', this.removeObject));
            });
    },
    destroyed() {
        this.tableConfiguration.destroy();
        this.unlisteners.forEach((unlisten) => unlisten());
    }
}
</script>
