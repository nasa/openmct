<template>
<div class="c-cs-editui__conditions"
     :class="['widget-condition', { 'widget-condition--current': isCurrent }]"
>
    <div class="title-bar">
        <span
            class="c-c__menu-hamburger"
            :class="{ 'is-enabled': !isDefault }"
            @click="expanded = !expanded"
        ></span>
        <span
            class="is-enabled flex-elem"
            :class="['c-c__disclosure-triangle', { 'c-c__disclosure-triangle--expanded': expanded }]"
            @click="expanded = !expanded"
        ></span>
        <div class="condition-summary">
            <span v-if="isDefault"
                  class="condition-name"
            >Default
            </span>
            <span v-else
                  class="condition-name"
            >{{ name }}
            </span>
            <span v-if="isDefault"
                  class="condition-description"
            >When all else fails
            </span>
            <span v-else
                  class="condition-description"
            >{{ description }}
            </span>
        </div>
        <span v-if="!isDefault"
              class="is-enabled c-c__duplicate"
        ></span>
        <span v-if="!isDefault"
              class="is-enabled c-c__trash"
              @click="removeCondition"
        ></span>
    </div>
    <div v-if="expanded"
         class="condition-config-edit widget-rule-content c-sw-editui__rules-wrapper holder widget-rules-wrapper flex-elem expanded"
    >
        <div id="ruleArea"
             class="c-sw-editui__rules widget-rules"
        >
            <div class="c-sw-rule">
                <div class="c-sw-rule__ui l-compact-form l-widget-rule has-local-controls">
                    <div>
                        <ul>
                            <li>
                                <label>Condition Name</label>
                                <span class="controls">
                                    <input v-model="name"
                                           class="t-rule-name-input"
                                           type="text"
                                    >
                                </span>
                            </li>
                            <li>
                                <label>Output</label>
                                <span class="controls">
                                    <select class="">
                                        <option value="false">false</option>
                                    </select>
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
</template>

<script>
export default {
    inject: ['openmct', 'domainObject'],
    props: {
        isEditing: Boolean,
        isCurrent: Boolean,
        isDefault: Boolean,
        condition: {
            type: Object,
            required: true
        }
    },
    data() {
        console.log(`this.condition.name: ${this.condition.name}`);
        return {
            expanded: true,
            name: this.condition.name,
            description: this.condition.description
        };
    },
    mounted() {
        // console.log(`currentObjectPath: ${this.currentObjectPath.name}`);
        //  console.log(this.domainObject);
    },
    methods: {
        removeCondition(ev) {
            const conditionDiv = ev.target.closest('.conditionArea');
            const conditionCollectionDiv = conditionDiv.closest('.condition-collection');
            const index = Array.from(conditionCollectionDiv.children).indexOf(conditionDiv);

            this.domainObject.configuration.conditionCollection.splice(index, 1);
            this.persist()
        },
        persist(index) {
            if (index) {
                this.openmct.objects.mutate(this.domainObject, `configuration.conditionCollection[${index}]`, this.domainObject.configuration.conditionCollection[index]);
            } else {
                this.openmct.objects.mutate(this.domainObject, 'configuration.conditionCollection', this.domainObject.configuration.conditionCollection);
            }
        }
    }
}
</script>
