<template>
<div class="c-table c-table--sortable c-list-view">
    <table class="c-table__body">
        <thead class="c-table__header">
            <tr>
                <th
                    class="is-sortable"
                    :class="{
                        'is-sorting': sortBy === 'model.name',
                        'asc': ascending,
                        'desc': !ascending
                    }"
                    @click="sort('model.name', true)"
                >
                    Name
                </th>
                <th
                    class="is-sortable"
                    :class="{
                        'is-sorting': sortBy === 'type.name',
                        'asc': ascending,
                        'desc': !ascending
                    }"
                    @click="sort('type.name', true)"
                >
                    Type
                </th>
                <th
                    class="is-sortable"
                    :class="{
                        'is-sorting': sortBy === 'model.persisted',
                        'asc': ascending,
                        'desc': !ascending
                    }"
                    @click="sort('model.persisted', false)"
                >
                    Created Date
                </th>
                <th
                    class="is-sortable"
                    :class="{
                        'is-sorting': sortBy === 'model.modified',
                        'asc': ascending,
                        'desc': !ascending
                    }"
                    @click="sort('model.modified', false)"
                >
                    Updated Date
                </th>
            </tr>
        </thead>
        <tbody>
            <list-item
                v-for="item in sortedItems"
                :key="item.objectKeyString"
                :item="item"
                :object-path="item.objectPath"
            />
        </tbody>
    </table>
</div>
</template>

<script>
import compositionLoader from './composition-loader';
import ListItem from './ListItem.vue';
import _ from 'lodash';

export default {
    components: {ListItem},
    mixins: [compositionLoader],
    inject: ['domainObject', 'openmct'],
    data() {
        let sortBy = 'model.name';
        let ascending = true;
        let persistedSortOrder = window.localStorage.getItem('openmct-listview-sort-order');

        if (persistedSortOrder) {
            let parsed = JSON.parse(persistedSortOrder);

            sortBy = parsed.sortBy;
            ascending = parsed.ascending;
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
        }
    },
    methods: {
        sort(field, defaultDirection) {
            if (this.sortBy === field) {
                this.ascending = !this.ascending;
            } else {
                this.sortBy = field;
                this.ascending = defaultDirection;
            }

            window.localStorage
                .setItem(
                    'openmct-listview-sort-order',
                    JSON.stringify(
                        {
                            sortBy: this.sortBy,
                            ascending: this.ascending
                        }
                    )
                );
        }
    }
};
</script>
