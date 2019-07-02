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
                    v-for="field in globalObject"
                    :key="field.key"
                    :filterField="field"
                    :persistedFilters="updatedFilters[field.key]"
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
            color: $colorFilterFg;
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
            globalObject: Object,
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
                updatedFilters: JSON.parse(JSON.stringify(this.globalFilters)),
                globalFiltersDefined: true // TODO: Wire this up - should be true when the user has entered global filter values
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

                if (filterValue && filterValue[comparator]) {
                    if (value === false) {
                        filterValue[comparator] = filterValue[comparator].filter(v => v !== valueName);
                    } else {
                        filterValue[comparator].push(valueName);
                    }
                } else {
                    if (!this.updatedFilters[key]) {
                        this.$set(this.updatedFilters, key, {});
                    }
                    this.$set(this.updatedFilters[key], comparator, [value ? valueName : undefined]);
                }

                this.$emit('persistGlobalFilters', key, this.updatedFilters);
            },
            updateTextFilter(key, comparator, value) {
                if (value.trim() === '') {
                    if (this.updatedFilters[key]) {
                        delete this.updatedFilters[key];
                        this.$emit('persistGlobalFilters', key, this.updatedFilters);
                    }
                    return;
                }

                if (!this.updatedFilters[key]) {
                    this.$set(this.updatedFilters, key, {});
                    this.$set(this.updatedFilters[key], comparator, '');
                }

                this.$set(this.updatedFilters[key], comparator, value);
                this.$emit('persistGlobalFilters', key, this.updatedFilters);
            }
        }
    }
</script>