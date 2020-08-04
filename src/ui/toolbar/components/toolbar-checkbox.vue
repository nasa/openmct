<template>
<div class="c-custom-checkbox">
    <input
        :id="uid"
        type="checkbox"
        :name="options.name"
        :checked="options.value"
        :disabled="options.disabled"
        @change="onChange"
    >

    <label :for="uid">
        <div class="c-custom-checkbox__box"></div>
        <div class="c-custom-checkbox__label-text">
            {{ options.name }}
        </div>
    </label>
</div>
</template>

<script>
let uniqueId = 100;

export default {
    props: {
        options: {
            type: Object,
            required: true
        }
    },
    data() {
        uniqueId++;

        return {
            uid: `mct-checkbox-id-${uniqueId}`
        };
    },
    methods: {
        onChange(event) {
            this.$emit('change', event.target.checked, {...this.options});
        }
    }
};
</script>
