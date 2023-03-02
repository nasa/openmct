<template>
<div class="c-inspect-properties">
    <template v-if="isEditing">
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

export default {
    inject: ['openmct', 'ladTableConfiguration'],
    data() {
        return {
            headers: {
                timestamp: 'timestamp',
                units: 'units'
            },
            isEditing: this.openmct.editor.isEditing(),
            configuration: this.ladTableConfiguration.getConfiguration(),
            items: [],
            ladTableObjects: [],
            ladTelemetryObjects: {}
        };
    },
    mounted() {
        this.openmct.editor.on('isEditing', this.toggleEdit);
        this.composition = this.openmct.composition.get(this.ladTableConfiguration.domainObject);
        this.shouldShowUnitsCheckbox();

        if (this.ladTableConfiguration.domainObject.type === 'LadTable') {
            this.composition.on('add', this.addItem);
            this.composition.on('remove', this.removeItem);
        } else {
            this.composition.on('add', this.addLadTable);
            this.composition.on('remove', this.removeLadTable);
        }

        this.composition.load();
    },
    destroyed() {
        this.ladTableConfiguration.destroy();
        this.openmct.editor.off('isEditing', this.toggleEdit);

        if (this.ladTableConfiguration.domainObject.type === 'LadTable') {
            this.composition.off('add', this.addItem);
            this.composition.off('remove', this.removeItem);
        } else {
            this.composition.off('add', this.addLadTable);
            this.composition.off('remove', this.removeLadTable);
        }
    },
    methods: {
        addItem(domainObject) {
            let item = {};
            item.domainObject = domainObject;
            item.key = this.openmct.objects.makeKeyString(domainObject.identifier);

            this.items.push(item);

            this.shouldShowUnitsCheckbox();
        },
        removeItem(identifier) {
            const keystring = this.openmct.objects.makeKeyString(identifier);
            const index = this.items.findIndex(item => keystring === item.key);

            this.items.splice(index, 1);

            this.shouldShowUnitsCheckbox();
        },
        addLadTable(domainObject) {
            let ladTable = {};
            ladTable.domainObject = domainObject;
            ladTable.key = this.openmct.objects.makeKeyString(domainObject.identifier);

            this.$set(this.ladTelemetryObjects, ladTable.key, []);
            this.ladTableObjects.push(ladTable);

            let composition = this.openmct.composition.get(ladTable.domainObject);
            let addCallback = this.addTelemetryObject(ladTable);
            let removeCallback = this.removeTelemetryObject(ladTable);

            composition.on('add', addCallback);
            composition.on('remove', removeCallback);
            composition.load();

            this.compositions.push({
                composition,
                addCallback,
                removeCallback
            });

            this.shouldShowUnitsCheckbox();
        },
        removeLadTable(identifier) {
            let index = this.ladTableObjects.findIndex(ladTable => this.openmct.objects.makeKeyString(identifier) === ladTable.key);
            let ladTable = this.ladTableObjects[index];

            this.$delete(this.ladTelemetryObjects, ladTable.key);
            this.ladTableObjects.splice(index, 1);

            this.shouldShowUnitsCheckbox();
        },
        toggleColumn(key) {
            const isHidden = this.configuration.hiddenColumns[key] === true;

            this.configuration.hiddenColumns[key] = !isHidden;
            this.ladTableConfiguration.updateConfiguration(this.configuration);
        },
        toggleEdit(isEditing) {
            this.isEditing = isEditing;
        },
        shouldShowUnitsCheckbox() {
            let showUnitsCheckbox = false;

            if (this.ladTableConfiguration?.domainObject) {
                if (this.ladTableConfiguration.domainObject.type === 'LadTable') {
                    const itemsWithUnits = this.items.filter((item) => {
                        return this.metadataHasUnits(item.domainObject);

                    });

                    showUnitsCheckbox = itemsWithUnits.length !== 0;
                } else {
                    const ladTables = Object.values(this.ladTelemetryObjects);

                    for (const ladTable of ladTables) {
                        for (const telemetryObject of ladTable) {
                            showUnitsCheckbox = this.metadataHasUnits(telemetryObject.domainObject);
                        }
                    }
                }
            }

            if (showUnitsCheckbox && this.headers.units === undefined) {
                this.$set(this.headers, 'units', 'units');
            }

            if (!showUnitsCheckbox && this.headers?.units) {
                this.$delete(this.headers, 'units');
            }
        },
        metadataHasUnits(domainObject) {
            const metadata = this.openmct.telemetry.getMetadata(domainObject);
            const valueMetadatas = metadata ? metadata.valueMetadatas : [];
            const metadataWithUnits = valueMetadatas.filter(metadatum => metadatum.unit);

            return metadataWithUnits.length > 0;
        },
    }
};
</script>
