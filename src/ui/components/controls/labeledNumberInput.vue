<template>
    <div class="c-labeled-input"
        :title="title">
        <div class="c-labeled-input__label">{{ label }}</div>
        <input type="number"
               v-bind="$attrs"
               v-bind:value="value"
               v-on="inputListeners"/>
    </div>
</template>

<style lang="scss">
    @import "~styles/sass-base";
    @import "~styles/controls";

    /******************************* SEARCH */
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
    }
</style>

<script>
    /* Emits input and clear events */
    export default {
        inheritAttrs: false,
        props: {
            value: Number,
            label: String,
            title: String
        },
        computed: {
            inputListeners: function () {
                let vm = this;
                return Object.assign({},
                    this.$listeners,
                    {
                        input: function (event) {
                            vm.$emit('input', event.target.value);
                        },
                        change: function (event) {
                            vm.$emit('change', event.target.value);
                        }
                    }
                )
            }
        },
        data: function() {
            return {
                // active: false
            }
        },
        methods: {
            clearInput() {
                // Clear the user's input and set 'active' to false
                this.value = '';
                this.$emit('clear','');
                this.active = false;
            }
        }
    }
</script>
