<template>
<div class="c-fault-mgmt__list-header c-fault-mgmt__list">
    <div class="c-fault-mgmt__checkbox">
        <input
            type="checkbox"
            @input="selectAll"
        >
    </div>
    <div class="c-fault-mgmt__list-header-results c-fault-mgmt__list-content"> Results </div>
    <div class="c-fault-mgmt__list-header-tripVal c-fault-mgmt__list-trigVal">Trip Value</div>
    <div class="c-fault-mgmt__list-header-liveVal c-fault-mgmt__list-curVal">Live Value</div>
    <div class="c-fault-mgmt__list-header-trigTime c-fault-mgmt__list-trigTime">Trigger Time</div>
    <div class="c-fault-mgmt__list-action-wrapper">
        <div class="c-fault-mgmt__list-header-sortButton c-fault-mgmt__list-action-button">
            <select>
                <option
                    value="0"
                > Newest First </option>
                <option
                    value="1"
                >Oldest First</option>
                <option
                    value="2"
                >Severity</option>
            </select>
        </div>
    </div>
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
