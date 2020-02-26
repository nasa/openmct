<template>
<div>Conditional Styles inspector view</div>
</template>

<script>

export default {
    components: {
    },
    inject: [
        'openmct',
        'context'
    ],
    data() {
        return {
            conditionalStyles: []
        }
    },
    destroyed() {
        if (this.styleRuleManager) {
            this.styleRuleManager.destroy();
        }
    },
    mounted() {
        this.layoutItem = this.context.layoutItem;
        this.domainObject = this.context.item;
        this.conditionalStyles = (this.domainObject.configuration && this.domainObject.configuration.conditionalStyle) || [];
        //TODO: this.conditionSetIdentifier will be set by the UI later
        if(this.domainObject.type === 'layout' || this.domainObject.type === 'generator') {
            this.addConditionSet();
        }
        // this.styleRuleManager = new StyleRuleManager(this.domainObject, {
        //     identifier: this.conditionSetIdentifier
        // }, this.openmct);
    },
    methods: {
        addConditionSet() {
            this.conditionSetIdentifier = {
                namespace: '',
                key: '600a7372-8d48-4dc4-98b6-548611b1ff7e'
            };
            this.initializeConditionalStyles();
        },
        initializeConditionalStyles() {
            this.openmct.objects.get(this.conditionSetIdentifier).then((conditionSetDomainObject) => {
                conditionSetDomainObject.configuration.conditionCollection.forEach((identifier, index) => {
                    if (!this.findStyleByConditionId(identifier)) {
                        this.conditionalStyles.push({
                            conditionIdentifier: identifier,
                            style: index ? '': {backgroundColor: 'red'}
                        });
                    }
                });
                this.persist();
            });
        },
        findStyleByConditionId(id) {
            let found = false;
            for(let i=0, ii=this.conditionalStyles.length; i < ii; i++) {
                if (this.openmct.objects.makeKeyString(this.conditionalStyles[i].conditionIdentifier) === this.openmct.objects.makeKeyString(id)) {
                    found = {
                        index: i,
                        item: this.conditionalStyles[i]
                    };
                    break;
                }
            }
            return found;
        },
        addConditionalStyle(style, conditionIdentifier) {
            let found = this.findStyleByConditionId(conditionIdentifier);
            if (found) {
                this.conditionalStyles[found.index].style = style;
            }
            this.persist();
        },
        persist() {
            this.openmct.objects.mutate(this.domainObject, 'configuration.conditionalStyle', {
                conditionSetIdentifier: this.conditionSetIdentifier,
                styles: this.conditionalStyles
            });
        }
    }
}
</script>
