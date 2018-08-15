<template>
    <div class="c-search"
         :class="{ 'is-active': active === true }">
        <input class="c-search__input" type="search"
               v-bind:value="searchInput"
               @input="handleInput($event)"/>
        <a class="c-search__clear-input icon-x-in-circle"
           v-on:click="clearInput"></a>
    </div>
</template>

<style lang="scss">
    @import "~styles/constants";
    @import "~styles/constants-snow";
    @import "~styles/glyphs";
    @import "~styles/mixins";

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
            flex: 0 1 auto;
            opacity: 0.7;
            overflow: hidden;
            padding: 2px; // Prevents clipping
            transition: width 1000ms ease; // TODO: Figure out why this no longer works...
        }

        &__input {
            background: none  !important;
            box-shadow: none !important; // !important needed to override default for [input]
            flex: 0 1 100%;
            padding-left: 0 !important;
            padding-right: 0 !important;
            min-width: 10px; // Must be set to allow input to collapse below browser min
        }

        &__clear-input {
            display: none;
        }

        &:hover {
            box-shadow: inset rgba(black, 0.7) 0 0px 2px;
            &:before {
                opacity: 0.9;
            }
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
    export default {
        props: {
            value: String
        },
        data: function() {
            return {
                searchInput: '',
                active: false
            }
        },
        methods: {
            handleInput(e) {
                this.searchInput = e.target.value;
                this.active = (this.searchInput.length > 0);
            },
            clearInput() {
                this.searchInput = '';
                this.active = false;
            }
        }
    }
</script>
