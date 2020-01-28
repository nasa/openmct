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
        <div class="c-c condition-collection">
            <ul class="c-c__container-holder">
                <li v-for="(conditionIdentifier, index) in conditionCollection"
                    :key="conditionIdentifier.key"
                >
                    <div v-if="isEditing">
                        <div class="c-c__drag-ghost"
                             @drop.prevent="dropCondition"
                             @dragenter="dragEnter"
                             @dragleave="dragLeave"
                             @dragover.prevent
                        ></div>
                        <ConditionEdit :condition-identifier="conditionIdentifier"
                                       :current-condition-identifier="currentConditionIdentifier"
                                       :condition-index="index"
                                       @update-current-condition="updateCurrentCondition"
                                       @remove-condition="removeCondition"
                                       @clone-condition="cloneCondition"
                                       @condition-result-updated="handleConditionResult"
                                       @set-move-index="setMoveIndex"
                        />
                    </div>
                    <div v-else>
                        <Condition :condition-identifier="conditionIdentifier"
                                   :current-condition-identifier="currentConditionIdentifier"
                        />
                    </div>
                </li>
            </ul>
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
            currentConditionIdentifier: this.currentConditionIdentifier || {},
            moveIndex: null
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
        } else {
            this.updateCurrentCondition(this.conditionCollection[0]);
        }
    },
    methods: {
        setMoveIndex(index) {
            this.moveIndex = index;
        },
        dropCondition(e) {
            let targetIndex = Array.from(document.querySelectorAll('.c-c__drag-ghost')).indexOf(e.target);
            if (targetIndex > this.moveIndex) { targetIndex-- }
            const oldIndexArr = Object.keys(this.conditionCollection);
            const move = function (arr, old_index, new_index) {
                while (old_index < 0) {
                    old_index += arr.length;
                }
                while (new_index < 0) {
                    new_index += arr.length;
                }
                if (new_index >= arr.length) {
                    var k = new_index - arr.length;
                    while ((k--) + 1) {
                        arr.push(undefined);
                    }
                }
                arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
                return arr;
            }
            const newIndexArr = move(oldIndexArr, this.moveIndex, targetIndex);
            const reorderPlan = [];

            for (let i = 0; i < oldIndexArr.length; i++) {
                reorderPlan.push({oldIndex: Number(newIndexArr[i]), newIndex: i});
            }

            this.reorder(reorderPlan);

            e.target.classList.remove("dragging");
        },
        dragEnter(e) {
            let targetIndex = Array.from(document.querySelectorAll('.c-c__drag-ghost')).indexOf(e.target);

            if (targetIndex > this.moveIndex) { targetIndex-- }
            if (this.moveIndex === targetIndex) { return }
            e.target.classList.add("dragging");
        },
        dragLeave(e) {
            e.target.classList.remove("dragging");
        },
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
        /*
            Adds a condition to list via programatic creation of default for initial list, manual
            creation via Add Condition button, or duplication via button in title bar of condition.
            Params:
            event: always null,
            idDefault (boolean): true if conditionList is empty
            isClone (boolean): true if duplicating a condition
            name (string): name of condition being duplicated
            index (number): index of condition being duplicated
        */
        addCondition(event, isDefault, isClone, name, index) {
            let conditionDO = this.getConditionDomainObject(!!isDefault, isClone, name, index);
            //persist the condition DO so that we can do an openmct.objects.get on it and only persist the identifier in the conditionCollection of conditionSet
            this.openmct.objects.mutate(conditionDO, 'created', new Date());
            if (!isClone) {
                this.conditionCollection.unshift(conditionDO.identifier);
            } else {
                this.conditionCollection.splice(index + 1, 0, conditionDO.identifier);
            }
            this.persist();
        },
        updateCurrentCondition(identifier) {
            this.currentConditionIdentifier = identifier;
        },
        getConditionDomainObject(isDefault, isClone, name) {
            if (isClone) {
                name = 'Copy of ' + name;
            } else {
                name = isDefault ? 'Default' : 'Unnamed Condition';
            }
            let conditionObj = {
                isDefault: isDefault,
                identifier: {
                    namespace: this.domainObject.identifier.namespace,
                    key: uuid()
                },
                definition: {
                    name: name,
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
            let oldConditions = Array.from(this.conditionCollection);
            reorderPlan.forEach((reorderEvent) => {
                this.$set(this.conditionCollection, reorderEvent.newIndex, oldConditions[reorderEvent.oldIndex]);
            });
            this.persist();
        },
        cloneCondition(condition) {
            this.openmct.objects.get(condition.identifier).then((obj) => {
                this.addCondition(null, false, true, obj.definition.name, condition.index);
            });
        },
        persist() {
            this.openmct.objects.mutate(this.domainObject, 'configuration.conditionCollection', this.conditionCollection);
        }
    }
}
</script>
