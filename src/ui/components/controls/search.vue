<template>
    <div class="c-search"
        :class="{ 'is-active': active === true }">
        <!-- before will be the mag glass icon, set via CSS -->
        <input class="c-search__input" type="search"/>
        <a class="c-search__clear-input icon-x-in-circle"></a>
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
            transition: width, padding, opacity 250ms ease;
        }

        &__input {
            background: none  !important;
            box-shadow: none !important; // !important needed to override default for [input]
            flex: 1 1 100%;
            padding-left: 0 !important;
            padding-right: 0 !important;
            width: 100%; // Width must be set to allow input to collapse below browser min
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
            active: String
        }
    }
</script>
