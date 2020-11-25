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
        },
        layoutFontSize: {
            type: String,
            default: ''
        },
        layoutFont: {
            type: String,
            default: ''
        }
    },
    data() {
        return {
            currentObject: this.object
        };
    },
    computed: {
        objectFontStyle() {
            return this.currentObject && this.currentObject.configuration && this.currentObject.configuration.fontStyle;
        },
        fontSize() {
            return this.objectFontStyle ? this.objectFontStyle.fontSize : this.layoutFontSize;
        },
        font() {
            return this.objectFontStyle ? this.objectFontStyle.font : this.layoutFont;
        }
    },
    watch: {
        object(newObject, oldObject) {
            this.currentObject = newObject;
            this.debounceUpdateView();
        }
    },
    destroyed() {
        this.clear();
        if (this.releaseEditModeHandler) {
            this.releaseEditModeHandler();
        }

        if (this.unlisten) {
            this.unlisten();
        }

        if (this.stopListeningStyles) {
            this.stopListeningStyles();
        }

        if (this.stopListeningFontStyles) {
            this.stopListeningFontStyles();
        }

        if (this.styleRuleManager) {
            this.styleRuleManager.destroy();
            delete this.styleRuleManager;
        }

        if (this.actionCollection) {
            this.actionCollection.destroy();
            delete this.actionCollection;
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
        if (this.currentObject) {
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
        getStyleReceiver() {
            let styleReceiver = this.$el.querySelector('.js-style-receiver');

            if (!styleReceiver) {
                styleReceiver = this.$el.querySelector(':first-child');
            }

            return styleReceiver;
        },
        invokeEditModeHandler(editMode) {
            let edit;

            if (this.currentObject.locked) {
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
            let elemToStyle = this.getStyleReceiver();

            keys.forEach(key => {
                if (elemToStyle) {
                    if ((typeof styleObj[key] === 'string') && (styleObj[key].indexOf('__no_value') > -1)) {
                        if (elemToStyle.style[key]) {
                            elemToStyle.style[key] = '';
                        }
                    } else {
                        if (!styleObj.isStyleInvisible && elemToStyle.classList.contains(STYLE_CONSTANTS.isStyleInvisible)) {
                            elemToStyle.classList.remove(STYLE_CONSTANTS.isStyleInvisible);
                        } else if (styleObj.isStyleInvisible && !elemToStyle.classList.contains(styleObj.isStyleInvisible)) {
                            elemToStyle.classList.add(styleObj.isStyleInvisible);
                        }

                        elemToStyle.style[key] = styleObj[key];
                    }
                }
            });
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
            this.viewContainer.classList.add('l-angular-ov-wrapper');
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

            this.getActionCollection();
            this.currentView.show(this.viewContainer, this.openmct.editor.isEditing());

            if (immediatelySelect) {
                this.removeSelectable = this.openmct.selection.selectable(
                    this.$el, this.getSelectionContext(), true);
            }

            this.openmct.objectViews.on('clearData', this.clearData);
        },
        getActionCollection() {
            if (this.actionCollection) {
                this.actionCollection.destroy();
            }

            this.actionCollection = this.openmct.actions._get(this.currentObjectPath || this.objectPath, this.currentView);
            this.$emit('change-action-collection', this.actionCollection);
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

            this.currentObject = object;

            if (currentObjectPath) {
                this.currentObjectPath = currentObjectPath;
            }

            this.unlisten = this.openmct.objects.observe(this.currentObject, '*', (mutatedObject) => {
                this.currentObject = mutatedObject;
            });

            this.viewKey = viewKey;

            this.updateView(immediatelySelect);

            this.initObjectStyles();
        },
        initObjectStyles() {
            if (!this.styleRuleManager) {
                this.styleRuleManager = new StyleRuleManager((this.currentObject.configuration && this.currentObject.configuration.objectStyles), this.openmct, this.updateStyle.bind(this), true);
            } else {
                this.styleRuleManager.updateObjectStyleConfig(this.currentObject.configuration && this.currentObject.configuration.objectStyles);
            }

            if (this.stopListeningStyles) {
                this.stopListeningStyles();
            }

            this.stopListeningStyles = this.openmct.objects.observe(this.currentObject, 'configuration.objectStyles', (newObjectStyle) => {
                //Updating styles in the inspector view will trigger this so that the changes are reflected immediately
                this.styleRuleManager.updateObjectStyleConfig(newObjectStyle);
            });

            this.setFontSize(this.fontSize);
            this.setFont(this.font);

            this.stopListeningFontStyles = this.openmct.objects.observe(this.currentObject, 'configuration.fontStyle', (newFontStyle) => {
                this.setFontSize(newFontStyle.fontSize);
                this.setFont(newFontStyle.font);
            });
        },
        loadComposition() {
            return this.composition.load();
        },
        getSelectionContext() {
            if (this.currentView && this.currentView.getSelectionContext) {
                return this.currentView.getSelectionContext();
            } else {
                return { item: this.currentObject };
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
                provider = this.openmct.objectViews.get(this.currentObject)[0];
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
                && provider.canEdit(this.currentObject)
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
                let currentObjectKeyString = this.openmct.objects.makeKeyString(this.currentObject.identifier);

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
            let browseObject = this.openmct.layout.$refs.browseObject.currentObject;
            let objectPath = this.currentObjectPath || this.objectPath;
            let parentObject = objectPath[1];

            return [browseObject, parentObject, this.currentObject].every(object => object && !object.locked);
        },
        setFontSize(newSize) {
            let elemToStyle = this.getStyleReceiver();
            elemToStyle.dataset.fontSize = newSize;
        },
        setFont(newFont) {
            let elemToStyle = this.getStyleReceiver();
            elemToStyle.dataset.font = newFont;
        }
    }
};
</script>

