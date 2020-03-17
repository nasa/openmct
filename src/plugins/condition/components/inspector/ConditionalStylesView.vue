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
            conditionalStyles: []
        }
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
    },
    methods: {
        addConditionSet() {
            //TODO: this.conditionSetIdentifier will be set by the UI before calling this
            this.conditionSetIdentifier = {
                namespace: '',
                key: "81088c8a-4b80-41fe-9d07-fda8b22d6f5f"
            };
            this.initializeConditionalStyles();
        },
        removeConditionSet() {
            //TODO: Handle the case where domainObject has items with styles but we're trying to remove the styles on the domainObject itself
            this.conditionSetIdentifier = '';
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
            this.openmct.objects.get(this.conditionSetIdentifier).then((conditionSetDomainObject) => {
                conditionSetDomainObject.configuration.conditionCollection.forEach((conditionConfiguration, index) => {
                    this.conditionalStyles.push({
                        conditionId: conditionConfiguration.id,
                        conditionName: conditionConfiguration.name,
                        style: Object.assign({}, this.initialStyles)
                    });
                });
                let domainObjectConditionalStyle =  (this.domainObject.configuration && this.domainObject.configuration.conditionalStyle) || {};
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
