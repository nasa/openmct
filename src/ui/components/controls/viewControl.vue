<template>
    <span class="c-disclosure-triangle"
    :class="{
        'c-disclosure-triangle--expanded' : expanded,
        'is-enabled' : enabled
    }"
    @click="toggle"></span>
</template>

<script>
    export default {
        props: {
            expanded:  {
                type: Boolean,
                value: false
            },
            enabled: {
                // Provided to allow the view-control to still occupy space without displaying a control icon.
                // Used as such in the tree - when a node doesn't have children, set disabled to true.
                type: Boolean,
                value: false
            }
        },
        methods: {
            toggle(event) {
                this.expanded = !this.expanded;
                this.$emit('click', event);
            }
        }
    }
</script>
