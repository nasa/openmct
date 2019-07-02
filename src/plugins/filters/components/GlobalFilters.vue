<template>
    <li>
        <div class="c-tree__item menus-to-left"
            @click="toggleExpanded">
            <span class="c-disclosure-triangle is-enabled flex-elem"
                :class="{'c-disclosure-triangle--expanded': expanded}"></span>
            <div class="c-tree__item__label">
                <div class="c-object-label">
                    <div class="c-object-label__type-icon c-filter-indication c-filter-indication__global"></div>
                    <div class="c-object-label__name flex-elem grows">Global Filtering</div>
                </div>
            </div>
        </div>
        <ul class="grid-properties" v-if="expanded">
            <filter-field
                v-for="field in globalObject"
                :key="field.key"
                :filterField="field"
                :persistedFilters="globalFilters[field.key]"
                @onUserSelect="collectUserSelects"
                @onTextEnter="updateTextFilter">     
            </filter-field>
        </ul>
    </li>
</template>

<style lang="scss">
    @import "~styles/sass-base";
    .c-filter-indication {
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

        &__global {
            background-color: #fff;
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
                updatedFilters: this.globalFilters
            }
        },
        watch: {
            globalFilters: {
                handler: function checkFilters(newGlobalFilters) {
                    console.log('newGlobalFilters', newGlobalFilters);
                    console.log('globalFilters:', this.globalFilters);
                    console.log('updatedFilters:', this.updatedFilters);
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