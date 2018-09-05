<template>
<tr :style="{ top: rowTop }" :class="rowLimitClass">
    <td v-for="(title, key, headerIndex) in headers"
        :style="{ width: columnWidths[headerIndex], 'max-width': columnWidths[headerIndex]}"
        :title="formattedRow[key]"
        :class="cellLimitClasses[key]">{{formattedRow[key]}}</td>
</tr>
</template>

<style>
</style>

<script>
export default {
    data: function () {
        return {
            rowTop: (this.rowOffset + this.rowIndex) * this.rowHeight + 'px',
            formattedRow: this.row.getFormattedDatum(),
            rowLimitClass: this.row.getRowLimitClass(),
            cellLimitClasses: this.row.getCellLimitClasses()
        }
    },
    props: {
        headers: {
            type: Object,
            required: true
        },
        row: {
            type: Object,
            required: true
        },
        columnWidths: {
            type: Array,
            required: false,
            default: [],
        },
        rowIndex: {
            type: Number,
            required: false,
            default: undefined
        },
        rowOffset: {
            type: Number,
            required: false,
            default: 0
        },
        rowHeight: {
            type: Number,
            required: false,
            default: 0
        },
        configuration: {
            type: Object,
            required: true
        }
    },
    methods: {
        calculateRowTop: function (rowOffset) {
            this.rowTop = (rowOffset + this.rowIndex) * this.rowHeight + 'px';
        },
        formatRow: function (row) {
            this.formattedRow = row.getFormattedDatum();
            this.rowLimitClass = row.getRowLimitClass();
            this.cellLimitClasses = row.getCellLimitClasses();
        }
    },
    // TODO: use computed properties
    watch: {
        rowOffset: 'calculateRowTop',
        row: {
            handler: 'formatRow',
            deep: false
        }
    }
}
</script>
