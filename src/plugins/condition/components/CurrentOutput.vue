<template>
<section id="current-output">
    <div v-if="condition"
         class="c-cs__ui__header"
    >
        <span class="c-cs__ui__header-label">Current Output</span>
        <span
            class="is-enabled flex-elem"
            :class="['c-cs__disclosure-triangle', { 'c-cs__disclosure-triangle--expanded': expanded }]"
            @click="expanded = !expanded"
        ></span>
    </div>
    <div v-if="expanded && condition"
         class="c-cs__ui_content"
    >
        <div>
            <span class="current-output">{{ condition.definition.output }}</span>
        </div>
    </div>
</section>
</template>

<script>
export default {
    inject: ['openmct', 'domainObject'],
    props: {
        isEditing: Boolean,
        condition: {
            default: () => {return null;},
            type: Object
        }
    },
    data() {
        return {
            expanded: true
        }
    },
    mounted() {
    },
    updated() {

    },
    methods: {

    }
}
</script>
