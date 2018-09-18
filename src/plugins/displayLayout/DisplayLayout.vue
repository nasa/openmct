<template>
    <div class="abs l-layout">

        <!-- Background grid -->
        <div class="l-grid-holder">            
            <div class="l-grid l-grid-x"
                 v-if="gridSize[0] >= 3"
                 :style="{ backgroundSize: gridSize[0] + 'px 100%' }">
            </div>
            <div class="l-grid l-grid-y"
                 v-if="gridSize[1] >= 3"
                 :style="{ backgroundSize: gridSize[1] + 'px 100%' }"></div>
        </div>

        <layout-frame v-for="item in frameItems"
                      :key="item.id"
                      :item="item">
        </layout-frame>
    </div>
</template>


<script>
    import LayoutFrame from './LayoutFrame.vue'
    
    const DEFAULT_GRID_SIZE = [32, 32];

    export default {
        data() {
            return {
                gridSize: DEFAULT_GRID_SIZE,
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
                console.log('composition object', domainObject);
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
        mounted() {

        },
        destroyed: function () {
            this.composition.off('add', this.onAddComposition);
            this.composition.off('remove', this.onRemoveComposition);
        }
    }
    
</script>