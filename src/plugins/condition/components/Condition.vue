<template>
<div v-if="condition"
     id="conditionArea"
     class="c-cs-ui__conditions"
     :class="['widget-condition', { 'widget-condition--current': currentConditionIdentifier && (currentConditionIdentifier.key === conditionIdentifier.key) }]"
>
    <div class="title-bar">
        <span class="condition-name">
            {{ condition.definition.name }}
        </span>
        <span class="condition-output">
            Output: {{ condition.definition.output }}
        </span>
    </div>
    <div class="condition-config">
        <span class="condition-description">
            {{ condition.definition.description }}
        </span>
    </div>
</div>
</template>

<script>
import ConditionClass from "@/plugins/condition/Condition";

export default {
    inject: ['openmct'],
    props: {
        conditionIdentifier: {
            type: Object,
            required: true
        },
        currentConditionIdentifier: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            condition: this.condition
        };
    },
    destroyed() {
        this.conditionClass.off('conditionResultUpdated', this.handleConditionResult.bind(this));
        if (this.conditionClass && typeof this.conditionClass.destroy === 'function') {
            this.conditionClass.destroy();
        }
    },
    mounted() {
        this.openmct.objects.get(this.conditionIdentifier).then((obj => {
            this.condition = obj;
            this.conditionClass = new ConditionClass(this.condition, this.openmct);
            this.conditionClass.on('conditionResultUpdated', this.handleConditionResult.bind(this));
        }));
    },
    methods: {
        handleConditionResult(args) {
            this.$emit('condition-result-updated', {
                id: this.conditionIdentifier,
                result: args.data.result
            })
        }
    }
}
</script>
