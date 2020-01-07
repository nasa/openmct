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
        <div v-for="condition in conditions"
             :key="condition.key"
        >
            <div v-if="isEditing">
                <ConditionEdit :domain-object="condition.domainObject"
                               :is-default="condition.isDefault"
                />
            </div>
            <div v-else>
                <Condition :domain-object="condition.domainObject"
                           :is-default="condition.isDefault"
                />
            </div>
        </div>
    </div>
</section>
</template>

<script>
import Condition from '../../condition/components/Condition.vue';
import ConditionEdit from '../../condition/components/ConditionEdit.vue';

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
            conditions: [
                {
                    identifier: {
                        key: 'testConditionKey',
                        namespace: ''
                    },
                    type: 'condition',
                    isDefault: true
                }
            ]
        };
    },
    destroyed() {
        this.composition.off('add', this.added);
        // this.composition.off('remove', this.removeCondition);
        // this.composition.off('reorder', this.reorder);
    },
    mounted() {
        this.instantiate = this.openmct.$injector.get('instantiate');
        this.composition = this.openmct.composition.get(this.domainObject);
        this.composition.on('add', this.added);
        // this.composition.on('remove', this.removeCondition);
        // this.composition.on('reorder', this.reorder);
        this.composition.load();
    },
    methods: {
        added(dobj) {
            console.log(dobj.composition);
        },
        addCondition() {
            let conditionObj = {
                "composition": [],
                "modified": 1578373933245,
                "persisted": 1578373933245,
                "name": "Condition1",
                "type": "condition",
                "id": "12345"+this.conditions.length,
                "location": "mine",
                "identifier": {
                    "namespace": "",
                    "key": "12345"+this.conditions.length
                }
            };

            let newDO = this.instantiate(conditionObj, conditionObj.identifier.key);
            let newStyleRootObj = newDO.useCapability('adapter');

            this.conditions.unshift(newStyleRootObj);
            this.composition.add(newStyleRootObj);
        },
        removeCondition(identifier) {
            console.log(`remove condition`);
            // let index = _.findIndex(this.conditions, (condition) => this.openmct.objects.makeKeyString(identifier) === item.key);

            // this.conditions.splice(index, 1);
        },
        reorder(reorderPlan) {
            let oldConditions = this.conditions.slice();
            reorderPlan.forEach((reorderEvent) => {
                this.$set(this.conditions, reorderEvent.newIndex, oldConditions[reorderEvent.oldIndex]);
            });
        }
    }
}
</script>
