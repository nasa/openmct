<template>
</template>

<script>
import _ from "lodash"

export default {
    inject: ["openmct"],
    props: {
        view: String,
        object: Object,
        showEditView: Boolean,
        objectPath: Array
    },
    destroyed() {
        this.clear();
        if (this.releaseEditModeHandler) {
            this.releaseEditModeHandler();
        }
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
        this.$el.addEventListener('drop', this.editIfEditable, {
            capture: true
        });
        this.$el.addEventListener('drop', this.addObjectToParent);
    },
    methods: {
        clear() {
            if (this.currentView) {
                this.currentView.destroy();
                this.$el.innerHTML = '';

                if (this.releaseEditModeHandler) {
                    this.releaseEditModeHandler();
                    delete this.releaseEditModeHandler;
                }
            }
            delete this.viewContainer;
            delete this.currentView;

            if (this.removeSelectable) {
                this.removeSelectable();
                delete this.removeSelectable;
            }

            if (this.composition) {
                this.composition._destroy();
            }

            this.openmct.objectViews.off('clearData', this.clearData);
        },
        invokeEditModeHandler(editMode) {
            this.currentView.onEditModeChange(editMode);
        },
        toggleEditView(editMode) {
            this.clear();
            this.updateView(true);
        },
        updateView(immediatelySelect) {
            this.clear();
            if (!this.currentObject) {
                return;
            }

            this.composition = this.openmct.composition.get(this.currentObject);
            if (this.composition) {
                this.composition._synchronize();
                this.loadComposition();
            }

            this.viewContainer = document.createElement('div');
            this.viewContainer.classList.add('c-object-view','u-contents');
            this.$el.append(this.viewContainer);
            let provider = this.getViewProvider();
            if (!provider) {
                return;
            }

            let objectPath = this.currentObjectPath || this.objectPath;

            if (provider.edit && this.showEditView) {
                if (this.openmct.editor.isEditing()) {
                    this.currentView = provider.edit(this.currentObject, true, objectPath);
                } else {
                    this.currentView = provider.view(this.currentObject, objectPath);
                }

                this.openmct.editor.on('isEditing', this.toggleEditView);
                this.releaseEditModeHandler = () => this.openmct.editor.off('isEditing', this.toggleEditView);
            } else {
                this.currentView = provider.view(this.currentObject, objectPath);

                if (this.currentView.onEditModeChange) {
                    this.openmct.editor.on('isEditing', this.invokeEditModeHandler);
                    this.releaseEditModeHandler = () => this.openmct.editor.off('isEditing', this.invokeEditModeHandler);
                }
            }
            this.currentView.show(this.viewContainer, this.openmct.editor.isEditing());

            if (immediatelySelect) {
                this.removeSelectable = openmct.selection.selectable(
                    this.$el, this.getSelectionContext(), true);
            }

            this.openmct.objectViews.on('clearData', this.clearData);
        },
        show(object, viewKey, immediatelySelect, currentObjectPath) {
            if (this.unlisten) {
                this.unlisten();
            }

            if (this.removeSelectable) {
                this.removeSelectable();
                delete this.removeSelectable;
            }

            if (this.composition) {
                this.composition._destroy();
            }

            this.currentObject = object;

            if (currentObjectPath) {
                this.currentObjectPath = currentObjectPath;
            }

            this.unlisten = this.openmct.objects.observe(this.currentObject, '*', (mutatedObject) => {
                this.currentObject = mutatedObject;
            });

            this.viewKey = viewKey;
            this.updateView(immediatelySelect);
        },
        loadComposition() {
            return this.composition.load();
        },
        getSelectionContext() {
            if (this.currentView.getSelectionContext) {
                return this.currentView.getSelectionContext();
            } else {
                return { item: this.currentObject };
            }
        },
        onDragOver(event) {
            if (this.hasComposableDomainObject(event)) {
                event.preventDefault();
            }
        },
        addObjectToParent(event) {
            if (this.hasComposableDomainObject(event) && this.composition) {
                let composableDomainObject = this.getComposableDomainObject(event);
                this.loadComposition().then(() => {
                    this.composition.add(composableDomainObject);
                });

                event.preventDefault();
                event.stopPropagation();
            }
        },
        getViewProvider() {
            let provider = this.openmct.objectViews.getByProviderKey(this.viewKey);

            if (!provider) {
                provider = this.openmct.objectViews.get(this.currentObject)[0];
                if (!provider) {
                    return;
                }
            }
            return provider;
        },
        editIfEditable(event) {
            let provider = this.getViewProvider();
            if (provider &&
                provider.canEdit &&
                provider.canEdit(this.currentObject) &&
                !this.openmct.editor.isEditing()) {
                    this.openmct.editor.edit();
            }
        },
        hasComposableDomainObject(event) {
            return event.dataTransfer.types.includes('openmct/composable-domain-object')
        },
        getComposableDomainObject(event) {
            let serializedDomainObject = event.dataTransfer.getData('openmct/composable-domain-object');
            return JSON.parse(serializedDomainObject);
        },
        clearData(domainObject) {
            if (domainObject) {
                let clearKeyString = this.openmct.objects.makeKeyString(domainObject.identifier),
                    currentObjectKeyString = this.openmct.objects.makeKeyString(this.currentObject.identifier);

                if (clearKeyString === currentObjectKeyString) {
                    if (this.currentView.onClearData) {
                        this.currentView.onClearData();
                    }
                }
            } else {
                if (this.currentView.onClearData) {
                    this.currentView.onClearData();
                }
            }
        }
    }
}
</script>


