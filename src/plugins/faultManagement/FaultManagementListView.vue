<template>
<div class="c-faults-list-view">
    <FaultManagementSearch
        @filterChanged="updateFilter"
    />
    <FaultManagementToolbar
        @acknowledgeSelected="toggleAcknowledgeSelected"
        @shelveSelected="toggleShelveSelected"
    />

    <FaultManagementListHeader
        class="header"
        :total-faults-count="filteredFaultsList.length"
        @selectAll="selectAll"
    />

    <template v-if="filteredFaultsList.length > 0">
        <FaultManagementListItem
            v-for="fault of filteredFaultsList"
            :key="fault.key"
            :fault="fault"
            :is-selected="isSelected(fault)"
            @toggleSelected="toggleSelected"
        />
    </template>
</div>
</template>

<script>
import FaultManagementListHeader from './FaultManagementListHeader.vue';
import FaultManagementListItem from './FaultManagementListItem.vue';
import FaultManagementSearch from './FaultManagementSearch.vue';
import FaultManagementToolbar from './FaultManagementToolbar.vue';

import { FILTER_ITEMS } from './constants';

export default {
    components: {
        FaultManagementListHeader,
        FaultManagementListItem,
        FaultManagementSearch,
        FaultManagementToolbar
    },
    inject: ['openmct', 'domainObject'],
    props: {
        faultsList: {
            type: Array,
            default: () => []
        }
    },
    data() {
        return {
            selectedFaults: {},
            filterIndex: 0
        };
    },
    computed: {
        filteredFaultsList() {
            const filterName = FILTER_ITEMS[this.filterIndex];
            if (filterName === 'Ackowledged') {
                return this.faultsList.filter(fault => fault.acknowledged);
            }

            if (filterName === 'Shelved') {
                return this.faultsList.filter(fault => fault.shelved);
            }

            return this.faultsList;
        }
    },
    watch: {},
    mounted() {},
    beforeDestroy() {},
    methods: {
        getFaultId(fault) {
            return `${fault.id.name}-${fault.id.namespace}`;
        },
        isSelected(fault) {
            return Boolean(this.selectedFaults[this.getFaultId(fault)]);
        },
        selectAll(toggle = false) {
            this.faultsList.forEach(fault => {
                const faultData = {
                    fault,
                    selected: toggle
                };
                this.toggleSelected(faultData);
            });
        },
        toggleSelected({ fault, selected = false}) {
            const faultId = this.getFaultId(fault);
            if (selected) {
                this.$set(this.selectedFaults, faultId, fault);
            } else {
                this.$delete(this.selectedFaults, faultId);
            }
        },
        toggleAcknowledgeSelected() {
            Object.values(this.selectedFaults)
                .forEach(selectedFault => {
                    this.openmct.faults.acknowledgeFault(selectedFault);
                });
        },
        toggleShelveSelected() {
            Object.values(this.selectedFaults)
                .forEach(selectedFault => {
                    this.openmct.faults.shelveFault(selectedFault);
                });
        },
        updateFilter(filter) {
            this.filterIndex = filter.model.options.findIndex(option => option.value === filter.value);
        }
    }
};
</script>

<style>
    .fault-table {
        border-collapse: collapse;
    }

    th {
        min-width: 10px;
    }

    .fault-table,
    .fault-table th,
    .fault-table td {
        border: 1px solid #ccc;
    }

    .fault-table th,
    .fault-table td {
        padding: 0.5rem;
    }

    .fault-table th {
        position: relative;
    }

    .resizer {
        position: absolute;
        top: 0;
        right: 0;
        width: 5px;
        cursor: col-resize;
        user-select: none;
    }

    .resizer:hover,
    .resizing {
        border-right: 2px solid blue;
    }

    .resizable {
        border: 1px solid gray;
        height: 100px;
        width: 100px;
        position: relative;
    }
</style>
