<template>
    <div class="c-ctrl-wrapper">
        <div class="c-click-icon"
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
    data() {
        return {
            value: this.options.value
        };
    },
    computed: {
        nextValue() {
            let currentValue = this.options.options.filter((v) => this.value == v.value)[0];
            let nextIndex = this.options.options.indexOf(currentValue) + 1;
            if (nextIndex >= this.options.options.length) {
                nextIndex = 0;
            }
            return this.options.options[nextIndex];
        }
    },
    methods: {
        cycle() {
            this.value = this.nextValue.value;
            this.$emit('change', this.value, this.options);
        }
    },
};
</script>
