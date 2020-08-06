<template>
<span
    :class="[
        controlClass,
        { 'c-disclosure-triangle--expanded' : value },
        {'is-enabled' : enabled }
    ]"
    @click="handleClick"
></span>
</template>

<script>
export default {
    props: {
        value: {
            type: Boolean,
            default: false
        },
        enabled: {
            // Provided to allow the view-control to still occupy space without displaying a control icon.
            // Used as such in the tree - when a node doesn't have children, set disabled to true.
            type: Boolean,
            default: false
        },
        propagate: {
            type: Boolean,
            default: true
        },
        controlClass: {
            type: String,
            default: 'c-disclosure-triangle'
        }
    },
    methods: {
        handleClick(event) {
            this.$emit('input', !this.value);
            if (!this.propagate) {
                event.stopPropagation();
            }
        }
    }
};
</script>
