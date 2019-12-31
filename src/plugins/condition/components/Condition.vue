<template>
<div id="conditionArea"
     class="c-cs-ui__conditions"
     :class="['widget-condition', { 'widget-condition--current': isCurrent }]"
>
    <div class="title-bar">
        <span v-if="isDefault"
              class="condition-name"
        >Default
        </span>
        <span v-else
              class="condition-name"
        >[condition name]
        </span>
        <span v-if="isDefault"
              class="condition-output"
        >Output: false
        </span>
        <span v-else
              class="condition-output"
        >Output: [condition output]
        </span>
    </div>
    <div class="condition-config">
        <span v-if="isDefault"
              class="condition-description"
        >When all else fails
        </span>
        <span v-else
              class="condition-description"
        >[condition description]
        </span>
    </div>
</div>
</template>

<script>
export default {
    inject: ['openmct'],
    props: {
        isEditing: Boolean,
        isCurrent: Boolean,
        isDefault: Boolean
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
