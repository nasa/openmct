<template>
<div id="conditionArea"
     v-if="condition && condition.definition"
     class="c-cs-ui__conditions"
     :class="['widget-condition', { 'widget-condition--current': condition.isCurrent }]"
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
export default {
    inject: ['openmct'],
    props: {
        conditionIdentifier: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            conditionData: {},
            condition: this.condition
        };
    },
    mounted() {
        this.openmct.objects.get(this.conditionIdentifier).then((obj => {
            this.condition = obj;
        }));
    },
    methods: {
    }
}
</script>
