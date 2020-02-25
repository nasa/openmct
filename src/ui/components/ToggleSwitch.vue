<template>
<div class="c-toggle-switch">
    <label class="c-toggle-switch__control">
        <input
                :id="id"
                type="checkbox"
                :checked="checked"
                @change="onUserSelect($event)"
        >
        <span class="c-toggle-switch__slider"></span>
    </label>
    <div class="c-toggle-switch__label"
         v-if="label && label.length">{{ label }}
    </div>
</div>
</template>

<script>
    export default {
        inject: ['openmct'],
        props: {
            id: {
                type: String,
                required: true
            },
            label: {
                type: String,
                required: false
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
