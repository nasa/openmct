<template>
<div
    class="c-labeled-input"
    :title="options.title"
>
    <label :for="uid">
        <div class="c-labeled-input__label">{{ options.label }}</div>
    </label>
    <input
        :id="uid"
        :type="options.type"
        :value="options.value"
        v-bind="options.attrs"
    >
</div>
</template>

<script>

let inputUniqueId = 100;

export default {
    props: {
        options: {
            type: Object,
            required: true,
            validator(value) {
                return ['number', 'text'].indexOf(value.type) !== -1;
            }
        }
    },
    data() {
        inputUniqueId++;

        return {
            uid: `mct-input-id-${inputUniqueId}`
        };
    },
    mounted() {
        if (this.options.type === 'number') {
            this.$el.addEventListener('input', this.onInput);
        } else {
            this.$el.addEventListener('change', this.onChange);
        }
    },
    beforeDestroy() {
        if (this.options.type === 'number') {
            this.$el.removeEventListener('input', this.onInput);
        } else {
            this.$el.removeEventListener('change', this.onChange);
        }
    },
    methods: {
        onChange(event) {
            this.$emit('change', event.target.value, this.options);
        },
        onInput(event) {
            this.$emit('change', event.target.valueAsNumber, this.options);
        }
    }
};
</script>
