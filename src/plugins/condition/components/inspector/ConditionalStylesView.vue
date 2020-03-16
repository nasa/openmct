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
        <conditional-style :condition-style="defaultStyle"/>
    </div>
    <div v-else>
        <button
            id="removeConditionSet"
            class="c-button c-button--major icon-minus labeled"
            @click="removeConditionSet"
        >
            <span class="c-cs-button__label">Remove Conditional styling</span>
        </button>
        <ul>
            <li v-for="conditionStyle in conditionalStyles"
                :key="conditionStyle.conditionId"
            >
                <conditional-style :condition-style="conditionStyle"
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
            type: String
        },
        initialStyles: {
            type: Object
        }
    },
    data() {
        return {
            conditionalStyles: [],
            defaultStyle: {
                conditionId: 'default',
                conditionName: '',
                style: Object.assign({}, this.initialStyles)
            }
        }
    },
    mounted() {
        if (this.domainObject.configuration) {
            if (this.domainObject.configuration.conditionalStyle) {
                if (this.itemId) {
                    let conditionalStyle = this.domainObject.configuration.conditionalStyle[this.itemId];
                    if (conditionalStyle) {
                        this.conditionalStyles = conditionalStyle.styles || [];
                    }
                } else {
                    this.conditionalStyles = this.domainObject.configuration.conditionalStyle.styles || [];
                }
            }
        }
    },
    methods: {
        addConditionSet() {
            let handleItemSelection = (item) => {
                if (item) {
                    this.conditionSetDomainObject = item;
                }
            };
            let dismissAndInitialize = (overlay) => {
                overlay.dismiss();
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
                        handleItemSelection: handleItemSelection
                    }
                },
                template: '<condition-set-selector-dialog @conditionSetSelected="handleItemSelection"></condition-set-selector-dialog>'
            }).$mount();

            let overlay = this.openmct.overlays.overlay({
                element: vm.$el,
                size: 'large',
                buttons: [
                    {
                        label: 'OK',
                        emphasis: 'true',
                        callback: () => dismissAndInitialize(overlay)
                    },
                    {
                        label: 'Cancel',
                        callback: () => dismissAndInitialize(overlay)
                    }
                ],
                onDestroy: () => vm.$destroy()
            });
        },
        removeConditionSet() {
            //TODO: Handle the case where domainObject has items with styles but we're trying to remove the styles on the domainObject itself
            this.conditionSetDomainObject = undefined;
            this.conditionalStyles = [];
            let domainObjectConditionalStyle =  this.domainObject.configuration.conditionalStyle;
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
            let domainObjectConditionalStyle =  this.domainObject.configuration.conditionalStyle || {};
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
            for(let i=0, ii=this.conditionalStyles.length; i < ii; i++) {
                if (this.conditionalStyles[i].conditionId === id) {
                    return {
                        index: i,
                        item: this.conditionalStyles[i]
                    };
                }
            }
        },
        updateConditionalStyle(conditionId, style) {
            let found = this.findStyleByConditionId(conditionId);
            if (found) {
                this.conditionalStyles[found.index].style = style;
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
