<template>
<div v-if="condition"
     id="conditionArea"
     class="c-cs-ui__conditions"
     :class="['widget-condition', { 'widget-condition--current': isCurrent && (isCurrent.key === conditionIdentifier.key) }]"
>
    <div class="title-bar">
        <span class="condition-name">
            {{ condition.name }}
        </span>
        <span class="condition-output">
            Output: {{ condition.output }}
        </span>
    </div>
    <div class="condition-config">
        <span class="condition-description">
            {{ condition.description }}
        </span>
    </div>
</div>
</template>

<script>
export default {
    inject: ['openmct', 'domainObject'],
    props: {
        conditionIdentifier: {
            type: Object,
            required: true
        },
        isCurrent: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            condition: this.condition
        };
    },
    mounted() {
        this.openmct.objects.get(this.conditionIdentifier).then((obj => {
            this.condition = obj;
            console.log('this.isCurrent.key', this.isCurrent.key)
        }));
    }
}
</script>
