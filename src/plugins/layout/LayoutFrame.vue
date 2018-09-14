<template>
    <div class="frame t-frame-outer child-frame panel s-selectable s-moveable s-hover-border"
        :style="frameStyle"
    >
        {{ item.domainObject.type }}
         <!-- Drag handles -->
        <span class="abs t-edit-handle-holder" v-if="selected && !isDrilledIn">
            <span class="edit-handle edit-move"
                  mct-drag-down="controller.startDrag(childObject.getId(), [1,1], [0,0])"
                  mct-drag="controller.continueDrag(delta)"
                  mct-drag-up="controller.endDrag()">
            </span>

            <span class="edit-corner edit-resize-nw"
                  mct-drag-down="controller.startDrag(childObject.getId(), [1,1], [-1,-1])"
                  mct-drag="controller.continueDrag(delta)"
                  mct-drag-up="controller.endDrag()">
            </span>
            <span class="edit-corner edit-resize-ne"
                  mct-drag-down="controller.startDrag(childObject.getId(), [0,1], [1,-1])"
                  mct-drag="controller.continueDrag(delta)"
                  mct-drag-up="controller.endDrag()">
            </span>
            <span class="edit-corner edit-resize-sw"
                  mct-drag-down="controller.startDrag(childObject.getId(), [1,0], [-1,1])"
                  mct-drag="controller.continueDrag(delta)"
                  mct-drag-up="controller.endDrag()">
            </span>
            <span class="edit-corner edit-resize-se"
                  mct-drag-down="controller.startDrag(childObject.getId(), [0,0], [1,1])"
                  mct-drag="controller.continueDrag(delta)"
                  mct-drag-up="controller.endDrag()">
            </span>
        </span>
    </div>
</template>


<script>
    export default {
        data() {
            return {
                initSelect: false,
                frameStyle: {},
                selected: false,
                isDrilledIn: false
            }
        },
        inject: ['openmct'],
        props: {
            item: Object
        },
        methods: {
        },
        mounted() {
            this.openmct.selection.selectable(
                this.$el,
                {
                    item: this.item.domainObject
                },
                this.initSelect
            );

            // Add the listeners here and remove them in destroy
        }
    }
</script>