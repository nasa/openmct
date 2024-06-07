<template>
<div
    class="c-search"
    :class="{ 'is-active': active === true }"
>
    <input
        class="c-search__input"
        aria-label="Search Input"
        tabindex="0"
        type="search"
        v-bind="$attrs"
        :value="value"
        @click="() => $emit('click')"
        @input="($event) => $emit('input', $event.target.value)"
    >
    <a
        class="c-search__clear-input icon-x-in-circle"
        @click="clearInput"
    ></a>
    <slot></slot>
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
    watch: {
        value(inputValue) {
            this.active = inputValue.length > 0;
        }

    },
    methods: {
        clearInput() {
            // Clear the user's input and set 'active' to false
            this.$emit('clear', '');
            this.active = false;
        }
    }
};
</script>