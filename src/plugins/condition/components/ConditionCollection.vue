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
// import uuid from 'uuid';
import ConditionClass from '../Condition';

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
        this.conditionCollection = this.domainObject.configuration ? this.domainObject.configuration.conditionCollection : [];
        if (!this.conditionCollection.length) {this.addCondition(true)}
    },
    methods: {
        addCondition(isDefault) {
            if (isDefault !== true) {isDefault = false}
            let conditionObj = {
                isDefault: isDefault,
                isCurrent: true,
                name: isDefault ? 'Default' : 'Unnamed Condition',
                trigger: 'any',
                criteria: isDefault ? [] : [{
                    operation: '',
                    input: '',
                    metaDataKey: 'sin',
                    key: '2662a903-2c3c-4e46-b2fa-2b9e35a79c8c'
                }],
                output: 'false',
                summary: 'summary description'
            };

            let conditionDO = new ConditionClass(conditionObj, this.openmct);
            console.log(JSON.stringify(conditionDO));
            this.conditionCollection.unshift(conditionDO);
            console.log(JSON.stringify(this.conditionCollection));
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
