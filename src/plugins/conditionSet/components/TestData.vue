<template>
<section v-show="isEditing"
         id="test-data"
         class="test-data"
>
    <div class="c-cs__ui__header">
        <span class="c-cs__ui__header-label">Test Data</span>
        <span
            class="c-cs__disclosure-triangle is-enabled flex-elem"
            :class="['c-cs__disclosure-triangle', { 'c-cs__disclosure-triangle--expanded': expanded }]"
            @click="expanded = !expanded"
        ></span>
    </div>
    <div v-if="expanded"
         class="c-cs__ui_content"
    >
        <label class="checkbox custom">
            Apply Test Values
            <input type="checkbox"
                   class="t-test-data-checkbox"
            >
        </label>
        <div class="t-test-data-config">
            <div class="c-sw-editui__rules widget-rules">
                <span>[data]</span>
            </div>
            <div class="holder add-condition-button-wrapper align-right">
                <button id="addRule"
                        class="c-button c-button--major add-condition-button icon-plus"
                >
                    <span class="c-button__label">Add Test Value</span>
                </button>
            </div>
        </div>
    </div>
</section>
</template>

<script>
export default {
    inject: ['openmct'],
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
