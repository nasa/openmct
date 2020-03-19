<template>
<div class="c-inspector__styles c-inspect-styles">
    <template v-if="!conditionalStyles.length">
        <div class="c-inspect-styles__header">
            Object Styles
        </div>
        <div class="c-inspect-styles__content">
            <style-editor class="c-inspect-styles__list-item"
                          :condition-style="defaultStyle"
            />
            <button
                id="addConditionSet"
                class="c-button c-button--major labeled"
                @click="addConditionSet"
            >
                <span class="c-cs-button__label">Use Conditional Styling...</span>
            </button>
        </div>
    </template>
    <template v-else>
        <div class="c-inspect-styles__header">
            Conditional Object Styles
        </div>

        <div class="c-inspect-styles__condition-set">
            <div v-if="conditionSetDomainObject"
                 class="c-object-label icon-conditional"
            >
                <span class="c-object-label__name">{{ conditionSetDomainObject.name }}</span>
            </div>
            <template v-if="isEditing">
                <button
                        id="changeConditionSet"
                        class="c-button labeled"
                        @click="addConditionSet"
                >
                    <span class="c-button__label">Change...</span>
                </button>

                <button class="c-click-icon icon-x"
                        title="Remove conditional styles"
                        @click="removeConditionSet"
                ></button>
            </template>
        </div>

        <ul v-if="conditions">
            <style-editor v-for="conditionStyle in conditionalStyles"
                          :key="conditionStyle.conditionId"
                          class="c-inspect-styles__list-item"
                          :condition-style="conditionStyle"
                          :condition="conditions[conditionStyle.conditionId]"
                          :is-editing="isEditing"
                          @persist="updateConditionalStyle"
            />
        </ul>
    </template>
</div>
</template>

<script>

import StyleEditor from "./StyleEditor.vue";
import ConditionSetSelectorDialog from "./ConditionSetSelectorDialog.vue";
import Vue from 'vue';

export default {
    name: 'ConditionalStylesView',
    components: {
        StyleEditor
    },
    inject: [
        'openmct',
        'domainObject'
    ],
    props: {
        itemId: {
            type: String,
            default: ''
        },
        initialStyles: {
            type: Object,
            default() {
                return undefined;
            }
        }
    },
    data() {
        return {
            conditionalStyles: [],
            conditionSetDomainObject: undefined,
            defaultStyle: {
                conditionId: 'default',
                style: Object.assign({}, this.initialStyles)
            },
            isEditing: this.openmct.editor.isEditing(),
            conditions: undefined
        }
    },
    destroyed() {
        this.openmct.editor.off('isEditing', this.setEditState);
    },
    mounted() {
        if (this.domainObject.configuration && this.domainObject.configuration.conditionalStyle) {
            if (this.itemId) {
                let conditionalStyle = this.domainObject.configuration.conditionalStyle[this.itemId];
                if (conditionalStyle) {
                    this.conditionalStyles = conditionalStyle.styles || [];
                    this.openmct.objects.get(conditionalStyle.conditionSetIdentifier).then(this.getConditions.bind(this));
                }
            } else {
                this.conditionalStyles = this.domainObject.configuration.conditionalStyle.styles || [];
                if (this.domainObject.configuration.conditionalStyle.conditionSetIdentifier) {
                    this.openmct.objects.get(this.domainObject.configuration.conditionalStyle.conditionSetIdentifier).then(this.getConditions.bind(this));
                }
            }
        }
        this.openmct.editor.on('isEditing', this.setEditState);
    },
    methods: {
        setEditState(isEditing) {
            this.isEditing = isEditing;
        },
        addConditionSet() {
            const handleItemSelection = (item) => {
                if (item) {
                    this.conditionSetDomainObject = item;
                }
            };
            const dismissDialog = (overlay, initialize) => {
                overlay.dismiss();
                if (!initialize) {
                    this.conditionSetDomainObject = undefined;
                }
                if (this.conditionSetDomainObject) {
                    this.initializeConditionalStyles();
                }
            };
            let vm = new Vue({
                provide: {
                    openmct: this.openmct
                },
                components: {ConditionSetSelectorDialog},
                data() {
                    return {
                        handleItemSelection
                    }
                },
                template: '<condition-set-selector-dialog @conditionSetSelected="handleItemSelection"></condition-set-selector-dialog>'
            }).$mount();

            let overlay = this.openmct.overlays.overlay({
                element: vm.$el,
                size: 'small',
                buttons: [
                    {
                        label: 'OK',
                        emphasis: 'true',
                        callback: () => dismissDialog(overlay, true)
                    },
                    {
                        label: 'Cancel',
                        callback: () => dismissDialog(overlay, false)
                    }
                ],
                onDestroy: () => vm.$destroy()
            });
        },
        removeConditionSet() {
            this.conditionSetDomainObject = undefined;
            this.conditionalStyles = [];
            let domainObjectConditionalStyle =  (this.domainObject.configuration && this.domainObject.configuration.conditionalStyle) || {};
            if (domainObjectConditionalStyle) {
                if (this.itemId) {
                    domainObjectConditionalStyle[this.itemId] = undefined;
                    delete domainObjectConditionalStyle[this.itemId];
                } else {
                    domainObjectConditionalStyle.conditionSetIdentifier = undefined;
                    delete domainObjectConditionalStyle.conditionSetIdentifier;
                    domainObjectConditionalStyle.styles = undefined;
                    delete domainObjectConditionalStyle.styles;
                }
                if (_.isEmpty(domainObjectConditionalStyle)) {
                    domainObjectConditionalStyle = undefined;
                }
            }

            this.persist('configuration.conditionalStyle', domainObjectConditionalStyle);

        },
        initializeConditionalStyles() {
            this.conditionalStyles = [];
            this.conditionSetDomainObject.configuration.conditionCollection.forEach((conditionConfiguration, index) => {
                this.conditionalStyles.push({
                    conditionId: conditionConfiguration.id,
                    style: Object.assign({}, this.initialStyles)
                });
            });
            let domainObjectConditionalStyle =  (this.domainObject.configuration && this.domainObject.configuration.conditionalStyle) || {};
            let conditionalStyle = {
                conditionSetIdentifier: this.conditionSetDomainObject.identifier,
                styles: this.conditionalStyles
            };
            if (this.itemId) {
                this.persist('configuration.conditionalStyle', {
                    ...domainObjectConditionalStyle,
                    [this.itemId]: conditionalStyle
                });
            } else {
                this.persist('configuration.conditionalStyle', {
                    ...domainObjectConditionalStyle,
                    ...conditionalStyle
                });
            }
        },
        findStyleByConditionId(id) {
            return this.conditionalStyles.find(conditionalStyle => conditionalStyle.conditionId === id);
        },
        updateConditionalStyle(conditionStyle) {
            let found = this.findStyleByConditionId(conditionStyle.conditionId);
            if (found) {
                found.style = conditionStyle.style;
                let domainObjectConditionalStyle =  this.domainObject.configuration.conditionalStyle || {};

                if (this.itemId) {
                    let itemConditionalStyle = domainObjectConditionalStyle[this.itemId];
                    if (itemConditionalStyle) {
                        this.persist('configuration.conditionalStyle', {
                            ...domainObjectConditionalStyle,
                            [this.itemId]: {
                                ...itemConditionalStyle,
                                styles: this.conditionalStyles
                            }
                        });
                    }
                } else {
                    domainObjectConditionalStyle.styles = this.conditionalStyles;
                    this.persist('configuration.conditionalStyle', domainObjectConditionalStyle);
                }
            }
        },
        persist(property, style) {
            this.openmct.objects.mutate(this.domainObject, property, style);
        },
        getConditions(conditionSetDomainObject) {
            this.conditionSetDomainObject = conditionSetDomainObject;

            if (this.conditionSetDomainObject) {
                this.conditions = {};
                this.conditionSetDomainObject.configuration.conditionCollection.forEach((condition) => this.conditions[condition.id] = condition);
            }
        }
    }
}
</script>
