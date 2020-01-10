<template>
<div class="c-object-view u-contents">
    <div class="c-cs-edit w-condition-set">
        <div class="c-sw-edit__ui holder">
            <CurrentOutput :current-output="mockCurrentOutput" />
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
        return {
            mockCurrentOutput: 'Data_Present'
        }
    },
    methods: {
        persist(index) {
            if (index) {
                this.openmct.objects.mutate(this.domainObject, `configuration.conditionCollection[${index}]`, this.conditionCollection[index]);
            } else {
                this.openmct.objects.mutate(this.domainObject, 'configuration.conditionCollection', this.conditionCollection);
            }
        },
        mounted() {
        },
        addCondition() {
        }
    }
};
</script>

