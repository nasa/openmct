<template>
<div class="c-object-view u-contents">
    <div class="c-sw-edit w-summary-widget">
        <div class="c-sw-edit__ui holder">
            <CurrentOutput :currentOutput="mockCurrentOutput"/>
            <TestData :is-editing="isEditing" />
            <ConditionCollection :is-editing="isEditing" />
        </div>
    </div>
</div>
</template>

<script>
import CurrentOutput from './CurrentOutput.vue';
import TestData from './TestData.vue';
import ConditionCollection from './ConditionCollection.vue';

export default {
    inject: ["openmct", "objectPath", "domainObject"],
    components: {
        CurrentOutput,
        TestData,
        ConditionCollection
    },
    props: {
        isEditing: Boolean
    },
    data() {
        return {
            mockCurrentOutput: 'DATA_PRESENT'
        }
    }
};
</script>

