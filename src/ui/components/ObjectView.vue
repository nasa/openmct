<template>
<div></div>
</template>

<script>
import _ from "lodash";
import StyleRuleManager from "@/plugins/condition/StyleRuleManager";
import {STYLE_CONSTANTS} from "@/plugins/condition/utils/constants";

export default {
    inject: ["openmct"],
    props: {
        object: {
            type: Object,
            default: undefined
        },
        showEditView: Boolean,
        objectPath: {
            type: Array,
            default: () => {
                return [];
            }
        }
    },
    watch: {
        object(newObject, oldObject) {
            this.debounceUpdateView();
        }
    },
    destroyed() {
        this.clear();
        if (this.releaseEditModeHandler) {
            this.releaseEditModeHandler();
        }

        if (this.stopListeningStyles) {
            this.stopListeningStyles();
        }

        if (this.styleRuleManager) {
            this.styleRuleManager.destroy();
            delete this.styleRuleManager;
        }
    },
    created() {
        this.debounceUpdateView = _.debounce(this.updateView, 10);
    },
    mounted() {
        this.updateView();
        this.$el.addEventListener('dragover', this.onDragOver, {
            capture: true
        });
        this.$el.addEventListener('drop', this.editIfEditable, {
            capture: true
        });
        this.$el.addEventListener('drop', this.addObjectToParent);
        if (this.object) {
            //This is to apply styles to subobjects in a layout
            this.initObjectStyles();
        }

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
            let edit;

            if (this.object.locked) {
                edit = false;
            } else {
                edit = editMode;
            }

            this.currentView.onEditModeChange(edit);
        },
        toggleEditView(editMode) {
            this.clear();
            this.updateView(true);
        },
        updateStyle(styleObj) {
            if (!styleObj) {
                return;
            }

            let keys = Object.keys(styleObj);
            keys.forEach(key => {
                let firstChild = this.$el.querySelector(':first-child');
                if (firstChild) {
                    if ((typeof styleObj[key] === 'string') && (styleObj[key].indexOf('__no_value') > -1)) {
                        if (firstChild.style[key]) {
                            firstChild.style[key] = '';
                        }
                    } else {
                        if (!styleObj.isStyleInvisible && firstChild.classList.contains(STYLE_CONSTANTS.isStyleInvisible)) {
                            firstChild.classList.remove(STYLE_CONSTANTS.isStyleInvisible);
                        } else if (styleObj.isStyleInvisible && !firstChild.classList.contains(styleObj.isStyleInvisible)) {
                            firstChild.classList.add(styleObj.isStyleInvisible);
                        }

                        firstChild.style[key] = styleObj[key];
                    }
                }
            });
        },
        updateView(immediatelySelect) {
            this.clear();
            if (!this.object) {
                return;
            }

            this.composition = this.openmct.composition.get(this.object);
            if (this.composition) {
                this.composition._synchronize();
                this.loadComposition();
            }

            this.viewContainer = document.createElement('div');
            this.viewContainer.classList.add('l-angular-ov-wrapper');
            this.$el.append(this.viewContainer);
            let provider = this.getViewProvider();
            if (!provider) {
                return;
            }

            let objectPath = this.currentObjectPath || this.objectPath;

            if (provider.edit && this.showEditView) {
                if (this.openmct.editor.isEditing()) {
                    this.currentView = provider.edit(this.object, true, objectPath);
                } else {
                    this.currentView = provider.view(this.object, objectPath);
                }

                this.openmct.editor.on('isEditing', this.toggleEditView);
                this.releaseEditModeHandler = () => this.openmct.editor.off('isEditing', this.toggleEditView);
            } else {
                this.currentView = provider.view(this.object, objectPath);

                if (this.currentView.onEditModeChange) {
                    this.openmct.editor.on('isEditing', this.invokeEditModeHandler);
                    this.releaseEditModeHandler = () => this.openmct.editor.off('isEditing', this.invokeEditModeHandler);
                }
            }

            this.currentView.show(this.viewContainer, this.openmct.editor.isEditing());

            if (immediatelySelect) {
                this.removeSelectable = this.openmct.selection.selectable(
                    this.$el, this.getSelectionContext(), true);
            }

            this.openmct.objectViews.on('clearData', this.clearData);
        },
        show(object, viewKey, immediatelySelect, currentObjectPath) {
            this.updateStyle();

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

            this.object = object;

            if (currentObjectPath) {
                this.currentObjectPath = currentObjectPath;
            }

            this.viewKey = viewKey;

            this.updateView(immediatelySelect);

            this.initObjectStyles();
        },
        initObjectStyles() {
            if (!this.styleRuleManager) {
                this.styleRuleManager = new StyleRuleManager((this.object.configuration && this.object.configuration.objectStyles), this.openmct, this.updateStyle.bind(this), true);
            } else {
                this.styleRuleManager.updateObjectStyleConfig(this.object.configuration && this.object.configuration.objectStyles);
            }

            if (this.stopListeningStyles) {
                this.stopListeningStyles();
            }

            this.stopListeningStyles = this.openmct.objects.observe(this.object, 'configuration.objectStyles', (newObjectStyle) => {
                //Updating styles in the inspector view will trigger this so that the changes are reflected immediately
                this.styleRuleManager.updateObjectStyleConfig(newObjectStyle);
            });
        },
        loadComposition() {
            return this.composition.load();
        },
        getSelectionContext() {
            if (this.currentView && this.currentView.getSelectionContext) {
                return this.currentView.getSelectionContext();
            } else {
                return { item: this.object };
            }
        },
        onDragOver(event) {
            if (this.hasComposableDomainObject(event)) {
                if (this.isEditingAllowed()) {
                    event.preventDefault();
                } else {
                    event.stopPropagation();
                }
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
                provider = this.openmct.objectViews.get(this.object)[0];
                if (!provider) {
                    return;
                }
            }

            return provider;
        },
        editIfEditable(event) {
            let provider = this.getViewProvider();
            if (provider
                && provider.canEdit
                && provider.canEdit(this.object)
                && this.isEditingAllowed()
                && !this.openmct.editor.isEditing()) {
                this.openmct.editor.edit();
            }
        },
        hasComposableDomainObject(event) {
            return event.dataTransfer.types.includes('openmct/composable-domain-object');
        },
        getComposableDomainObject(event) {
            let serializedDomainObject = event.dataTransfer.getData('openmct/composable-domain-object');

            return JSON.parse(serializedDomainObject);
        },
        clearData(domainObject) {
            if (domainObject) {
                let clearKeyString = this.openmct.objects.makeKeyString(domainObject.identifier);
                let currentObjectKeyString = this.openmct.objects.makeKeyString(this.object.identifier);

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
        },
        isEditingAllowed() {
            let browseObject = this.openmct.layout.$refs.browseObjecs.object;
            let objectPath = this.currentObjectPath || this.objectPath;
            let parentObject = objectPath[1];

            return [browseObject, parentObject, this.object].every(object => object && !object.locked);
        }
    }
};
</script>

