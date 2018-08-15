<template>
    <ul class="c-tree">
        <li class="c-tree__item-h">
            <div class="c-tree__item">
                <viewControl class="c-tree__item__view-control"></viewControl>
                <span class="c-tree__item__name c-object-name icon-folder">
                    <span class="c-object-name__name">Tree item x with a long name that forces ellipsis to occur</span>
                </span>
            </div>
            <ul class="c-tree">
                <li class="c-tree__item-h">
                    <div class="c-tree__item" onclick="alert('tree item click');">
                        <span class="c-view-control"></span><span class="c-object-name icon-folder">Tree item y</span>
                    </div>
                </li>
            </ul>
        </li>
    </ul>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    .c-tree {
        .c-tree {
            display: none;
            margin-left: 20px;
        }

        &__item {
            border-radius: $controlCr;
            color: $colorItemTreeFg;
            display: flex;
            align-items: stretch;
            cursor: pointer;
            padding: 5px;
            transition: background 150ms ease;

            &:hover {
                background: $colorItemTreeHoverBg;
                .c-tree__item__name:before {
                    // Type icon
                    color: $colorItemTreeIconHover;
                }
            }

            .c-tree__item__view-control {
                color: $colorItemTreeVC;
                margin-right: $interiorMarginSm;
            }

            &__name {
                &:before {
                    color: $colorItemTreeIcon;
                    width: $treeTypeIconW;
                }
            }
        }
    }

    .c-object-name {
        display: flex;
        align-items: center;
        overflow: hidden;
        white-space: nowrap;

        &:before {
            // Type icon
            display: inline-block;
            font-size: 1.3em;
            margin-right: $interiorMarginSm;
        }

        &__name {
            @include ellipsize();
            display: inline;
        }
    }
</style>

<script>
    import viewControl from '../controls/viewControl.vue'
    export default {
        components: {
            viewControl
        }
    }
</script>
