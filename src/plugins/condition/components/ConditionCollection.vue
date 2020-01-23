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
            <div v-for="conditionIdentifier in conditionCollection"
                 :key="conditionIdentifier.key"
                 class="conditionArea"
            >
                <div v-if="isEditing">
                    <ConditionEdit :condition-identifier="conditionIdentifier"
                                   :is-current="currentConditionIdentifier"
                                   @update-current-condition="updateCurrentCondition"
                                   @remove-condition="removeCondition"
                                   @condition-result-updated="handleConditionResult"
                    />
                </div>
                <div v-else>
                    <Condition :condition-identifier="conditionIdentifier"
                               :is-current="currentConditionIdentifier"
                    />
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
            conditionCollection: [],
            conditions: [],
            currentConditionIdentifier: this.currentConditionIdentifier || {}
        };
    },
    destroyed() {
        this.composition.off('add', this.addTelemetry);
    },
    mounted() {
        this.telemetryObjs = [];
        this.conditionResults = {};
        this.instantiate = this.openmct.$injector.get('instantiate');
        this.composition = this.openmct.composition.get(this.domainObject);
        this.composition.on('add', this.addTelemetry);
        this.composition.load();
        this.conditionCollection = this.domainObject.configuration ? this.domainObject.configuration.conditionCollection : [];
        if (!this.conditionCollection.length) {
            this.addCondition(null, true);
        }
    },
    methods: {
        handleConditionResult(args) {
            let idAsString = this.openmct.objects.makeKeyString(args.id);
            this.conditionResults[idAsString] = args.result;
            this.updateCurrentConditionId();
        },
        updateCurrentConditionId() {
            let currentConditionIdentifier = this.conditionCollection[this.conditionCollection.length-1];

            for (let i=0, ii = this.conditionCollection.length-1; i< ii; i++) {
                let conditionIdAsString = this.openmct.objects.makeKeyString(this.conditionCollection[i]);
                if (this.conditionResults[conditionIdAsString]) {
                    //first condition to be true wins
                    currentConditionIdentifier = this.conditionCollection[i];
                    break;
                }
            }
            this.$emit('current-condition-updated', currentConditionIdentifier);
        },
        addTelemetry(telemetryDomainObject) {
            this.telemetryObjs.push(telemetryDomainObject);
        },
        addCondition(event, isDefault) {
            let conditionDO = this.getConditionDomainObject(!!isDefault);
            //persist the condition DO so that we can do an openmct.objects.get on it and only persist the identifier in the conditionCollection of conditionSet
            this.openmct.objects.mutate(conditionDO, 'created', new Date());
            this.conditionCollection.unshift(conditionDO.identifier);
            this.persist();
        },
        updateCurrentCondition(identifier) {
            this.currentConditionIdentifier = identifier;
        },
        getConditionDomainObject(isDefault) {
            let conditionObj = {
                isDefault: isDefault,
                identifier: {
                    namespace: this.domainObject.identifier.namespace,
                    key: uuid()
                },
                definition: {
                    name: isDefault ? 'Default' : 'Unnamed Condition',
                    output: 'false',
                    trigger: 'any',
                    criteria: isDefault ? [] : [{
                        operation: '',
                        input: '',
                        metaDataKey: this.openmct.telemetry.getMetadata(this.telemetryObjs[0]).values()[0].key,
                        key: this.telemetryObjs.length ? this.openmct.objects.makeKeyString(this.telemetryObjs[0].identifier) : null
                    }]
                },
                summary: 'summary description'
            };
            let conditionDOKeyString = this.openmct.objects.makeKeyString(conditionObj.identifier);
            let newDO = this.instantiate(conditionObj, conditionDOKeyString);

            return newDO.useCapability('adapter');
        },
        updateCondition(updatedCondition) {
            //TODO: this should only happen for reordering
            let index = _.findIndex(this.conditions, (condition) => condition.id === updatedCondition.id);
            this.conditions[index] = updatedCondition;
        },
        removeCondition(identifier) {
            let index = _.findIndex(this.conditionCollection, (condition) => {
                let conditionId = this.openmct.objects.makeKeyString(condition);
                let id = this.openmct.objects.makeKeyString(identifier);
                return conditionId === id;
            });
            this.conditionCollection.splice(index, 1);
            this.persist();
            this.updateCurrentConditionId();
        },
        reorder(reorderPlan) {
            let oldConditions = this.conditionCollection.slice();
            reorderPlan.forEach((reorderEvent) => {
                this.$set(this.conditionCollection, reorderEvent.newIndex, oldConditions[reorderEvent.oldIndex]);
            });
        },
        persist() {
            this.openmct.objects.mutate(this.domainObject, 'configuration.conditionCollection', this.conditionCollection);
        }
    }
}
</script>
