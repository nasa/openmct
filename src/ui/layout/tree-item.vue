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
        <ul v-if="expanded" class="c-tree">
            <li class="c-tree__item-h"
                v-if="isLoading && !loaded">
                <div class="c-tree__item loading">
                    <span class="c-tree__item__label">Loading...</span>
                </div>
            </li>
            <tree-item v-for="child in children"
                       :key="child.id"
                       :node="child">
            </tree-item>
        </ul>
    </li>
</template>

<script>
    import viewControl from '../components/viewControl.vue';
    import ObjectLabel from '../components/ObjectLabel.vue';

    export default {
        name: 'tree-item',
        inject: ['openmct'],
        props: {
            node: Object
        },
        data() {
            this.navigateToPath = this.buildPathString(this.node.navigateToParent)
            return {
                hasChildren: false,
                isLoading: false,
                loaded: false,
                isNavigated: this.navigateToPath === this.openmct.router.currentLocation.path,
                children: [],
                expanded: false
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
        mounted() {
            // TODO: should update on mutation.
            // TODO: click navigation should not fubar hash quite so much.
            // TODO: should highlight if navigated to.
            // TODO: should have context menu.
            // TODO: should support drag/drop composition
            // TODO: set isAlias per tree-item

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
            if (this.composition) {
                this.composition.off('add', this.addChild);
                this.composition.off('remove', this.removeChild);
                this.children.forEach(child => child.$destroy());
                delete this.composition;
            }
        },
        watch: {
            expanded(isExpanded) {
                if (!this.hasChildren) {
                    return;
                }
                if (!this.loaded && !this.isLoading) {
                    this.composition = this.openmct.composition.get(this.domainObject);
                    this.composition.on('add', this.addChild);
                    this.composition.on('remove', this.removeChild);
                    this.composition.load().then(this.finishLoading);
                    this.isLoading = true;
                }
            }
        },
        methods: {
            addChild (child) {
                child = this.openmct.objects.getMutable(child);
                this.children.push({
                    id: this.openmct.objects.makeKeyString(child.identifier),
                    object: child,
                    objectPath: [child].concat(this.node.objectPath),
                    navigateToParent: this.navigateToPath
                });
            },
            removeChild(identifier) {
                let removeId = this.openmct.objects.makeKeyString(identifier);
                let removed = [];
                this.children = this.children
                    .filter(c => {
                        if(c.id !== removeId) {
                            removed.push(c);
                            return true
                        }
                        return false;
                    });
                removed.forEach(removedChild => removed.$destroy());
            },
            finishLoading () {
                this.isLoading = false;
                this.loaded = true;
            },
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
