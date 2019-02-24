<template>
    <li class="c-properties__row">
        <div class="c-properties__header">{{ filterColumn.name }}</div>
        <ul class="c-properties__section">
            <li class="c-properties__row"
                v-for="(filter, index) in filterColumn.filters"
                :key="index">
                <ul class="c-properties__section" v-if="filter.possibleValues">
                    <li class="c-properties__row"
                        v-for="(value, index) in filter.possibleValues"
                        :key="index">
                        <div class="c-properties__label">{{ value }}</div>
                        <div class="c-properties__value">
                            <input type="checkbox" :id="`${value}filterControl`">
                        </div>
                    </li>
                </ul>
                
                <div class="c-properties__row" v-if="!filter.possibleValues">
                    <div class="c-properties__label">{{ filter }}</div>
                    <div class="c-properties__value">
                        <input type="text" :id="`${filter}filterControl`">
                    </div>
                </div>
            </li>
        </ul>
    </li>
</template>
<script>
export default {
    props: ["filterColumn"]
}
</script>
