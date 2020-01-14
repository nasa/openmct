<template>
<section id="conditionCollection"
         class="c-cs__ui_section"
>
    <div class="c-cs__ui__header">
        <span class="c-cs__ui__header-label">Conditions</span>
        <span
            class="is-enabled flex-elem"
            :class="['c-cs__disclosure-triangle', { 'c-cs__disclosure-triangle--expanded': expanded }]"
            @click="expanded = !expanded"
        ></span>
    </div>
    <div v-if="expanded"
         class="c-cs__ui_content"
    >
        <div v-show="isEditing"
             class="help"
        >
            <span>The first condition to match is the one that wins. Drag conditions to rearrange.</span>
        </div>
        <div class="holder add-condition-button-wrapper align-left">
            <button
                v-show="isEditing"
                id="addCondition"
                class="c-cs-button c-cs-button--major add-condition-button"
                @click="addCondition"
            >
                <span class="c-cs-button__label">Add Condition</span>
            </button>
        </div>
        <div class="condition-collection">
            <div v-for="condition in conditionCollection"
                 :key="condition.key"
                 class="conditionArea"
            >
                <div v-if="isEditing">
                    <ConditionEdit :condition="condition" />
                </div>
                <div v-else>
                    <Condition :condition="condition" />
                </div>
            </div>
        </div>
    </div>
</section>
</template>

<script>
import Condition from '../../condition/components/Condition.vue';
import ConditionEdit from '../../condition/components/ConditionEdit.vue';
import uuid from 'uuid';

export default {
    inject: ['openmct', 'domainObject'],
    components: {
        Condition,
        ConditionEdit
    },
    props: {
        isEditing: Boolean
    },
    data() {
        return {
            expanded: true,
            parentKeyString: this.openmct.objects.makeKeyString(this.domainObject.identifier),
            conditionCollection: []
        };
    },
    destroyed() {

    },
    mounted() {
        this.instantiate = this.openmct.$injector.get('instantiate');
        this.conditionCollection = this.domainObject.configuration.conditionCollection || this.conditionCollection;
        if (!this.conditionCollection.length) {this.addCondition(true)}
    },
    methods: {
        added(conditionDO) {
            this.conditionCollection.unshift(conditionDO);
        },
        addCondition(isDefault) {
            if (isDefault !== true) {isDefault = false}
            let conditionObjId = uuid();
            let conditionObj = {
                isDefault: isDefault,
                composition: [],
                name: isDefault ? 'Default': 'Unnamed Condition',
                type: "condition",
                id: conditionObjId,
                location: this.parentKeyString,
                identifier: {
                    namespace: "",
                    key: conditionObjId
                },
                output: 'test'
            };

            let conditionDOKeyString = this.openmct.objects.makeKeyString(conditionObj.identifier);
            let newDO = this.instantiate(conditionObj, conditionDOKeyString);
            newDO.useCapability('location').setPrimaryLocation(this.parentKeyString);
            let conditionDO = newDO.useCapability('adapter');

            this.conditionCollection.unshift(conditionDO);
        },
        removeCondition(identifier) {
            let index = _.findIndex(this.conditionCollection, (condition) => this.openmct.objects.makeKeyString(identifier) === condition.identifier.key);

            this.conditionCollection.splice(index, 1);
        },
        reorder(reorderPlan) {
            let oldConditions = this.conditionCollection.slice();
            reorderPlan.forEach((reorderEvent) => {
                this.$set(this.conditionCollection, reorderEvent.newIndex, oldConditions[reorderEvent.oldIndex]);
            });
        }
    }
}
</script>
