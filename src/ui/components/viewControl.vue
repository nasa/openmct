<template>
<span
    class="c-disclosure-triangle"
    :class="{
        'c-disclosure-triangle--expanded' : value,
        'is-enabled' : enabled
    }"
    @click="$emit('input', !value)"
/>
</template>

<script>
export default {
    props: {
        value:  {
            type: Boolean,
            default: false
        },
        enabled: {
            // Provided to allow the view-control to still occupy space without displaying a control icon.
            // Used as such in the tree - when a node doesn't have children, set disabled to true.
            type: Boolean,
            default: false
        }
    }
}
</script>
