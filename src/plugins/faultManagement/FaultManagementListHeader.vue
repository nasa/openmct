<template>
<div class="c-fault-mgmt__list-header c-fault-mgmt__list">
    <div class="c-fault-mgmt__checkbox">
        <input
            type="checkbox"
            :checked="isSelectAll"
            @input="selectAll"
        >
    </div>
    <div class="c-fault-mgmt__list-header-results c-fault-mgmt__list-content"> {{ totalFaultsCount }} Results </div>
    <div class="c-fault-mgmt__list-header-tripVal c-fault-mgmt__list-trigVal">Trip Value</div>
    <div class="c-fault-mgmt__list-header-liveVal c-fault-mgmt__list-curVal">Live Value</div>
    <div class="c-fault-mgmt__list-header-trigTime c-fault-mgmt__list-trigTime">Trigger Time</div>
    <div class="c-fault-mgmt__list-action-wrapper">
        <div class="c-fault-mgmt__list-header-sortButton c-fault-mgmt__list-action-button">
            <SelectField
                class="c-fault-mgmt-viewButton"
                :model="model"
                @onChange="onChange"
            />
        </div>
    </div>
</div>
</template>

<script>
import SelectField from '@/api/forms/components/controls/SelectField.vue';

import { SORT_ITEMS } from './constants';

export default {
    components: {
        SelectField
    },
    inject: ['openmct', 'domainObject'],
    props: {
        selectedFaults: {
            type: Array,
            default() {
                return [];
            }
        },
        totalFaultsCount: {
            type: Number,
            default() {
                return 0;
            }
        }
    },
    data() {
        return {
            model: {}
        };
    },
    computed: {
        isSelectAll() {
            return this.totalFaultsCount > 0 && this.selectedFaults.length === this.totalFaultsCount;
        }
    },
    watch: {
    },
    beforeMount() {
        const options = Object.values(SORT_ITEMS);
        this.model = {
            options,
            value: options[0].value
        };
    },
    mounted() {
    },
    beforeDestroy() {
    },
    methods: {
        onChange(data) {
            this.$emit('sortChanged', data);
        },
        selectAll(e) {
            this.$emit('selectAll', e.target.checked);
        }
    }
};
</script>
