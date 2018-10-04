<template>
    <div>
    </div>
</template>

<style>
</style>

<script>
    export default {
        inject: ['openmct'],
        mounted() {
            this.openmct.selection.on('change', this.updateSelection);
            this.updateSelection();
        },
        destroyed() {
            this.openmct.selection.off('change', this.updateSelection);
        },
        methods: {
            updateSelection() {
                let selection = this.openmct.selection.get();
                if (this.selectedView && this.selectedView.destroy) {
                    this.selectedView.destroy();
                    delete this.viewContainer;
                    this.$el.innerHTML = '';
                }
                this.selectedView = this.openmct.inspectorViews.get(selection);
                if (!this.selectedView) {
                    return;
                }
                this.viewContainer = document.createElement('div');
                this.$el.append(this.viewContainer)
                this.selectedView.show(this.viewContainer);
            }
        }
    }
</script>
