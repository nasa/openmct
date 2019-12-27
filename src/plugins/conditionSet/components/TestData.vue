<template>
<section v-show="isEditing"
         id="test-data"
         class="test-data"
>
    <div class="c-sw-edit__ui__header">
        <span
            class="c-disclosure-triangle is-enabled flex-elem"
            :class="{'c-disclosure-triangle--expanded': expanded}"
        ></span>
        <span class="c-sw-edit__ui__header-label">Test Data</span>
    </div>
    <div class="l-enable">
        <label class="checkbox custom">
            Apply Test Values
            <input type="checkbox"
                   class="t-test-data-checkbox"
            >
        </label>
    </div>
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
            expanded: true,
        };
    },
    methods: {
        
    }
}
</script>
