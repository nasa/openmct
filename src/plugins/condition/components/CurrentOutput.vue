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
            <span class="current-output">{{ currentOutput }}</span>
        </div>
    </div>
</section>
</template>

<script>
export default {
    inject: ['openmct'],
    props: {
        currentOutput: {
            type: String,
            default: ''
        },
        isEditing: Boolean
    },
    data() {
        return {
            expanded: true
        };
    },
    methods: {

    }
}
</script>
