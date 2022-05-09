<template>
<div class="c-faults-list-view">
    <FaultManagementSearch />
    <FaultManagementToolbar />

    <list-view
        :items="faultsList"
        :header-items="headerItems"
        :default-sort="defaultSort"
        class="sticky"
    />
</div>
</template>

<script>
import ListView from '@/ui/components/List/ListView.vue';

import FaultManagementSearch from './FaultManagementSearch.vue';
import FaultManagementToolbar from './FaultManagementToolbar.vue';

import moment from "moment";

const TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss:SSS';
const headerItems = [
    {
        defaultDirection: true,
        isSortable: true,
        property: 'selectAll',
        name: 'Select All'
    },
    {
        defaultDirection: true,
        property: 'severity',
        name: 'Severity'
    },
    {
        defaultDirection: true,
        property: 'name',
        name: 'Name',
        format: function (value, item) {
            return `${item.id.namespace}/${item.id.name}`;
        }
    },
    {
        defaultDirection: true,
        property: 'trippedValue',
        name: 'Tripped Value',
        format: function (value, item) {
            return item.parameterDetail.triggerValue.engValue.doubleValue;
        }
    },
    {
        defaultDirection: true,
        property: 'liveValue',
        name: 'Live Value',
        format: function (value, item) {
            return item.parameterDetail.currentValue.engValue.doubleValue;
        }
    },
    {
        defaultDirection: true,
        property: 'time',
        isSortable: true,
        name: 'Time',
        format: function (value) {
            return `${moment(value).format(TIME_FORMAT)}Z`;
        }
    }
];

const defaultSort = {
    property: 'time',
    defaultDirection: true
};

export default {
    components: {
        FaultManagementSearch,
        FaultManagementToolbar,
        ListView
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
            headerItems,
            defaultSort
        };
    },
    computed: {
    },
    watch: {
    },
    mounted() {
    },
    beforeDestroy() {
    },
    methods: {
    }
};
</script>
