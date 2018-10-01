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
            this.openmct.editor.on('isEditing', this.updateSelection);
            this.updateSelection();
        },
        destroyed() {
            this.openmct.selection.off('change', this.updateSelection);
            this.openmct.editor.off('isEditing', this.updateSelection);
        },
        methods: {
            updateSelection() {
                let selection = this.openmct.selection.get();
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
