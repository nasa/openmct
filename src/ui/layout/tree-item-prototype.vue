<template>
    <li class="c-tree__item-h">
        <div class="c-tree__item"
            :class="{ 'is-alias': isAlias, 'is-navigated-object': isNavigated }">
            <view-control class="c-tree__item__view-control"
                          :enabled="hasChildren"
                          v-model="expanded">
            </view-control>
            <object-label :domainObject="node.object"
                          :objectPath="node.objectPath"
                          :navigateToPath="navigateToPath">
            </object-label>
        </div>
    </li>
</template>

<script>
    import viewControl from '../components/viewControl.vue';
    import ObjectLabel from '../components/ObjectLabel.vue';

    export default {
        name: 'tree-item',
        inject: ['openmct'],
        props: {
            node: Object,
            isExpanded: {
                default: false,
                type: Boolean
            }
        },
        data() {
            this.navigateToPath = this.buildPathString(this.node.navigateToParent)
            return {
                hasChildren: false,
                isLoading: false,
                loaded: false,
                isNavigated: this.navigateToPath === this.openmct.router.currentLocation.path,
                children: [],
                expanded: this.isExpanded
            }
        },
        computed: {
            isAlias() {
                let parent = this.node.objectPath[1];
                if (!parent) {
                    return false;
                }
                let parentKeyString = this.openmct.objects.makeKeyString(parent.identifier);
                return parentKeyString !== this.node.object.location;
            }
        },
        watch: {
            expanded(isExpanded) {
                if (isExpanded) {
                    this.$emit('expanded', this.node);
                } else {
                    this.$emit('notExpanded', this.node);
                }
            }
        },
        mounted() {
            this.domainObject = this.node.object;
            let removeListener = this.openmct.objects.observe(this.domainObject, '*', (newObject) => {
                this.domainObject = newObject;
            });

            this.$once('hook:destroyed', removeListener);
            if (this.openmct.composition.get(this.node.object)) {
                this.hasChildren = true;
            }

            this.openmct.router.on('change:path', this.highlightIfNavigated);
        },
        destroyed() {
            this.openmct.router.off('change:path', this.highlightIfNavigated);
        },
        methods: {
            buildPathString(parentPath) {
                return [parentPath, this.openmct.objects.makeKeyString(this.node.object.identifier)].join('/');
            },
            highlightIfNavigated(newPath, oldPath){
                if (newPath === this.navigateToPath) {
                    this.isNavigated = true;
                } else if (oldPath === this.navigateToPath) {
                    this.isNavigated = false;
                }
            }
        },
        components: {
            viewControl,
            ObjectLabel
        }
    }
</script>
