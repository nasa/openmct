<template>
<section id="current-output"
         class="current-output"
>
    <div class="c-cs__ui__header">
        <span class="c-cs__ui__header-label">Current Output</span>
        <span
            class="c-disclosure-triangle is-enabled flex-elem"
            :class="{'c-disclosure-triangle--expanded': expanded}"
        ></span>
    </div>
    <div class="c-cs__ui_text">
        <span>{{ currentOutput }}</span>
    </div>
</section>
</template>

<script>
export default {
    inject: ['openmct'],
    props: {
        currentOutput: String,
        isEditing: Boolean
    },
    data() {
        return {
            expanded: true,
        };
    },
    methods: {
    }
}
</script>