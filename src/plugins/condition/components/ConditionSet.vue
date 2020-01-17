<template>
<div class="c-object-view u-contents">
    <div class="c-cs-edit w-condition-set">
        <div v-if="currentCondition"
             class="c-sw-edit__ui holder"
        >
            <CurrentOutput :condition-collection="domainObject.conditionCollection" />
            <TestData :is-editing="isEditing" />
            <ConditionCollection :is-editing="isEditing"
                                 :conditionn="currentCondition"
            />
        </div>
    </div>
</div>
</template>

<script>
import CurrentOutput from './CurrentOutput.vue';
import TestData from './TestData.vue';
import ConditionCollection from './ConditionCollection.vue';

export default {
    inject: ["openmct", "domainObject"],
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
            conditionCollection: this.conditionCollection,
            currentCondition: this.currentCondition
        }
    },
    mounted() {
        let conditionCollection = this.domainObject.configuration.conditionCollection;
        this.currentConditionIdentifier = conditionCollection.length ? this.domainObject.configuration.conditionCollection[0] : null;
        if (this.currentConditionIdentifier) {
            this.openmct.objects.get(this.currentConditionIdentifier).then((obj) => {
                this.currentCondition = obj;
            });
        }
    }
};
</script>

