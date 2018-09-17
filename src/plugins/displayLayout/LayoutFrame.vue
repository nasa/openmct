<template>
    <div class="frame t-frame-outer child-frame panel s-selectable s-moveable s-hover-border"
         :style="item.style"
         :class="{ 
            's-drilled-in': drilledIn,
            'no-frame': !item.hasFrame 
        }">
        
        <div class="t-rep-frame holder contents abs">
            <div class="frame frame-template t-frame-inner abs has-local-controls">
                <div class="abs object-browse-bar l-flex-row">
                        [ Object Header Frame ]
                </div>
                <object-view :object="item.domainObject"></object-view>
            </div>
        </div>

        <!-- Drag handles -->
        <span class="abs t-edit-handle-holder" v-if="selected && !drilledIn">
        </span>
    </div>
</template>


<script>
    import ObjectView from '../../ui/components/layout/ObjectView.vue'

    export default {
        data() {
            return {
                initSelect: false,
                selected: false,
                drilledIn: false
            }
        },
        inject: ['openmct'],
        props: {
            item: Object
        },
        components: {
            ObjectView
        },
        methods: {
            setSelection(selectable) {
                console.log("selectable", selectable);
                this.selected = true;
            }
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
            this.openmct.selection.on('change', this.setSelection);
        },
        destroyed() {
            this.openmct.off('change', this.selection);
        }
    }
</script>