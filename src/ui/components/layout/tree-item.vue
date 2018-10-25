<template>
    <li class="c-tree__item-h">
        <div class="c-tree__item"
            :class="{ 'is-alias' : isAlias }">
            <view-control class="c-tree__item__view-control"
                          :enabled="hasChildren"
                          :expanded="expanded"
                          @click="toggleChildren">
            </view-control>
            <object-label :domainObject="node.object"
                          :objectPath="node.objectPath">
            </object-label>
        </div>
        <ul v-if="expanded" class="c-tree">
            <tree-item v-for="child in children"
                       :key="child.id"
                       :node="child"
                       >
            </tree-item>
        </ul>
    </li>
</template>

<script>
    import viewControl from '../controls/viewControl.vue';
    import ObjectLabel from '../controls/ObjectLabel.vue';

    export default {
        name: 'tree-item',
        inject: ['openmct'],
        props: {
            node: Object
        },
        data() {
            return {
                hasChildren: false,
                isLoading: false,
                loaded: false,
                children: [],
                expanded: false,
                isAlias: false
            }
        },
        mounted() {
            // TODO: should update on mutation.
            // TODO: click navigation should not fubar hash quite so much.
            // TODO: should highlight if navigated to.
            // TODO: should have context menu.
            // TODO: should support drag/drop composition
            // TODO: set isAlias per tree-item

            this.composition = this.openmct.composition.get(this.node.object);
            if (this.composition) {
                this.hasChildren = true;
            }
        },
        destroy() {
            if (this.composition) {
                this.composition.off('add', this.addChild);
                this.composition.off('remove', this.removeChild);
                delete this.composition;
            }
        },
        methods: {
            toggleChildren: function () {
                if (!this.hasChildren) {
                    return;
                }
                this.expanded = !this.expanded;
                if (!this.loaded && !this.isLoading) {
                    this.composition = this.openmct.composition.get(this.node.object);
                    this.composition.on('add', this.addChild);
                    this.composition.on('remove', this.removeChild);
                    this.composition.load().then(this.finishLoading());
                }
            },
            addChild (child) {
                this.children.push({
                    id: this.openmct.objects.makeKeyString(child.identifier),
                    object: child,
                    objectPath: [child].concat(this.node.objectPath)
                });
            },
            removeChild(identifier) {
                let removeId = this.openmct.objects.makeKeyString(identifier);
                this.children = this.children
                    .filter(c => c.id !== removeId);
            },
            finishLoading () {
                this.isLoading = false;
                this.loaded = true;
            }
        },
        components: {
            viewControl,
            ObjectLabel
        }
    }
</script>
