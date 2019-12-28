<template>
<section id="conditionCollection"
         class="c-cs__ui_section"
>
    <div class="c-cs__ui__header">
        <span class="c-cs__ui__header-label">Conditions</span>
        <span
            class="c-cs__disclosure-triangle is-enabled flex-elem"
            :class="['c-cs__disclosure-triangle', { 'c-cs__disclosure-triangle--expanded': expanded }]"
            @click="expanded = !expanded"
        ></span>
    </div>
    <div v-if="expanded"
         class="c-cs__ui_content"
    >
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
