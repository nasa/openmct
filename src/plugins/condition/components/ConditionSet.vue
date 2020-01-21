<template>
<div class="c-object-view u-contents">
    <div class="c-cs-edit w-condition-set">
        <div class="c-sw-edit__ui holder">
            <CurrentOutput :condition="currentCondition"/>
            <TestData :is-editing="isEditing" />
            <ConditionCollection :is-editing="isEditing"
                                 @update-current-condition="updateCurrentcondition"
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
            // conditionCollection: this.conditionCollection,
            currentCondition: this.currentCondition
        }
    },
    mounted() {
    },
    methods: {
        updateCurrentcondition(identifier) {
            this.currentConditionIdentifier = identifier;
            console.log('identifier', identifier)
            this.openmct.objects.get(this.currentConditionIdentifier).then((obj) => {
                this.currentCondition = obj;
                console.log(`this.currentCondition`, this.currentCondition);
            });
            // console.log('updateCurrentCondition from ConditionCollection', name);
            // this.conditionCollection = collection;
            // this.$set(this.conditionCollection, , post)
        }
    }
};
</script>

