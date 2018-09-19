<template>
    <div class="c-search"
         :class="{ 'is-active': active === true }">
        <input class="c-search__input"
               tabindex="10000"
               type="search"
               v-bind="$attrs"
               v-bind:value="value"
               v-on="inputListeners"/>
        <a class="c-search__clear-input icon-x-in-circle"
           v-on:click="clearInput"></a>
    </div>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    /******************************* SEARCH */
    .c-search {
        @include nice-input();
        display: flex;
        align-items: center;
        padding: 2px 4px;

        &:before {
            // Mag glass icon
            content: $glyph-icon-magnify;
            direction: rtl; // Aligns glyph to right-hand side of container, for transition
            display: block;
            font-family: symbolsfont;
            flex: 0 0 auto;
            opacity: 0.5;
            overflow: hidden;
            padding: 2px 0; // Prevents clipping
            transition: width 250ms ease;
            width: 1em;
        }

        &:hover {
            box-shadow: inset rgba(black, 0.8) 0 0px 2px;
            &:before {
                opacity: 0.9;
            }
        }

        &--major {
            padding: 4px;
        }

        &__input {
            background: none  !important;
            box-shadow: none !important; // !important needed to override default for [input]
            flex: 1 1 auto;
            padding-left: 2px !important;
            padding-right: 2px !important;
            min-width: 10px; // Must be set to allow input to collapse below browser min
        }

        &__clear-input {
            display: none;
        }

        &.is-active {
            &:before {
                padding: 2px 0px;
                width: 0px;
            }

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
            value: String
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
        data: function() {
            return {
                active: false
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
