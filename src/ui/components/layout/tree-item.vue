<template>
    <li class="c-tree__item-h">
        <div class="c-tree__item">
            <view-control class="c-tree__item__view-control"
                          :enabled="hasChildren"
                          :expanded="expanded"
                          @click="toggleChildren">
            </view-control>
            <a class="c-tree__item__name c-object-name"
               :class="cssClass"
               :href="href">
                <span class="c-object-name__name">{{ node.object.name }}</span>
            </a>
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
    import viewControl from '../controls/viewControl.vue'
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
                cssClass: 'icon-folder'
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
            let type = this.openmct.types.get(this.node.object.type);
            if (type) {
                this.cssClass = type.definition.cssClass;
            } else {
                console.log("Failed to get typeDef for object", this.node.object.name, this.node.object.type);
            }

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
            },
        },
        components: {
            viewControl
        }
    }
</script>
