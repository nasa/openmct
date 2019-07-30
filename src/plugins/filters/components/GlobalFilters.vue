<template>
    <li class="c-tree__item-h">
        <div class="c-tree__item menus-to-left"
            @click="toggleExpanded">
            <div class="c-filter-tree-item__filter-indicator"
                :class="{'icon-filter': globalFiltersDefined }"></div>
            <span class="c-disclosure-triangle is-enabled flex-elem"
                :class="{'c-disclosure-triangle--expanded': expanded}"></span>
            <div class="c-tree__item__label c-object-label">
                <div class="c-object-label">
                    <div class="c-object-label__type-icon icon-gear"></div>
                    <div class="c-object-label__name flex-elem grows">Global Filtering</div>
                </div>
            </div>
        </div>
        <ul class="c-properties" v-if="expanded">
            <filter-field
                    v-for="metadatum in globalMetadata"
                    :key="metadatum.key"
                    :filterField="metadatum"
                    :persistedFilters="updatedFilters[metadatum.key]"
                    @onUserSelect="collectUserSelects"
                    @onTextEnter="updateTextFilter">
            </filter-field>
        </ul>
    </li>
</template>

<style lang="scss">
    @import "~styles/sass-base";
    .c-filter-indication {
        // Appears as a block element beneath tables
        @include userSelectNone();
        background: $colorFilterBg;
        color: $colorFilterFg;
        display: flex;
        align-items: center;
        font-size: 0.9em;
        margin-top: $interiorMarginSm;
        padding: 2px;
        text-transform: uppercase;

        &:before {
            font-family: symbolsfont-12px;
            content: $glyph-icon-filter;
            display: block;
            font-size: 12px;
            margin-right: $interiorMarginSm;
        }
    }

    .c-filter-tree-item {
        &__filter-indicator {
            color: $colorFilter;
            width: 1.2em; // Set width explicitly for layout reasons: will either have class icon-filter, or none.
        }
    }
</style>

<script>
    import FilterField from './FilterField.vue';

    export default {
        inject: ['openmct'],
        components: {
            FilterField
        },
        props: {
            globalMetadata: Object,
            globalFilters: {
                type: Object,
                default: () => {
                    return {};
                }
            }
        },
        data() {
            return {
                expanded: false,
                updatedFilters: JSON.parse(JSON.stringify(this.globalFilters))
            }
        },
        computed: {
            globalFiltersDefined() {
                let filtersDefined = false;
                Object.values(this.globalFilters).forEach(field => {
                    if (!filtersDefined) {
                        Object.values(field).forEach(comparator => {
                            if (comparator && (comparator !== '' || comparator.length > 0)) {
                                filtersDefined = true;
                                return;
                            }
                        });
                    }
                });
                return filtersDefined;
            }
        },
        watch: {
            globalFilters: {
                handler: function checkFilters(newGlobalFilters) {
                    this.updatedFilters = JSON.parse(JSON.stringify(newGlobalFilters));
                },
                deep: true
            }
        },
        methods: {
            toggleExpanded() {
                this.expanded = !this.expanded;
            },
            collectUserSelects(key, comparator, valueName, value) {
                let filterValue = this.updatedFilters[key];

                if (filterValue[comparator]) {
                    if (value === true) {
                        filterValue[comparator].push(valueName);
                    } else {
                        if (filterValue[comparator].length === 1) {
                            this.$set(this.updatedFilters, key, {});
                        } else {
                            filterValue[comparator] = filterValue[comparator].filter(v => v !== valueName);
                        }
                    }
                } else {
                    this.$set(this.updatedFilters[key], comparator, [valueName]);
                }

                this.$emit('persistGlobalFilters', key, this.updatedFilters);
            },
            updateTextFilter(key, comparator, value) {
                if (value.trim() === '') {
                    this.$set(this.updatedFilters, key, {});
                } else {
                    this.$set(this.updatedFilters[key], comparator, value);
                }

                this.$emit('persistGlobalFilters', key, this.updatedFilters);
            }
        }
    }
</script>