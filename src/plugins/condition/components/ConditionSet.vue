<template>
<div class="c-object-view u-contents">
    <div class="c-cs-edit w-condition-set">
        <div class="c-sw-edit__ui holder">
            <CurrentOutput :condition="currentCondition" />
            <TestData :is-editing="isEditing" />
            <ConditionCollection :is-editing="isEditing"
                                 @currentConditionUpdated="updateCurrentCondition"
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
            currentCondition: this.currentCondition
        }
    },
    mounted() {
        let conditionCollection = this.domainObject.configuration.conditionCollection;
//        this.currentConditionIdentifier = conditionCollection.length ? this.updateCurrentCondition(conditionCollection[0]) : null;
    },
    methods: {
        setCurrentCondition() {
            if (this.currentConditionIdentifier) {
                this.openmct.objects.get(this.currentConditionIdentifier).then((obj) => {
                    this.currentCondition = obj;
                });
            }
        },
        updateCurrentCondition(conditionIdentifier) {
            this.currentConditionIdentifier = conditionIdentifier;
            this.setCurrentCondition();
        }
    }
};
</script>

