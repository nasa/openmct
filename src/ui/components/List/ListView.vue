<template>
<div class="c-table c-table--sortable c-list-view c-list-view--sticky-header">
    <table class="c-table__body js-table__body">
        <thead class="c-table__header">
            <tr>
                <list-header
                    v-for="headerItem in headerItems"
                    :key="headerItem.property"
                    :direction="sortBy === headerItem.property ? ascending : headerItem.defaultDirection"
                    :is-sortable="headerItem.isSortable"
                    :title="headerItem.name"
                    :property="headerItem.property"
                    :current-sort="sortBy"
                    @sort="sort"
                />
            </tr>
        </thead>
        <tbody>
            <list-item
                v-for="item in sortedItems"
                :key="item.key"
                :item="item"
                :item-properties="itemProperties"
            />
        </tbody>
    </table>
</div>
</template>

<script>
import ListItem from './ListItem.vue';
import ListHeader from './ListHeader.vue';
import _ from 'lodash';

export default {
    components: {
        ListItem,
        ListHeader
    },
    inject: ['domainObject', 'openmct'],
    props: {
        headerItems: {
            type: Array,
            required: true
        },
        items: {
            type: Array,
            required: true
        },
        defaultSort: {
            type: Object,
            default() {
                return {
                    property: '',
                    defaultDirection: true
                };
            }
        },
        storageKey: {
            type: String,
            default() {
                return undefined;
            }
        }
    },
    data() {
        let sortBy = this.defaultSort.property;
        let ascending = this.defaultSort.defaultDirection;
        if (this.storageKey) {
            let persistedSortOrder = window.localStorage.getItem(this.storageKey);

            if (persistedSortOrder) {
                let parsed = JSON.parse(persistedSortOrder);

                sortBy = parsed.sortBy;
                ascending = parsed.ascending;
            }
        }

        return {
            sortBy,
            ascending
        };
    },
    computed: {
        sortedItems() {
            let sortedItems = _.sortBy(this.items, this.sortBy);
            if (!this.ascending) {
                sortedItems = sortedItems.reverse();
            }

            return sortedItems;
        },
        itemProperties() {
            return this.headerItems.map((headerItem) => {
                return {
                    key: headerItem.property,
                    format: headerItem.format
                };
            });
        }
    },
    watch: {
        defaultSort: {
            handler() {
                this.setSort();
            },
            deep: true
        }
    },
    methods: {
        setSort() {
            this.sortBy = this.defaultSort.property;
            this.ascending = this.defaultSort.defaultDirection;
        },
        sort(data) {
            const property = data.property;
            const direction = data.direction;

            if (this.sortBy === property) {
                this.ascending = !this.ascending;
            } else {
                this.sortBy = property;
                this.ascending = direction;
            }

            if (this.storageKey) {
                window.localStorage
                    .setItem(
                        this.storageKey,
                        JSON.stringify(
                            {
                                sortBy: this.sortBy,
                                ascending: this.ascending
                            }
                        )
                    );
            }

            this.$emit('sortChanged', {
                property: this.sortBy,
                defaultDirection: this.ascending
            });
        }
    }
};
</script>
