<template>
<div class="c-object-view u-contents">
    <div class="c-cs-edit w-condition-set">
        <div class="c-sw-edit__ui holder">
            <CurrentOutput :current-output="currentOutput" />
            <TestData :is-editing="isEditing" />
            <ConditionCollection :is-editing="isEditing"
                                 :condition-collection="domainObject.conditionCollection"
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
        let conditionCollection = this.domainObject.configuration.conditionCollection;
        let currentConditionIndex = 0;

        return {
            currentOutput: conditionCollection[currentConditionIndex].output,
            conditionCollection,
            currentConditionIndex
        }
    },
    mounted() {
        this.currentConditionIndex = this.getCurrentConditionIndex();
    },
    methods: {
        persist(index) {
            if (index) {
                this.openmct.objects.mutate(this.domainObject, `configuration.conditionCollection[${index}]`, this.conditionCollection[index]);
            } else {
                this.openmct.objects.mutate(this.domainObject, 'configuration.conditionCollection', this.conditionCollection);
            }
        },
        getCurrentConditionIndex() {
            let currentConditionIndex;
            this.conditionCollection.forEach((condition, index) => {
                if (condition.isCurrent) {
                    currentConditionIndex = index;
                }
            });
            return currentConditionIndex;
        }
    }
};
</script>

