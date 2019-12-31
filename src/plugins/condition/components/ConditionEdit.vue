<template>
<div id="conditionArea"
     class="c-cs-editui__conditions"
     :class="['widget-condition', { 'widget-condition--current': isCurrent }]"
>
    <div class="title-bar">
        <span
            class="c-c__menu-hamburger"
            :class="{ 'is-enabled': !isDefault }"
            @click="expanded = !expanded"
        ></span>
        <span
            class="is-enabled flex-elem"
            :class="['c-c__disclosure-triangle', { 'c-c__disclosure-triangle--expanded': expanded }]"
            @click="expanded = !expanded"
        ></span>
        <div class="condition-summary">
            <span v-if="isDefault"
                  class="condition-name"
            >Default
            </span>
            <span v-else
                  class="condition-name"
            >[condition name]
            </span>
            <span v-if="isDefault"
                  class="condition-description"
            >When all else fails
            </span>
            <span v-else
                  class="condition-description"
            >[condition description]
            </span>
        </div>
        <span class="is-enabled c-c__duplicate"></span>
        <span class="is-enabled c-c__trash"></span>
    </div>
    <div v-if="expanded"
         class="condition-config-edit"
    >
        [form stuff]
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
            conditionData: {},
            expanded: true
        };
    },
    methods: {
    }
}
</script>
