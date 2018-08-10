<template>
    <ul class="c-tree">
        <li class="c-tree__item-h">
            <div class="c-tree__item" onclick="alert('tree item click');">
                <span class="c-view-control"></span>
                <span class="c-object-name icon-folder">
                  Tree item x with a long name that forces ellipsis to occur
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
    @import "~styles/constants";

    .c-tree {
        .c-tree {
            display: none;
            margin-left: 20px;
        }

        &__item {
            border-radius: 5px;
            display: flex;
            flex-flow: row nowrap;
            align-items: center;
            cursor: pointer;
            padding: 5px;

            &:hover {
                background: rgba(white, 0.2);
            }

            .c-view-control {
                // TODO: move this into a future view-control component or the _controls.scss file
                $d: 11px;
                background: rgba(red, 0.4);
                display: inline-block;
                flex: 0 0 auto;
                height: $d;
                width: $d;
                margin-right: 5px;
            }
        }
    }
</style>

<script>
    export default {
    }
</script>
