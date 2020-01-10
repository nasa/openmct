<template>
<div class="conditionArea c-cs-editui__conditions"
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
            >[condition name]
            </span>
            <span v-if="isDefault"
                  class="condition-description"
            >When all else fails
            </span>
            <span v-else
                  class="condition-description"
            >[condition description]
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
                                    <input class="t-rule-name-input"
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
        isDefault: Boolean
    },
    data() {
        // console.log(`domainObject: ${domainObject}`);
        return {
            expanded: true
        };
    },
    mounted() {
        // console.log(`currentObjectPath: ${this.currentObjectPath.name}`);
        //  console.log(this.domainObject);
    },
    methods: {
        removeCondition(ev) {
            let conditionDiv = ev.target.closest('.conditionArea');
            let conditionCollectionDiv = conditionDiv.closest('.condition-collection');
            let index = Array.from(conditionDiv.parentNode.children).indexOf(conditionDiv)

            //Array.from(element.parentNode.children).indexOf(element)
            //console.log(`conditionDiv.nodeName: ${conditionDiv.nodeName}`);
            console.log(`index: ${index}`);
            console.log(`conditionCollectionDiv.children.length: ${conditionCollectionDiv.childNodes.length}`);
            console.log(this.domainObject.configuration.conditionCollection.length);
            // this.conditions.splice(index, 1);
        }
    }
}
</script>
