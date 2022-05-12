<template>
<div class="c-fault-mgmt__list-header">
    <span class>
        <input
            type="checkbox"
            @input="selectAll"
        >
    </span>
    <span class="c-faults-list__results-count">results</span>
    <span>severity</span>
    <span>name</span>
    <span>trippedValue</span>
    <span>liveValue</span>
    <span>acknowledged</span>
    <span>time</span>
</div>

</template>

<script>
import FaultManagementListItem from "./FaultManagementListItem.vue";
export default {
    components: {
    FaultManagementListItem
},
    inject: ['openmct', 'domainObject'],
    props: {
        selectedFaultsCount: {
            type: Number,
            default() {
                return 0;
            }
        }
    },
    data() {
        return {
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
        selectAll(e) {
            this.$emit('selectAll', e.target.checked);
        }
    }
};
</script>
