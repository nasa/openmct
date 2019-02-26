<template>
    <li>
        <div class="c-tree__item menus-to-left"
            style="margin-left: 15px"
            @click="toggleExpanded">
            <span class="c-disclosure-triangle is-enabled flex-elem"
                :class="{'c-disclosure-triangle--expanded': expanded}"></span>
            <div class="c-tree__item__label">
                <div class="t-object-label l-flex-row flex-elem grows">
                    <div class="t-title-label flex-elem grows">{{ filterValue.name }}</div>
                </div>
            </div>
        </div>
        <ul v-if="expanded"
            class="grid-properties"
            style="margin-left: 25px">
            <li class="grid-row"
                v-for="(filter, index) in filterValue.filters"
                :key="index">

                <template v-if="!filter.possibleValues">
                    <h2>{{ filter }}</h2>
                    <input type="text" :id="`${filter}filterControl`" placeholder="Enter Value">
                </template>
                
                <template v-if="filter.possibleValues">
                    <h2>{{ filter.comparator }}</h2>
                    <ul class="grid-properties">
                        <li class="grid-row"
                            v-for="(value, index) in filter.possibleValues"
                            :key="index">
                            <div class="grid-cell label">{{ value }}</div>
                            <div class="grid-cell value">
                                <input type="checkbox" :id="`${value}filterControl`">
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
    props: ["filterValue"],
    data() {
        return {
            expanded: false
        }
    },
    methods: {
        toggleExpanded() {
            this.expanded = !this.expanded;
        }
    }
}
</script>
