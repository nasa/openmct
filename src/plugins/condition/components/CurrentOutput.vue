<template>
<section id="current-output">
    <div class="c-cs__ui__header">
        <span class="c-cs__ui__header-label">Current Output</span>
        <span
            class="is-enabled flex-elem"
            :class="['c-cs__disclosure-triangle', { 'c-cs__disclosure-triangle--expanded': expanded }]"
            @click="expanded = !expanded"
        ></span>
    </div>
    <div v-if="expanded"
         class="c-cs__ui_content"
    >
        <div>
            <span class="current-output">{{ conditionCollection[currentConditionIndex].output }}</span>
        </div>
    </div>
</section>
</template>

<script>
export default {
    inject: ['openmct', 'domainObject'],
    props: {
        isEditing: Boolean
    },
    data() {
        let conditionCollection = this.domainObject.configuration.conditionCollection;
        let currentConditionIndex = 0;

        return {
            expanded: true,
            conditionCollection,
            currentConditionIndex
        }
    },
    mounted() {
        this.currentConditionIndex = this.getCurrentConditionIndex();
    },
    methods: {
        getCurrentConditionIndex() {
            let currentConditionIndex;
            this.conditionCollection.forEach((condition, index) => {
                if (condition.isCurrent) {
                    currentConditionIndex = index;
                }
            });
            return currentConditionIndex;
        }
    }
}
</script>
