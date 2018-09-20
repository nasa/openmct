<template>
    <div class="c-table c-table--sortable">
        <table class="c-table__body xlist-view">
            <thead class="c-table__header">
            <tr>
                <th v-bind:class="['sortable', orderByField == 'name' ? 'sort' : '', sortClass]"
                    @click="sort('name')">
                    Name
                </th>
                <th v-bind:class="['sortable', orderByField == 'type' ? 'sort' : '', sortClass]"
                    @click="sort('type')">
                    Type
                </th>
                <th v-bind:class="['sortable', orderByField == 'createdDate' ? 'sort' : '', sortClass]"
                    @click="sort('createdDate')">
                    Created Date
                </th>
                <th v-bind:class="['sortable', orderByField == 'updatedDate' ? 'sort' : '', sortClass]"
                    @click="sort('updatedDate')">
                    Updated Date
                </th>
            </tr>
            </thead>
            <tbody>
            <tr
                    v-for="(item,index) in items"
                    v-bind:key="index"
                    @click="navigate(item.model.identifier.key)">
                <td>
                    <div class="l-flex-row">
                            <span class="flex-elem t-item-icon">
                                <span v-bind:class="['t-item-icon-glyph', item.cssClass]"></span>
                            </span>
                        <span class="t-title-label flex-elem grows">{{item.name}}</span>
                    </div>
                </td>
                <td>{{ item.type }}</td>
                <td>{{ formatTime(item.createdDate, 'YYYY-MM-DD HH:mm:ss:SSS') }}Z</td>
                <td>{{ formatTime(item.updatedDate, 'YYYY-MM-DD HH:mm:ss:SSS') }}Z</td>
            </tr>
            </tbody>
        </table>
    </div>
</template>

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
                        updatedDate: model.modified 
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
