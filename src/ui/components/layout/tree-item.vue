<template>
    <li class="c-tree__item-h">
        <div class="c-tree__item">
            <view-control class="c-tree__item__view-control"
                          :expanded="expanded"
                          @click="toggleChildren">
            </view-control>
            <span class="c-tree__item__name c-object-name icon-folder"
                  :class="node.cssClass">
                <span class="c-object-name__name">{{ node.name }}</span>
            </span>
        </div>
        <ul v-if="expanded" class="c-tree">
            <tree-item v-for="child in node.children"
                       :key="child.id"
                       :node="child"
                       >
            </tree-item>
        </ul>
    </li>
</template>

<script>
    import viewControl from '../controls/viewControl.vue'
    export default {
        name: 'tree-item',
        props: {
            node: Object
        },
        data() {
            return {
                expanded: false
            }
        },
        methods: {
            toggleChildren: function () {
                this.expanded = !this.expanded;
            }
        },
        components: {
            viewControl
        }
    }
</script>
