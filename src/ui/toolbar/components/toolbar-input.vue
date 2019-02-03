<template>
    <div class="c-labeled-input"
        :title="options.title">
        <label :for="uid">
            <div class="c-labeled-input__label">{{ options.label }}</div>
        </label>
        <input :id="uid"
               :type="options.type"
               :value="options.value"
               v-bind="options.attrs"
               @change="onChange"/>
    </div>
</template>

<script>

let inputUniqueId = 100;

export default {
    props: {
        options: {
            type: Object,
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
    methods: {
        onChange(event) {
            let value = event.target.value;

            if (this.options.type === 'number') {
                value = event.target.valueAsNumber;
            }

            this.$emit('change', value, this.options);
        }
    }
}
</script>
