<template>
<div id="conditionArea"
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
        condition: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            conditionData: {}
        };
    },
    methods: {
    }
}
</script>
