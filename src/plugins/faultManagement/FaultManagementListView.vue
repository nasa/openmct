<template>
<div class="c-faults-list-view">
    <FaultManagementSearch />
    <FaultManagementToolbar />
    <FaultManagementListHeader />

    <FaultManagementListItem
        v-for="(item, index) of tempList"
        :key="index"
    />

</div>
</template>

<script>
import FaultManagementSearch from './FaultManagementSearch.vue';
import FaultManagementToolbar from './FaultManagementToolbar.vue';
import FaultManagementListHeader from './FaultManagementListHeader.vue';
import FaultManagementListItem from './FaultManagementListItem.vue';

export default {
    components: {
        FaultManagementSearch,
        FaultManagementToolbar,
        FaultManagementListHeader,
        FaultManagementListItem
    },
    inject: ['openmct', 'domainObject'],
    props: {
    },
    data() {
        return {
            tempList: [1, 2, 3, 4, 5]
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
