<template>
<div>
    <span>
        <input
            type="checkbox"
            @input="selectAll"
        >
    </span>
    <span> Results </span>
    <span>Trip Value</span>
    <span>Live Value</span>
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
