<template>
<div
    class="c-search"
    :class="{ 'is-active': active === true }"
>
    <input
        class="c-search__input"
        tabindex="10000"
        type="search"
        v-bind="$attrs"
        :value="value"
        v-on="inputListeners"
    >
    <a
        class="c-search__clear-input icon-x-in-circle"
        @click="clearInput"
    ></a>
</div>
</template>

<script>
/* Emits input and clear events */
export default {
    inheritAttrs: false,
    props: {
        value: {
            type: String,
            default: ''
        }
    },
    data: function () {
        return {
            active: false
        };
    },
    computed: {
        inputListeners: function () {
            let vm = this;

            return Object.assign({},
                this.$listeners,
                {
                    input: function (event) {
                        vm.changeInputValue(event.target.value);
                    }
                }
            );
        }
    },
    mounted() {
        this.changeInputValue(this.value);
    },
    watch: {
        value(inputValue) {
            if (!inputValue.length) {
                this.clearInput();
            } else {
                this.changeInputValue(inputValue);
            }
        }
    },
    methods: {
        changeInputValue(value) {
            this.$emit('input', value);
            this.active = (value.length > 0);
        },
        clearInput() {
            // Clear the user's input and set 'active' to false
            this.$emit('clear', '');
            this.active = false;
        }
    }
};
</script>
