<template>
    <div>
    </div>
</template>

<style>
</style>

<script>
import _ from 'lodash';

    export default {
        inject: ['openmct'],
        mounted() {
            this.openmct.selection.on('change', this.updateSelection);
            this.updateSelection();
        },
        destroyed() {
            this.openmct.selection.off('change', this.updateSelection);
        },
        data() {
            return {
                selection: []
            }
        },
        methods: {
            updateSelection() {
                let selection = this.openmct.selection.get();
                
                if (_.isEqual(this.selection[0], selection[0])) {
                    return;
                }
                this.selection = selection;

                if (this.selectedViews) {
                    this.selectedViews.forEach(selectedView => {
                        selectedView.destroy();
                    });
                    this.$el.innerHTML = '';
                }
                this.viewContainers = [];
                this.selectedViews = this.openmct.inspectorViews.get(selection);
                this.selectedViews.forEach(selectedView => {
                    let viewContainer = document.createElement('div');
                    this.viewContainers.push(viewContainer);

                    this.$el.append(viewContainer)
                    selectedView.show(viewContainer);
                });
            }
        }
    }
</script>
