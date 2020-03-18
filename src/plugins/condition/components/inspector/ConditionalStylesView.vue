<template>
<div>
    <div v-if="!conditionalStyles.length">
        <button
            id="addConditionSet"
            class="c-button c-button--major icon-plus labeled"
            @click="addConditionSet"
        >
            <span class="c-cs-button__label">Add Conditional styling</span>
        </button>
        <conditional-style :condition-style="defaultStyle" />
    </div>
    <div v-else>
        <div class="c-cs__buttons"
             v-if="isEditing">
            <button
                id="changeConditionSet"
                class="c-button c-button--major icon-minus labeled"
                @click="addConditionSet"
            >
                <span class="c-cs-button__label">Change</span>
            </button>

            <button class="c-click-icon c-condition__delete-button icon-trash"
                    title="Remove conditional styles"
                    @click="removeConditionSet"
            ></button>
        </div>
        <ul>
            <li v-for="conditionStyle in conditionalStyles"
                :key="conditionStyle.conditionId"
            >
                <conditional-style :condition-style="conditionStyle"
                                   :is-editing="isEditing"
                                   @persist="updateConditionalStyle"
                />
            </li>
        </ul>
    </div>
</div>
</template>

<script>

import ConditionalStyle from "./ConditionalStyle.vue";
import ConditionSetSelectorDialog from "./ConditionSetSelectorDialog.vue";
import Vue from 'vue';

export default {
    components: {
        ConditionalStyle
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
            defaultStyle: {
                conditionId: 'default',
                conditionName: '',
                style: Object.assign({}, this.initialStyles)
            },
            isEditing: this.openmct.editor.isEditing()
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
                }
            } else {
                this.conditionalStyles = this.domainObject.configuration.conditionalStyle.styles || [];
            }
        }
        this.openmct.editor.on('isEditing', this.setEditState);
    },
    methods: {
        setEditState(isEditing) {
            this.isEditing = isEditing;
        },
        addConditionSet() {
            const selectedConditionSetIdentifier = this.conditionSetDomainObject ? this.conditionSetDomainObject.identifier : undefined;
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
                        handleItemSelection,
                        selectedConditionSetIdentifier
                    }
                },
                template: '<condition-set-selector-dialog :selected-item-id="selectedConditionSetIdentifier" @conditionSetSelected="handleItemSelection"></condition-set-selector-dialog>'
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

            this.persist(domainObjectConditionalStyle);

        },
        initializeConditionalStyles() {
            this.conditionSetDomainObject.configuration.conditionCollection.forEach((conditionConfiguration, index) => {
                this.conditionalStyles.push({
                    conditionId: conditionConfiguration.id,
                    conditionName: conditionConfiguration.configuration.name,
                    style: Object.assign({}, this.initialStyles)
                });
            });
            let domainObjectConditionalStyle =  (this.domainObject.configuration && this.domainObject.configuration.conditionalStyle) || {};
            let conditionalStyle = {
                conditionSetIdentifier: this.conditionSetDomainObject.identifier,
                styles: this.conditionalStyles
            };
            if (this.itemId) {
                this.persist({
                    ...domainObjectConditionalStyle,
                    [this.itemId]: conditionalStyle
                });
            } else {
                this.persist({
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
                        this.persist({
                            ...domainObjectConditionalStyle,
                            [this.itemId]: {
                                ...itemConditionalStyle,
                                styles: this.conditionalStyles
                            }
                        });
                    }
                } else {
                    domainObjectConditionalStyle.styles = this.conditionalStyles;
                    this.persist(domainObjectConditionalStyle);
                }
            }
        },
        persist(conditionalStyle) {
            this.openmct.objects.mutate(this.domainObject, 'configuration.conditionalStyle', conditionalStyle);
        }
    }
}
</script>
