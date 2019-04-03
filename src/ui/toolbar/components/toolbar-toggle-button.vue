<template>
    <div class="c-ctrl-wrapper">
        <div class="c-icon-button"
             :title="nextValue.title"
             :class="nextValue.icon"
             @click="cycle">
        </div>
    </div>
</template>

<script>
export default {
    props: {
        options: {
            type: Object
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
        }
    },
    methods: {
        cycle() {
            this.$emit('change', this.nextValue.value, this.options);
        }
    }
};
</script>
