<template>
    <li>
        <h2 style="margin-left: 15px;">{{ filterValue.name }} - Equals</h2>
        <ul class="grid-properties"
            style="margin-left: 15px">
            <li class="grid-row"
                v-for="(filter, index) in filterValue.filters"
                :key="index">

                <template v-if="!filter.possibleValues">
                    <input type="text" :id="`${filter}filterControl`" placeholder="Enter Value">
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
    props: ["filterValue", 'persistedFilter'],
    data() {
        return {
            expanded: false
        }
    },
    methods: {
        onUserSelect(event, comparator, value){
            this.$emit('onUserSelect', this.filterValue.key, comparator, value, event.target.checked);
        },
        isChecked(key, value) {
            if (this.persistedFilter && this.persistedFilter.comparator === key && this.persistedFilter.values.includes(value)) {
                return true;
            } else {
                return false;
            }
        }
    }
}
</script>
