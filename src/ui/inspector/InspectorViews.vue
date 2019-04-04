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
            this.updateSelection(this.openmct.selection.get());
        },
        destroyed() {
            this.openmct.selection.off('change', this.updateSelection);
        },
        methods: {
            updateSelection(selection) {
                if (this.selectedViews) {
                    this.selectedViews.forEach(selectedView => {
                        selectedView.destroy();
                    });
                    this.$el.innerHTML = '';
                }

                if (selection.length > 1) {
                    return;
                }

                this.selectedViews = this.openmct.inspectorViews.get(selection);
                this.selectedViews.forEach(selectedView => {
                    let viewContainer = document.createElement('div');
                    this.$el.append(viewContainer)
                    selectedView.show(viewContainer);
                });
            }
        }
    }
</script>
