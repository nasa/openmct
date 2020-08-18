<template>
<div class="c-ctrl-wrapper">
    <div
        class="c-icon-button"
        :title="nextValue.title"
        :class="[nextValue.icon, {'c-icon-button--mixed': nonSpecific}]"
        @click="cycle"
    ></div>
</div>
</template>

<script>
export default {
    props: {
        options: {
            type: Object,
            required: true
        }
    },
    computed: {
        nextValue() {
            let currentValue = this.options.options.filter((v) => this.options.value === v.value)[0];
            let nextIndex = this.options.options.indexOf(currentValue) + 1;
            if (nextIndex >= this.options.options.length) {
                nextIndex = 0;
            }

            return this.options.options[nextIndex];
        },
        nonSpecific() {
            return this.options.nonSpecific === true;
        }
    },
    methods: {
        cycle() {
            if (this.options.isEditing === undefined || this.options.isEditing) {
                this.$emit('change', this.nextValue.value, this.options);
            }
        }
    }
};
</script>
