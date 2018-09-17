<template>
    <div class="items-holder grid abs">
        <div 
            v-for="(item, index) in items"
            v-bind:key="index"
            class="item grid-item"
            @click="navigate(item.model.identifier.key)">

            <div class="contents abs">

                <div class='top-bar bar abs'>
                    <span class='icon-people' title='Shared'></span>
                    <mct-representation class="desktop-hide" key="'info-button'"></mct-representation>
                </div>

                <div class='item-main abs lg'>
                    <span class="t-item-icon">
                        <span v-bind:class="['t-item-icon-glyph', item.type.cssClass]"></span>
                    </span>
                    <div class='abs item-open icon-pointer-right'></div>
                </div>

                <div class='bottom-bar bar abs'>
                    <div class='title'>{{item.model.name}}</div>
                    <div class='details'>
                        <span>{{item.type.name}}</span>
                        <span v-if="item.model.composition !== undefined">
                            - {{item.model.composition.length}} Item<span v-if="item.model.composition.length > 1">s</span>
                        </span>
                    </div>
                </div>

            </div>
        </div>
    </div>
</template>

<style>
</style>

<script>
export default {
    inject: ['openmct', 'domainObject'],
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
        }
    }
}
</script>
