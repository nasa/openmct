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
            <tr class="c-list-item"
                v-for="(item,index) in sortedItems"
                v-bind:key="index"
                :class="{ 'is-alias': item.isAlias === true }"
                @click="navigate(item)">
                <td class="c-list-item__name">
                    <div class="c-list-item__type-icon"
                         :class="item.type.cssClass"></div>
                    {{item.model.name}}
                </td>
                <td class="c-list-item__type">{{ item.type.name }}</td>
                <td class="c-list-item__date-created">{{ formatTime(item.model.persisted, 'YYYY-MM-DD HH:mm:ss:SSS') }}Z</td>
                <td class="c-list-item__date-updated">{{ formatTime(item.model.modified, 'YYYY-MM-DD HH:mm:ss:SSS') }}Z</td>
            </tr>
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

    .c-list-item {
        &__name {
            @include ellipsize();
        }

        &__type-icon {
            color: $colorKey;
            display: inline-block;
            width: 1em;
            margin-right:$interiorMarginSm;
        }

        &.is-alias {
            // Object is an alias to an original.
            [class*='__type-icon'] {
                &:after {
                    color: $colorIconAlias;
                    content: $glyph-icon-link;
                    font-family: symbolsfont;
                    display: block;
                    position: absolute;
                    text-shadow: rgba(black, 0.5) 0 1px 2px;
                    top: auto; left: -1px; bottom: 1px; right: auto;
                    transform-origin: bottom left;
                    transform: scale(0.65);
                }
            }
        }
    }


    /******************************* LIST ITEM */
</style>

<script>

import lodash from 'lodash';
import moment from 'moment';
import compositionLoader from './composition-loader';

export default {
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
        formatTime(timestamp, format) {
            return moment(timestamp).format(format);
        },
        navigate(item) {
            let currentLocation = this.openmct.router.currentLocation.path,
                navigateToPath = `${currentLocation}/${this.openmct.objects.makeKeyString(item.model.identifier)}`;

            this.openmct.router.setPath(navigateToPath);
        },
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
