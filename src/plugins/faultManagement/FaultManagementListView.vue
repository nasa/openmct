<template>
<div class="c-faults-list-view">
    <FaultManagementSearch
        :searchTerm="searchTerm"
        @filterChanged="updateFilter"
        @updateSearchTerm="updateSearchTerm"
    />

    <FaultManagementToolbar
        :selected-faults="selectedFaults"
        @acknowledgeSelected="toggleAcknowledgeSelected"
        @shelveSelected="toggleShelveSelected"
    />

    <FaultManagementListHeader
        class="header"
        :selected-faults="Object.values(selectedFaults)"
        :total-faults-count="filteredFaultsList.length"
        @selectAll="selectAll"
        @sortChanged="sortChanged"
    />

    <template v-if="filteredFaultsList.length > 0">
        <FaultManagementListItem
            v-for="fault of filteredFaultsList"
            :key="fault.key"
            :fault="fault"
            :is-selected="isSelected(fault)"
            @toggleSelected="toggleSelected"
            @acknowledgeSelected="toggleAcknowledgeSelected"
            @shelveSelected="toggleShelveSelected"
        />
    </template>
</div>
</template>

<script>
import FaultManagementListHeader from './FaultManagementListHeader.vue';
import FaultManagementListItem from './FaultManagementListItem.vue';
import FaultManagementSearch from './FaultManagementSearch.vue';
import FaultManagementToolbar from './FaultManagementToolbar.vue';

import { FAULT_MANAGEMENT_SHELVE_DURATIONS_IN_MS, FILTER_ITEMS, SORT_ITEMS } from './constants';

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
            filterIndex: 0,
            searchTerm: '',
            selectedFaults: {},
            sortBy: Object.values(SORT_ITEMS)[0].value
        };
    },
    computed: {
        filteredFaultsList() {
            const filterName = FILTER_ITEMS[this.filterIndex];
            let list = this.faultsList;
            if (filterName === 'Acknowledged') {
                list = this.faultsList.filter(fault => fault.acknowledged);
            }

            if (filterName === 'Shelved') {
                list = this.faultsList.filter(fault => fault.shelveInfo);
            }

            if (this.searchTerm.length > 0) {
                list = list.filter(this.filterUsingSearchTerm);
            }

            list.sort(SORT_ITEMS[this.sortBy].sortFunction);

            return list;
        }
    },
    watch: {},
    mounted() {},
    beforeDestroy() {},
    methods: {
        filterUsingSearchTerm(fault) {
            if (fault?.id?.name?.toString().toLowerCase().includes(this.searchTerm)) {
                return true;
            }

            if (fault?.id?.namespace?.toString().toLowerCase().includes(this.searchTerm)) {
                return true;
            }

            if (fault?.parameterDetail?.triggerValue?.engValue?.doubleValue.toString().toLowerCase().includes(this.searchTerm)) {
                return true;
            }

            if (fault?.parameterDetail?.currentValue?.engValue?.doubleValue.toString().toLowerCase().includes(this.searchTerm)) {
                return true;
            }

            if (fault?.triggerTime.toString().toLowerCase().includes(this.searchTerm)) {
                return true;
            }
            if (fault?.severity.toString().toLowerCase().includes(this.searchTerm)) {
                return true;
            }

            return false;
        },
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
        sortChanged(sort) {
            this.sortBy = sort.value;
        },
        toggleSelected({ fault, selected = false}) {
            const faultId = this.getFaultId(fault);
            if (selected) {
                this.$set(this.selectedFaults, faultId, fault);
            } else {
                this.$delete(this.selectedFaults, faultId);
            }

            const selectedFaults = Object.values(this.selectedFaults);
            this.openmct.selection.select(
                [
                    {
                        element: this.$el,
                        context: {
                            item: this.openmct.router.path[0]
                        }
                    },
                    {
                        element: this.$el,
                        context: {
                            selectedFaults
                        }
                    }
                ],
                false);
        },
        toggleAcknowledgeSelected(faults = Object.values(this.selectedFaults)) {
            let title = '';
            if (faults.length > 1) {
                title = `Acknowledge ${faults.length} selected faults`;
            } else {
                title = `Acknowledge fault: ${faults[0].id.name}`;
            }

            const formStructure = {
                title,
                sections: [
                    {
                        rows: [
                            {
                                key: 'comment',
                                control: 'textarea',
                                name: 'Comment',
                                pattern: '\\S+',
                                required: false,
                                cssClass: 'l-input-lg',
                                value: ''
                            }
                        ]
                    }
                ],
                buttons: {
                    submit: {
                        label: 'Acknowledge'
                    }
                }
            };

            this.openmct.forms.showForm(formStructure)
                .then(data => {
                    Object.values(faults)
                        .forEach(selectedFault => {
                            this.openmct.faults.acknowledgeFault(selectedFault, data);
                        });
                })
                .catch(() => {
                    // Do nothing
                });

            this.selectedFaults = {};
        },
        async toggleShelveSelected(faults = Object.values(this.selectedFaults), shelveData = {}) {
            const { shelved = true } = shelveData;
            if (shelved) {
                let title = faults.length > 1
                    ? `Shelve ${faults.length} selected faults`
                    : `Shelve fault: ${faults[0].id.name}`
                ;

                const formStructure = {
                    title,
                    sections: [
                        {
                            rows: [
                                {
                                    key: 'comment',
                                    control: 'textarea',
                                    name: 'Comment',
                                    pattern: '\\S+',
                                    required: false,
                                    cssClass: 'l-input-lg',
                                    value: ''
                                },
                                {
                                    key: 'shelveDuration',
                                    control: 'select',
                                    name: 'Shelve Duration',
                                    options: FAULT_MANAGEMENT_SHELVE_DURATIONS_IN_MS,
                                    required: false,
                                    cssClass: 'l-input-lg',
                                    value: FAULT_MANAGEMENT_SHELVE_DURATIONS_IN_MS[0].value
                                }
                            ]
                        }
                    ],
                    buttons: {
                        submit: {
                            label: 'Shelve'
                        }
                    }
                };

                let data;
                try {
                    data = await this.openmct.forms.showForm(formStructure);
                } catch (e) {
                    // Do nothing
                    return;
                }

                shelveData.comment = data.comment || '';
                shelveData.shelveDuration = data.shelveDuration !== undefined
                    ? data.shelveDuration
                    : FAULT_MANAGEMENT_SHELVE_DURATIONS_IN_MS[0].value;
            } else {
                shelveData = {
                    shelved: false
                };
            }

            Object.values(faults)
                .forEach(selectedFault => {
                    this.openmct.faults.shelveFault(selectedFault, shelveData);
                });

            this.selectedFaults = {};
        },
        updateFilter(filter) {
            this.selectAll();

            this.filterIndex = filter.model.options.findIndex(option => option.value === filter.value);
        },
        updateSearchTerm(term = '') {
            this.searchTerm =  term.toLowerCase();
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
