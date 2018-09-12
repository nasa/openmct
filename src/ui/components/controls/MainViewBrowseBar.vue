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
                     title="Switch view type"
                     @click="toggleMenu">
                    <span class="c-button__label">Grid</span>
                </div>
                <MenuPlaceholder v-if="showMenu"></MenuPlaceholder>
            </div>
            <!-- Action buttons -->
            <div class="l-browse-bar__actions">
                <div class="l-browse-bar__action c-button icon-eye-open" title="Preview"></div>
                <div class="l-browse-bar__action c-button icon-notebook" title="New Notebook entry"></div>
                <div class="l-browse-bar__action c-button c-button--major icon-pencil" title="Edit"></div>
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

        [class*="__"] {
            // Removes extraneous horizontal white space
            display: inline-flex;
        }

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

            [class*="__"] + [class*="__"] {
                margin-left: $interiorMarginSm;
            }
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

            &:before {
                // Icon
                opacity: 0.5;
                margin-right: $interiorMargin;
            }
        }

        &__object-name {
            flex: 0 1 auto;
        }
    }
</style>
