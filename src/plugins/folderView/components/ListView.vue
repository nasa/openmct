<template>
    <div class="c-table c-table--sortable c-list-view">
        <table class="c-table__body">
            <thead class="c-table__header">
            <tr>
                <th class="is-sortable"
                    v-bind:class="[orderByField == 'name' ? 'is-sorting' : '', sortClass]"
                    @click="sort('name')">
                    Name
                </th>
                <th class="is-sortable"
                    v-bind:class="[orderByField == 'type' ? 'is-sorting' : '', sortClass]"
                    @click="sort('type')">
                    Type
                </th>
                <th class="is-sortable"
                    v-bind:class="[orderByField == 'createdDate' ? 'is-sorting' : '', sortClass]"
                    @click="sort('createdDate')">
                    Created Date
                </th>
                <th class="is-sortable"
                    v-bind:class="[orderByField == 'updatedDate' ? 'is-sorting' : '', sortClass]"
                    @click="sort('updatedDate')">
                    Updated Date
                </th>
                <th class="is-sortable"
                    v-bind:class="[orderByField == 'items' ? 'is-sorting' : '', sortClass]"
                    @click="sort('items')">
                    Items
                </th>
            </tr>
            </thead>
            <tbody>
            <tr class="c-list-item"
                v-for="(item,index) in items"
                v-bind:key="index"
                @click="navigate(item.model.identifier.key)">
                <td class="c-list-item__name"
                    :class="(item.cssClass != undefined) ? item.cssClass : 'icon-object-unknown'">
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

            &:before {
                color: $colorKey;
                display: inline-block;
                width: 1em;
                margin-right:$interiorMarginSm;
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
            };
        if (this.domainObject.composition && this.domainObject.composition.length) {

            this.domainObject.composition.forEach(item => {
                this.openmct.objects.get(item.key).then(model => {

                    var type = this.openmct.types.get(model.type) || unknownObjectType;

                    items.push({
                        name: model.name,
                        type: type.definition.name,
                        cssClass: type.definition.cssClass,
                        createdDate: model.persisted,
                        updatedDate: model.modified,
                        items: model.composition.length
                    });
                });
            });
        }

        return {
            items: items,
            orderByField: '',
            sortClass: ''
        }
    },
    methods: {
        navigate(identifier) {
            let currentLocation = this.openmct.router.currentLocation.path,
                navigateToPath = `${currentLocation}/${identifier}`;
            
            this.openmct.router.setPath(navigateToPath);
        },
        formatTime(unixTime, timeFormat) {
            return this.Moment(unixTime).format(timeFormat);
        },
        sort(field) {
            this.orderByField = field;

            if (this.sortClass === 'asc') {
                this.sortClass = 'desc';

                return this.items.sort((a,b) => a[field] < b[field]);
            } else {
                this.sortClass = 'asc';

                return this.items.sort((a,b) => a[field] > b[field]);
            }
        }
    }
}
</script>

<style>

</style>
