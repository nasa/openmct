<template>
<div id="conditionArea"
     v-if="condition"
     class="c-cs-ui__conditions"
     :class="['widget-condition', { 'widget-condition--current': condition.isCurrent }]"
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
        this.condition = {};
        this.openmct.objects.get(this.conditionIdentifier).then((obj => {
            console.log('ConditionEdit obj', obj);
            this.condition = obj;
        }));
    },
    methods: {
    }
}
</script>
