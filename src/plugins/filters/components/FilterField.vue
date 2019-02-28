<template>
    <li>
        <h2 style="margin-left: 15px;">{{ filterField.name }} - Equals</h2>
        <ul class="grid-properties"
            style="margin-left: 15px">
            <li class="grid-row"
                v-for="(filter, index) in filterField.filters"
                :key="index">

                <template v-if="!filter.possibleValues">
                    <input type="text" 
                        :id="`${filter}filterControl`"  
                        placeholder="Enter Value"
                        :value="persistedValue(filter)"
                        @blur="updateFilterValue($event, filter)">
                </template>
                
                <template v-if="filter.possibleValues">
                    <ul class="grid-properties">
                        <li class="grid-row"
                            v-for="(value, index) in filter.possibleValues"
                            :key="index">
                            <div class="grid-cell label">{{ value }}</div>
                            <div class="grid-cell value">
                                <input type="checkbox" 
                                    :id="`${value}filterControl`" 
                                    @change="onUserSelect($event, filter.comparator, value)"
                                    :checked="isChecked(filter.comparator, value)">
                            </div>
                        </li>
                    </ul>
                </template>
            </li>
        </ul>
    </li>
</template>
<script>
export default {
    props: {
        filterField: Object, 
        persistedFilters: {
            type: Object,
            default: () => {
                return {
                    value: '',
                    values: []
                }
            }
        }
    },
    data() {
        return {
            expanded: false,
            comparator: this.persistedFilters.comparator,
            value: this.persistedFilters.value,
            values: this.persistedFilters.values
        }
    },
    methods: {
        onUserSelect(event, comparator, value){
            this.$emit('onUserSelect', this.filterField.key, comparator, value, event.target.checked);
        },
        isChecked(comparator, value) {
            if (this.comparator === comparator && this.values.includes(value)) {
                return true;
            } else {
                return false;
            }
        },
        persistedValue(comparator) {
            if (this.comparator === comparator) {
                return this.value;
            }
        },
        updateFilterValue(event, comparator) {
            this.value = event.target.value;
            this.$emit('onTextEnter', this.filterField.key, comparator, this.value);
        }
    }
}
</script>
