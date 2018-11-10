<template>
    <div class="c-table c-table--sortable c-list-view">
        <table class="c-table__body">
            <thead class="c-table__header">
                <tr>
                    <th class="is-sortable"
                        :class="{
                            'is-sorting': sortBy === 'model.name',
                            'asc': ascending,
                            'desc': !ascending
                        }"
                        @click="sort('model.name', true)">
                        Name
                    </th>
                    <th class="is-sortable"
                        :class="{
                            'is-sorting': sortBy === 'type.name',
                            'asc': ascending,
                            'desc': !ascending
                        }"
                        @click="sort('type.name', true)">
                        Type
                    </th>
                    <th class="is-sortable"
                        :class="{
                            'is-sorting': sortBy === 'model.persisted',
                            'asc': ascending,
                            'desc': !ascending
                        }"
                        @click="sort('model.persisted', false)">
                        Created Date
                    </th>
                    <th class="is-sortable"
                        :class="{
                            'is-sorting': sortBy === 'model.modified',
                            'asc': ascending,
                            'desc': !ascending
                        }"
                        @click="sort('model.modified', false)">
                        Updated Date
                    </th>
                </tr>
            </thead>
            <tbody>
                <list-item v-for="(item,index) in sortedItems"
                    :item="item"
                    :object-path="item.objectPath">
                </list-item>
            </tbody>
        </table>
    </div>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    /******************************* LIST VIEW */
    .c-list-view {
        overflow-x: auto !important;
        overflow-y: auto;

        tbody tr {
            background: $colorListItemBg;
            transition: $transOut;
        }

        body.desktop & {
            tbody tr {
                cursor: pointer;

                &:hover {
                    background: $colorListItemBgHov;
                    transition: $transIn;
                }
            }
        }

        td {
            $p: floor($interiorMargin * 1.5);
            font-size: 1.1em;
            padding-top: $p;
            padding-bottom: $p;

            &:not(.c-list-item__name) {
                color: $colorItemFgDetails;
            }
        }
    }
</style>

<script>

import lodash from 'lodash';
import compositionLoader from './composition-loader';
import ListItem from './ListItem.vue';

export default {
    components: {ListItem},
    mixins: [compositionLoader],
    inject: ['domainObject', 'openmct'],
    data() {
        return {
            sortBy: 'model.name',
            ascending: true
        };
    },
    computed: {
        sortedItems () {
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
        }
    }
}
</script>
