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
