<template>
<div class="c-inspect-properties">
    <template v-if="isEditing">
        <div class="c-inspect-properties__header">
            Table Layout
        </div>
        <ul class="c-inspect-properties__section">
            <li class="c-inspect-properties__row">
                <div
                    class="c-inspect-properties__label"
                    title="Auto-size table"
                >
                    <label for="AutoSizeControl">Auto-size</label>
                </div>
                <div class="c-inspect-properties__value">
                    <input
                        id="AutoSizeControl"
                        type="checkbox"
                        :checked="configuration.autosize !== false"
                        @change="toggleAutosize()"
                    >
                </div>
            </li>
            <li class="c-inspect-properties__row">
                <div
                    class="c-inspect-properties__label"
                    title="Show or hide headers"
                >
                    <label for="header-visibility">Hide Header</label>
                </div>
                <div class="c-inspect-properties__value">
                    <input
                        id="header-visibility"
                        type="checkbox"
                        :checked="configuration.hideHeaders === true"
                        @change="toggleHeaderVisibility"
                    >
                </div>
            </li>
        </ul>
        <div class="c-inspect-properties__header">
            Table Column Visibility
        </div>
        <ul class="c-inspect-properties__section">
            <li
                v-for="(title, key) in headers"
                :key="key"
                class="c-inspect-properties__row"
            >
                <div
                    class="c-inspect-properties__label"
                    title="Show or hide column"
                >
                    <label :for="key + 'ColumnControl'">{{ title }}</label>
                </div>
                <div class="c-inspect-properties__value">
                    <input
                        :id="key + 'ColumnControl'"
                        type="checkbox"
                        :checked="configuration.hiddenColumns[key] !== true"
                        @change="toggleColumn(key)"
                    >
                </div>
            </li>
        </ul>
    </template>
</div>
</template>

<script>
import TelemetryTableColumn from '../TelemetryTableColumn';
import TelemetryTableUnitColumn from '../TelemetryTableUnitColumn';

export default {
    inject: ['tableConfiguration', 'openmct'],
    data() {
        return {
            headers: {},
            isEditing: this.openmct.editor.isEditing(),
            configuration: this.tableConfiguration.getConfiguration()
        };
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
                // if units are available, need to add columns to be hidden
                if (metadatum.unit !== undefined) {
                    let unitColumn = new TelemetryTableUnitColumn(this.openmct, metadatum);
                    this.tableConfiguration.addSingleColumnForObject(telemetryObject, unitColumn);
                }
            });
        },
        toggleHeaderVisibility() {
            let hideHeaders = this.configuration.hideHeaders;

            this.configuration.hideHeaders = !hideHeaders;
            this.tableConfiguration.updateConfiguration(this.configuration);
        }
    }
};
</script>
