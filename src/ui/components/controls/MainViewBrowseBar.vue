<template>
    <div class="l-browse-bar">
        <div class="l-browse-bar__start">
            <a class="l-browse-bar__nav-to-parent-button c-icon-button icon-pointer-left"></a>
            <div class="l-browse-bar__object-name--w icon-folder">
                <span class="l-browse-bar__object-name c-input-inline" contenteditable>
                    Object Name Lorem ipsum dolor sit amet
                </span>
            </div>
            <div class="l-browse-bar__context-actions c-disclosure-button"></div>
        </div>

        <div class="l-browse-bar__end">
            <div class="l-browse-bar__view-switcher c-menu-button--w c-menu-button--menus-left">
                <div class="c-menu-button icon-thumbs-strip"
                     @click="toggleMenu">
                    Grid
                </div>
                <MenuPlaceholder v-if="showMenu"></MenuPlaceholder>
            </div>
        </div>


    </div>
</template>

<script>
    import MenuPlaceholder from '../controls/ContextMenu.vue';

    export default {
        props: {
            showMenu: {
                type: Boolean,
                default: false
            },
            editNameEnabled: {
                type: Boolean,
                default: false
            }
        },
        methods: {
            toggleMenu: function () {
                this.showMenu = !this.showMenu;
            }
        },
        components: {
            MenuPlaceholder
        }
    }
</script>

<style lang="scss">
    @import "~styles/sass-base";

    /******************************* START */

    .l-browse-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;

        &__start {
            display: flex;
            align-items: center;
            flex: 1 1 auto;
            font-size: 1.4em;
            margin-right: $interiorMargin;
            min-width: 0; // Forces interior to compress when pushed on
        }

        &__end {
            display: flex;
            align-items: center;
            flex: 0 0 auto;
        }

        &__nav-to-parent-button,
        &__disclosure-button {
            flex: 0 0 auto;
        }

        &__nav-to-parent-button {
            // This is an icon-button
            $p: $interiorMarginLg;
            margin-right: $interiorMargin;
            padding-left: $p;
            padding-right: $p;
        }

        &__object-name--w {
            align-items: center;
            display: flex;
            flex: 0 1 auto;
            min-width: 0;
            @include test();
            &:before {
                // Icon
                opacity: 0.5;
                margin-right: $interiorMargin;
            }
        }

        &__object-name {
            flex: 0 1 auto;
            min-width: 0;
            @include ellipsize();
        }
    }

</style>