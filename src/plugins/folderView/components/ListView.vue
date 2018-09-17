<template>
    <table class="list-view">
        <thead>
            <tr>
                <th>
                    Name
                </th>
                <th>
                    Type
                </th>
                <th>
                    Created Date
                </th>
                <th>
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
                            <span v-bind:class="['t-item-icon-glyph', item.type.cssClass]"></span>
                        </span>
                        <span class="t-title-label flex-elem grows">{{item.model.name}}</span>
                    </div>
                </td>
                <td>{{item.type.name}}</td>
                <td>{{ formatTime(item.model.persisted, 'YYYY-MM-DD HH:mm:ss:SSS') }}Z</td>
                <td>{{ formatTime(item.model.modified, 'YYYY-MM-DD HH:mm:ss:SSS') }}Z</td>
            </tr>
        </tbody>
    </table>
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

        this.domainObject.composition.forEach(item => {
            this.openmct.objects.get(item.key).then(model => {

                var type = this.openmct.types.get(model.type) || unknownObjectType;

                items.push({
                    model: model,
                    type: type.definition
                });
            });
        });

        return {
            items: items
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
        }
    }
}
</script>

<style>

</style>
