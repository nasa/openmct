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
                <conditional-style :condition-name="conditionStyle.conditionName"
                                   :condition-style="conditionStyle.style"
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
        'domainObject',
        'layoutItem'
    ],
    data() {
        return {
            conditionalStyles: []
        }
    },
    mounted() {
        if (this.layoutItem) {
            //TODO: Handle layout items
        }
        if (this.domainObject.configuration) {
            this.defautStyle = this.domainObject.configuration.defaultStyle;
            if (this.domainObject.configuration.conditionalStyle) {
                this.conditionalStyles = this.domainObject.configuration.conditionalStyle.styles || [];
            }
        }
    },
    methods: {
        addConditionSet() {
            //TODO: this.conditionSetIdentifier will be set by the UI before calling this
            this.conditionSetIdentifier = {
                namespace: '',
                key: 'bb0f61ad-268d-4d3e-bb30-90ca4a2053c4'
            };
            this.initializeConditionalStyles();
        },
        removeConditionSet() {
            this.conditionSetIdentifier = '';
            this.conditionalStyles = [];
            this.persist(undefined);
        },
        initializeConditionalStyles() {
            const backgroundColors = [{backgroundColor: 'red'},{backgroundColor: 'orange'}, {backgroundColor: 'blue'}];
            this.openmct.objects.get(this.conditionSetIdentifier).then((conditionSetDomainObject) => {
                conditionSetDomainObject.configuration.conditionCollection.forEach((conditionConfiguration, index) => {
                    this.conditionalStyles.push({
                        conditionId: conditionConfiguration.id,
                        conditionName: conditionConfiguration.name,
                        style: backgroundColors[index]
                    });
                });
                this.persist({
                    defaultStyle: this.defaultStyle || {backgroundColor: 'inherit'},
                    conditionSetIdentifier: this.conditionSetIdentifier,
                    styles: this.conditionalStyles
                });
            });
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
            }
            this.persist(undefined);
        },
        persist(conditionalStyle) {
            this.openmct.objects.mutate(this.domainObject, 'configuration.conditionalStyle', conditionalStyle);
        }
    }
}
</script>
