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
    />
</div>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    .c-search {
        @include wrappedInput();

        padding-top: 2px;
        padding-bottom: 2px;

        &:before {
            // Mag glass icon
            content: $glyph-icon-magnify;
        }

        &__clear-input {
            display: none;
        }

        &.is-active {
            .c-search__clear-input {
                display: block;
            }
        }

        input[type='text'],
        input[type='search'] {
            text-align: left;
        }
    }
</style>

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
        }
    },
    computed: {
        inputListeners: function () {
            let vm = this;
            return Object.assign({},
                this.$listeners,
                {
                    input: function (event) {
                        vm.$emit('input', event.target.value);
                        vm.active = (event.target.value.length > 0);
                    }
                }
            )
        }
    },
    methods: {
        clearInput() {
            // Clear the user's input and set 'active' to false
            this.$emit('clear','');
            this.active = false;
        }
    }
}
</script>
