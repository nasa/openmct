<template>
    <div>
    </div>
</template>

<style lang="scss">
</style>

<script>
export default {
    inject: ["openmct"],
    destroyed() {
        this.clear();
    },
    methods: {
        clear() {
            if (this.currentView) {
                this.currentView.destroy();
                this.$el.innerHTML = '';
            }
            delete this.viewContainer;
            delete this.currentView;
        },
        show(object, provider) {
            this.clear();
            this.currentObject = object;
            this.viewContainer = document.createElement('div');
            this.$el.append(this.viewContainer);
            this.currentView = provider.view(object);
            this.currentView.show(this.viewContainer);
        }
    }
}
</script>


