<template>
    <div class="l-browse-bar">
        <div class="l-browse-bar__start">
            <a class="l-browse-bar__nav-to-parent-button c-icon-button icon-pointer-left"></a>
            <div class="l-browse-bar__object-name--w icon-folder">
                <span class="l-browse-bar__object-name c-input-inline">
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
            }
        },
        methods: {
            toggleMenu: function () {
                this.showMenu = !this.showMenu;
            },
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
        &.l-browse-bar,
        [class*="__"] {
            display: flex;
            align-items: center;
        }

        &__start {
            flex: 1 1 100%;
            font-size: 1.4em;
        }

        &__end {
            flex: 0 0 auto;
        }

        &__nav-to-parent-button {
            // This is an icon-button
            $p: $interiorMarginLg;
            margin-right: $interiorMargin;
            padding-left: $p;
            padding-right: $p;
        }

        &__object-name--w:before {
            opacity: 0.5;
            margin-right: $interiorMargin;
        }
    }

</style>