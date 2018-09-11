<template>
    <div class="c-properties"></div>
</template>

<style>
</style>

<script>
    export default {
        inject: ['openmct'],
        mounted() {
            this.openmct.selection.on('change', this.updateSelection);
            this.updateSelection(this.openmct.selection.get());
        },
        destroyed() {
            this.openmct.selection.off('change', this.updateSelection);
        },
        methods: {
            updateSelection(selection) {
                if (this.selectedView && this.selectedView.destroy) {
                    this.selectedView.destroy();
                }
                this.$el.innerHTML = '';
                this.selectedView = this.openmct.inspectorViews.get(selection);
                if (!this.selectedView) {
                    return;
                }
                this.selectedView.show(this.$el);
            }
        }
    }
</script>
