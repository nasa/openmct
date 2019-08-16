<template>
<div class="c-properties">
    <template v-if="isEditing">
        <div class="c-properties__header">Table Column Size</div>
        <ul class="c-properties__section">
            <li class="c-properties__row">
                <div class="c-properties__label" title="Auto-size table"><label for="AutoSizeControl">Auto-size</label></div>
                <div class="c-properties__value"><input type="checkbox" id="AutoSizeControl" :checked="configuration.autosize !== false" @change="toggleAutosize()"></div>            
            </li>
        </ul>
        <div class="c-properties__header">Table Column Visibility</div>
        <ul class="c-properties__section">
            <li class="c-properties__row" v-for="(title, key) in headers">
                <div class="c-properties__label" title="Show or hide column"><label :for="key + 'ColumnControl'">{{title}}</label></div>
                <div class="c-properties__value"><input type="checkbox" :id="key + 'ColumnControl'" :checked="configuration.hiddenColumns[key] !== true" @change="toggleColumn(key)"></div>
            </li>
        </ul>
    </template>
</div>
</template>

<style>
</style>

<script>
import TelemetryTableColumn from '../TelemetryTableColumn';

export default {
    inject: ['tableConfiguration', 'openmct'],
    data() {
        return {
            headers: {},
            isEditing: this.openmct.editor.isEditing(),
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
                this.addColumnsForObject(domainObject, true);
            this.updateHeaders(this.tableConfiguration.getAllHeaders());
        },
        removeObject(objectIdentifier) {
            this.tableConfiguration.removeColumnsForObject(objectIdentifier, true);
            this.updateHeaders(this.tableConfiguration.getAllHeaders());
        },
        toggleEdit(isEditing) {
            this.isEditing = isEditing;
        },
        toggleAutosize() {
            this.configuration.autosize = !this.configuration.autosize;
            this.tableConfiguration.updateConfiguration(this.configuration);
        },
        addColumnsForAllObjects(objects) {
            objects.forEach(object => this.addColumnsForObject(object, false));
        },
        addColumnsForObject(telemetryObject) {
            let metadataValues = this.openmct.telemetry.getMetadata(telemetryObject).values();

            metadataValues.forEach(metadatum => {
                let column = new TelemetryTableColumn(this.openmct, metadatum);
                this.tableConfiguration.addSingleColumnForObject(telemetryObject, column);
            });
        }
    },
    mounted() {
        this.unlisteners = [];
        this.openmct.editor.on('isEditing', this.toggleEdit);
        let compositionCollection = this.openmct.composition.get(this.tableConfiguration.domainObject);

        compositionCollection.load()
            .then((composition) => {
                this.addColumnsForAllObjects(composition);
                this.updateHeaders(this.tableConfiguration.getAllHeaders());

                compositionCollection.on('add', this.addObject);
                this.unlisteners.push(compositionCollection.off.bind(compositionCollection, 'add', this.addObject));

                compositionCollection.on('remove', this.removeObject);
                this.unlisteners.push(compositionCollection.off.bind(compositionCollection, 'remove', this.removeObject));
            });
    },
    destroyed() {
        this.tableConfiguration.destroy();
        this.openmct.editor.off('isEditing', this.toggleEdit);
        this.unlisteners.forEach((unlisten) => unlisten());
    }
}
</script>
