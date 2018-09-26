<template>
    <div class="c-table c-table--sortable c-list-view">
        <table class="c-table__body">
            <thead class="c-table__header">
            <tr>
                <th class="is-sortable"
                    v-bind:class="[orderByField == 'name' ? 'is-sorting' : '', sortClass]"
                    @click="sortTrigger('name', 'asc')">
                    Name
                </th>
                <th class="is-sortable"
                    v-bind:class="[orderByField == 'type' ? 'is-sorting' : '', sortClass]"
                    @click="sortTrigger('type', 'asc')">
                    Type
                </th>
                <th class="is-sortable"
                    v-bind:class="[orderByField == 'createdDate' ? 'is-sorting' : '', sortClass]"
                    @click="sortTrigger('createdDate', 'desc')">
                    Created Date
                </th>
                <th class="is-sortable"
                    v-bind:class="[orderByField == 'updatedDate' ? 'is-sorting' : '', sortClass]"
                    @click="sortTrigger('updatedDate', 'desc')">
                    Updated Date
                </th>
                <th class="is-sortable"
                    v-bind:class="[orderByField == 'items' ? 'is-sorting' : '', sortClass]"
                    @click="sortTrigger('items', 'asc')">
                    Items
                </th>
            </tr>
            </thead>
            <tbody>
            <tr class="c-list-item"
                v-for="(item,index) in sortedItems"
                v-bind:key="index"
                :class="{ 'is-alias': item.isAlias === true }"
                @click="navigate(item.identifier)">
                <td class="c-list-item__name">
                    <div class="c-list-item__type-icon" :class="(item.cssClass != undefined) ? item.cssClass : 'icon-object-unknown'"></div>
                    {{item.name}}
                </td>
                <td class="c-list-item__type">{{ item.type }}</td>
                <td class="c-list-item__date-created">{{ formatTime(item.createdDate, 'YYYY-MM-DD HH:mm:ss:SSS') }}Z</td>
                <td class="c-list-item__date-updated">{{ formatTime(item.updatedDate, 'YYYY-MM-DD HH:mm:ss:SSS') }}Z</td>
                <td class="c-list-item__items">{{ item.items }}</td>
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

export default {
    inject: ['openmct', 'domainObject', 'Moment'],
    data() {
        var items = [],
            unknownObjectType = {
                definition: {
                    cssClass: 'icon-object-unknown',
                    name: 'Unknown Type'
                }
            },
            composition = this.openmct.composition.get(this.domainObject);
    
        if (composition) {

            composition.load().then((array) => {
                if (Array.isArray(array)) {
                    array.forEach(model => {
                        var type = this.openmct.types.get(model.type) || unknownObjectType;

                        items.push({
                            name: model.name,
                            identifier: model.identifier.key,
                            type: type.definition.name,
                            isAlias: false,
                            cssClass: type.definition.cssClass,
                            createdDate: model.persisted,
                            updatedDate: model.modified,
                            items: model.composition ? model.composition.length : 0,
                            isAlias: this.domainObject.identifier.key !== model.location
                        });
                    });
                }
            });
        }

        return {
            items: items,
            orderByField: 'name',
            sortClass: 'asc',
        }
    },
    computed: {
        sortedItems () {
            if (this.sortClass === 'asc') {
                return this.items.sort(this.ascending.bind(this));
            } else if (this.sortClass === 'desc') {
                return this.items.sort(this.descending.bind(this));
            }
        },
        formatTime () {
            return function (timestamp, format) {
                return this.Moment(timestamp).format(format);
            }
        }
    },
    methods: {
        navigate(identifier) {
            let currentLocation = this.openmct.router.currentLocation.path,
                navigateToPath = `${currentLocation}/${identifier}`;
            
            this.openmct.router.setPath(navigateToPath);
        },
        sortTrigger(field, sortOrder) {
            if (this.orderByField === field) {
                this.sortClass = (this.sortClass === 'asc') ? 'desc' : 'asc';
            } else {
                this.sortClass = sortOrder;
            }
            this.orderByField = field;
        },
        ascending(first, second) {
            if (first[this.orderByField] < second[this.orderByField]) {
                return -1;
            } else if (first[this.orderByField] > second[this.orderByField]) {
                return 1;
            } else {
                return 0;
            }
        },
        descending(first, second) {
            if (first[this.orderByField] > second[this.orderByField]) {
                return -1;
            } else if (first[this.orderByField] < second[this.orderByField]) {
                return 1;
            } else {
                return 0;
            }
        }
    }
}
</script>