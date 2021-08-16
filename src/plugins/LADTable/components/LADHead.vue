<template>
<thead>
    <tr>
        <th>Name</th>
        <th>Timestamp</th>
        <th v-for="name in names"
            :key="name"
        >
            {{ name }}
        </th>
        <th v-if="hasUnits">Unit</th>
    </tr>
</thead>
</template>

<script>

export default {
    props: {
        item: {
            type: Object,
            required: true
        },
        columnNames: {
            type: Array,
            required: true
        }
    },
    data() {
        return {
            names: this.columnNames
        };
    },
    computed: {
        hasUnits() {
            // let itemsWithUnits = this.items.filter((item) => {
            //     let metadata = this.openmct.telemetry.getMetadata(item.domainObject);

            //     return this.metadataHasUnits(metadata.valueMetadatas);

            // });

            // return itemsWithUnits.length !== 0;
            return false;
        }
    },
    mounted() {
        console.log(this.names);
    }
};

</script>
