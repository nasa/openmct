<template>
<div>
    <div v-if="!conditionalStyles.length"
         class="holder c-c-button-wrapper align-left"
    >
        <button
            class="c-c-button c-c-button--minor add-criteria-button"
            @click="addConditionSet"
        >
            <span class="c-c-button__label">Use conditional styling</span>
        </button>
    </div>
    <div v-else>
        <div class="holder c-c-button-wrapper align-left">
            <button
                class="c-c-button c-c-button--minor add-criteria-button"
                @click="removeConditionSet"
            >
                <span class="c-c-button__label">Remove conditional styling</span>
            </button>
        </div>
        <ul>
            <li v-for="conditionStyle in conditionalStyles"
                :key="conditionStyle.conditionIdentifier.key"
            >
                <conditional-style :condition-identifier="conditionStyle.conditionIdentifier"
                                   :condition-style="conditionStyle.style"
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
            conditionalStyles: []
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
            //TODO: this.conditionSetIdentifier will be set by the UI before calling this
            // this.conditionSetIdentifier = {
            //     namespace: '',
            //     key: "bcdb1765-d746-4cae-90a8-e0e1e8596869"
            // };
            let handleItemSelection = (item) => {
                this.handleItemSelection(item);
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
                        callback: () => overlay.dismiss()
                    }
                ],
                onDestroy: () => vm.$destroy()
            });
            // this.initializeConditionalStyles();
        },
        handleItemSelection(item) {
            console.log(item);
        },
        removeConditionSet() {
            //TODO: Handle the case where domainObject has items with styles but we're trying to remove the styles on the domainObject itself
            this.conditionSetIdentifier = '';
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
            this.openmct.objects.get(this.conditionSetIdentifier).then((conditionSetDomainObject) => {
                conditionSetDomainObject.configuration.conditionCollection.forEach((identifier, index) => {
                    this.conditionalStyles.push({
                        conditionIdentifier: identifier,
                        style: Object.assign({}, this.initialStyles)
                    });
                });
                let domainObjectConditionalStyle =  this.domainObject.configuration.conditionalStyle || {};
                let conditionalStyle = {
                    conditionSetIdentifier: this.conditionSetIdentifier,
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
            });
        },
        findStyleByConditionId(id) {
            for(let i=0, ii=this.conditionalStyles.length; i < ii; i++) {
                if (this.openmct.objects.areIdsEqual(this.conditionalStyles[i].conditionIdentifier,id)) {
                    return {
                        index: i,
                        item: this.conditionalStyles[i]
                    };
                }
            }
        },
        updateConditionalStyle(conditionIdentifier, style) {
            let found = this.findStyleByConditionId(conditionIdentifier);
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
