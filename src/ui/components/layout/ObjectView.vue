<template>
    <div>
        <div class="abs l-flex-col ng-scope" ref="mountPoint">
        </div>
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
                this.$refs.mountPoint.innerHTML = '';
            }
            delete this.viewContainer;
            delete this.currentView;
        },
        show(object, provider) {
            this.clear();
            this.currentObject = object;
            this.viewContainer = document.createElement('div');
            this.$refs.mountPoint.append(this.viewContainer);
            this.currentView = provider.view(object);
            this.currentView.show(this.viewContainer);
        }
    }
}
</script>


