<template>
<section id="conditionCollection">
    <div class="c-sw-edit__ui__header">
        <span
            class="c-disclosure-triangle is-enabled flex-elem"
            :class="{'c-disclosure-triangle--expanded': expanded}"
        ></span>
        <span class="c-sw-edit__ui__header-label">Conditions</span>
    </div>
    <div class="t-test-data-config">
        <div id="conditionArea"
             class="c-cs-editui__conditions widget-condition"
        >
            <Condition :is-editing="isEditing" />
            <Condition :is-editing="isEditing" />
        </div>
        <div class="holder add-condition-button-wrapper align-right">
            <button
                v-show="isEditing"
                id="addCondition"
                class="c-button c-button--major add-condition-button icon-plus"
            >
                <span class="c-button__label">Add Condition</span>
            </button>
        </div>
    </div>
</section>
</template>

<script>
import Condition from '../../condition/components/Condition.vue';

export default {
    inject: ['openmct'],
    components: {
        Condition
    },
    props: {
        isEditing: Boolean
    },
    data() {
        return {
            expanded: true
        };
    },
    methods: {
    }
}
</script>
