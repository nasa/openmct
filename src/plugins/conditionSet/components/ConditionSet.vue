<template>
<div class="c-object-view u-contents">
    <div class="c-sw-edit w-summary-widget">
        <div class="c-sw-edit__ui holder">
            <section id="current-output" 
                     class="current-output">
                <div class="c-sw-edit__ui__header">
                    <span class="c-disclosure-triangle is-enabled t-view-control-test-data"></span>
                    <span class="c-sw-edit__ui__header-label">Current Output</span>
                </div>
                <div class="t-test-data-config">
                    <div id="ruleArea"
                         class="c-sw-editui__rules widget-rules"
                    >
                        <span>DATA_PRESENT</span>
                    </div>
                </div>
            </section>
            <section id="test-data" 
                     v-show="isEditing"
                     class="test-data">
                <div class="c-sw-edit__ui__header">
                    <span class="c-disclosure-triangle is-enabled t-view-control-test-data c-disclosure-triangle--expanded"></span>
                    <span class="c-sw-edit__ui__header-label">Test Data</span>
                </div>
                <div class="c-sw-edit__ui holder l-flex-accordion flex-elem grows widget-edit-holder expanded-widget-rules expanded-widget-test-data">
                    <div class="flex-accordion-holder t-widget-test-data-content w-widget-test-data-content">
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
                            <div class="holder add-rule-button-wrapper align-right">
                                <button
                                    v-show="isEditing"
                                    id="addRule"
                                    class="c-button c-button--major add-test-condition icon-plus"
                                >
                                    <span class="c-button__label">Add Test Value</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <ConditionCollection :is-editing="isEditing" />
        </div>
    </div>
</div>
</template>

<script>
import ConditionCollection from './ConditionCollection.vue';

export default {
    inject: ["openmct", "objectPath", "domainObject"],
    components: {
        ConditionCollection
    },
    props: {
        isEditing: Boolean
    }
};
</script>

