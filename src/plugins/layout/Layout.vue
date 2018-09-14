<template>
    <div class="abs l-layout">
        <!-- Background grid -->
        <div class="l-grid-holder">
        </div>
        <layout-frame v-for="item in frameItems"
                      :key="item.id"
                      :item="item">
        </layout-frame>
    </div>
</template>


<script>
    import LayoutFrame from './LayoutFrame.vue'

    export default {
        data() {
            return {                
                frameItems: [],
                frames: [],                
                composition: [],
                configuration: {
                    layout: {
                        panels: {

                        }
                    }
                }
            }
        },          
        inject: ['openmct', 'objectUtils'],
        props: ['domainObject'],
        components: {
            LayoutFrame
        },
        created: function () {
            console.log("domainObject", JSON.parse(JSON.stringify(this.domainObject)));                    

            this.composition = this.openmct.composition.get(this.domainObject);
            this.composition.on('add', this.onAddComposition);
            this.composition.on('remove', this.onRemoveComposition);
            this.composition.load();

            console.log("frameItems", this.frameItems);
        },
        methods: {            
            onAddComposition(domainObject) {
                console.log('object', domainObject);
                const id = this.openmct.objects.makeKeyString(domainObject.identifier)
                this.frameItems.push({
                    id: id,
                    showFrame: this.hasFrame(id),
                    domainObject
                });
            },
            onRemoveComposition(identifier) {
                // TODO: remove the object from frameItems
            },
            hasFrame(id) {
                return this.frames[id]
            }
        },
        destroyed: function () {
            this.composition.off('add', this.onAddComposition);
            this.composition.off('remove', this.onRemoveComposition);
        }
    }
    
</script>