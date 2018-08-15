<template>
    <ul class="c-tree">
        <li class="c-tree__item-h">
            <div class="c-tree__item">
                <viewControl></viewControl>
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
    @import "~styles/sass-base";

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
