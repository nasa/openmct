<template>
<label class="c-toggle-switch">
    <input
        :id="id"
        type="checkbox"
        :checked="checked"
        @change="onUserSelect($event)"
    >
    <span class="c-toggle-switch__slider"></span>
</label>
</template>

<script>
export default {
    inject: ['openmct'],
    props: {
        id: {
            type: String,
            required: true
        },
        checked: Boolean
    },
    methods: {
        onUserSelect(event) {
            this.$emit('change', event.target.checked);
        }
    }
}
</script>
