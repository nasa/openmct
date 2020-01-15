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
                 :key="condition.id"
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
            conditionCollection: [],
            conditions: []
        };
    },
    destroyed() {
        this.composition.off('add', this.addTelemetry);
    },
    mounted() {
        this.telemetryObjs = [];
        this.instantiate = this.openmct.$injector.get('instantiate');
        this.composition = this.openmct.composition.get(this.domainObject);
        this.composition.on('add', this.addTelemetry);
        this.composition.load();
        this.conditionCollection = this.domainObject.configuration ? this.domainObject.configuration.conditionCollection : [];
        if (!this.conditionCollection.length) {this.addCondition(null, true)}
    },
    methods: {
        addTelemetry(telemetryDomainObject) {
            this.telemetryObjs.push(telemetryDomainObject);
        },
        addCondition(event, isDefault) {
            let conditionDO = this.getConditionDomainObject(!!isDefault);
            this.conditionCollection.unshift(conditionDO);

            let condition = new ConditionClass(conditionDO, this.openmct);
            this.conditions.push(condition);
        },
        getConditionDomainObject(isDefault) {
            let conditionObj = {
                isDefault: isDefault,
                identifier: {
                    namespace: "",
                    key: uuid()
                },
                name: isDefault ? 'Default' : 'Unnamed Condition',
                trigger: 'any',
                criteria: isDefault ? [] : [{
                    operation: '',
                    input: '',
                    metaDataKey: this.openmct.telemetry.getMetadata(this.telemetryObjs[0]).values()[0].key,
                    key: this.telemetryObjs.length ? this.openmct.objects.makeKeyString(this.telemetryObjs[0].identifier) : null
                }],
                output: 'Default test',
                type: 'condition'
            };
            let conditionDOKeyString = this.openmct.objects.makeKeyString(conditionObj.identifier);
            let newDO = this.instantiate(conditionObj, conditionDOKeyString);
            return newDO.useCapability('adapter');
        },
        updateCondition(updatedCondition) {
            let index = _.findIndex(this.conditions, (condition) => condition.id === updatedCondition.id);
            this.conditions[index] = updatedCondition;
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
