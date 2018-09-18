<template>
    <div class="abs l-layout s-status-editing">

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
    
    const DEFAULT_GRID_SIZE = [32, 32],
          DEFAULT_DIMENSIONS = [12, 8],
          MINIMUM_FRAME_SIZE = [320, 180];

    export default {
        data() {
            return {
                gridSize: DEFAULT_GRID_SIZE,
                frameItems: [],
                frames: [],                
                composition: Object,
                frameStyles: [],
                rawPositions: {}
            }
        },          
        inject: ['openmct', 'objectUtils'],
        props: ['domainObject'],
        components: {
            LayoutFrame
        },
        created: function () {
            console.log("domainObject", JSON.parse(JSON.stringify(this.domainObject)));                    

            this.populatePositions(this.domainObject.configuration.layout.panels);

            this.composition = this.openmct.composition.get(this.domainObject);
            this.composition.on('add', this.onAddComposition);
            this.composition.on('remove', this.onRemoveComposition);
            this.composition.load();
        },
        methods: {            
            onAddComposition(domainObject) {
                console.log('composition object', domainObject);
                const id = this.openmct.objects.makeKeyString(domainObject.identifier)
                this.frameItems.push({
                    id: id,
                    hasFrame: this.hasFrame(id),
                    domainObject,
                    style: this.getFrameStyle(id)
                });
            },
            populatePositions(panels) {
                Object.keys(panels).forEach(function (key, index) {
                    this.rawPositions[key] = {
                        position: panels[key].position || this.defaultPosition(index),
                        dimensions: panels[key].dimensions || this.defaultDimensions()
                    };
                    this.frameStyles[key] = this.convertPosition(this.rawPositions[key]);
                    this.frames[key] = panels[key].hasFrame;
                }.bind(this));
            },
            defaultPosition(index) {
                return [index, index];
            },
            defaultDimensions() {
                let gridSize = this.gridSize;
                return MINIMUM_FRAME_SIZE.map(function (min, i) {
                    return Math.max(
                        Math.ceil(min / gridSize[i]),
                        DEFAULT_DIMENSIONS[i]
                    );
                });
            },
            convertPosition(raw) {
                return {
                    left: (this.gridSize[0] * raw.position[0]) + 'px',
                    top: (this.gridSize[1] * raw.position[1]) + 'px',
                    width: (this.gridSize[0] * raw.dimensions[0]) + 'px',
                    height: (this.gridSize[1] * raw.dimensions[1]) + 'px',
                    minWidth: (this.gridSize[0] * raw.dimensions[0]) + 'px',
                    minHeight: (this.gridSize[1] * raw.dimensions[1]) + 'px'
                };
            },
            getFrameStyle(id) {
                return this.frameStyles[id];
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