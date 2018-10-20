<template>
</template>

<style lang="scss">
    .c-object-view {
        display: contents;
    }
</style>

<script>
import _ from "lodash"

export default {
    inject: ["openmct"],
    props: {
        view: String,
        object: Object
    },
    destroyed() {
        this.clear();
    },
    watch: {
        view(newView, oldView) {
            this.viewKey = newView;
            this.debounceUpdateView();
        },
        object(newObject, oldObject) {
            this.currentObject = newObject;
            this.debounceUpdateView();
        }
    },
    created() {
        this.debounceUpdateView = _.debounce(this.updateView, 10);
    },
    mounted() {
        this.currentObject = this.object;
        this.updateView();
        this.$el.addEventListener('dragover', this.onDragOver);
        this.$el.addEventListener('drop', this.onDrop);
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
        updateView() {
            this.clear();
            if (!this.currentObject) {
                return;
            }
            this.viewContainer = document.createElement('div');
            this.viewContainer.classList.add('c-object-view');
            this.$el.append(this.viewContainer);
            let provider = this.openmct.objectViews.getByProviderKey(this.viewKey);
            if (!provider) {
                provider = this.openmct.objectViews.get(this.currentObject)[0];
                if (!provider) {
                    return;
                }
            }
            this.currentView = provider.view(this.currentObject);
            this.currentView.show(this.viewContainer);
        },
        show(object, viewKey) {
            if (this.unlisten) {
                this.unlisten();
            }
            this.currentObject = object;
            this.unlisten = this.openmct.objects.observe(this.currentObject, '*', (mutatedObject) => {
                this.currentObject = mutatedObject;
            });

            this.viewKey = viewKey;
            this.updateView();
        },
        onDragOver(event) {
            event.preventDefault();
        },
        onDrop(event) {
            let parentObject = this.currentObject;
            let childObject = JSON.parse(event.dataTransfer.getData("domainObject"));

            if (this.openmct.composition.checkPolicy(parentObject, childObject)){
                if (!this.openmct.editor.isEditing() && parentObject.type !== 'folder'){
                    this.openmct.editor.edit();
                }
                parentObject.composition.push(childObject.identifier);
                this.openmct.objects.mutate(parentObject, 'composition', parentObject.composition);
            }

            event.preventDefault();
            event.stopPropagation();
        }
    }
}
</script>


