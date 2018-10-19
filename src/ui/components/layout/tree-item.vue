<template>
    <li class="c-tree__item-h">
        <div class="c-tree__item"
            :class="{ 'is-alias' : isAlias }">
            <view-control class="c-tree__item__view-control"
                          :enabled="hasChildren"
                          :expanded="expanded"
                          @click="toggleChildren">
            </view-control>
            <object-label :domainObject="node.object" :urlLink="href"></object-label>
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
                loaded: false,
                children: [],
                expanded: false,
                isAlias: false
            }
        },
        computed: {
            href: function () {
                return '#/browse/' + this.node.path
                    .map(o => this.openmct.objects.makeKeyString(o))
                    .join('/');
            }
        },
        mounted() {
            // TODO: should update on mutation.
            // TODO: click navigation should not fubar hash quite so much.
            // TODO: should highlight if navigated to.
            // TODO: should have context menu.
            // TODO: should support drag/drop composition
            // TODO: set isAlias per tree-item

            let composition = this.openmct.composition.get(this.node.object);
            if (!composition) {
                return;
            }
            this.hasChildren = true;
        },
        methods: {
            toggleChildren: function () {
                this.expanded = !this.expanded;
                if (this.expanded && !this.loaded && this.hasChildren) {
                    this.openmct.composition.get(this.node.object).load()
                        .then(children => {
                            this.children = children.map((c) => {
                                return {
                                    id: this.openmct.objects.makeKeyString(c.identifier),
                                    object: c,
                                    path: this.node.path.concat([c.identifier])
                                };
                            });
                        })
                        .then(() => this.loaded = true);
                }
            }
        },
        components: {
            viewControl,
            ObjectLabel
        }
    }
</script>
