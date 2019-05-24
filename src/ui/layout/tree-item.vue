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
            <template v-if="children.length">
                
                <li v-if="page > 1 && children.length > page_threshold"
                    @click="previousPage"
                    class="c-tree__item-h"
                    style="font-size: 0.7em">
                    <div class="c-tree__item">
                        <a class="c-tree__item__label c-object-label"
                            style="padding: 0;">
                            <div class="c-tree__item__type-icon c-object-label__type-icon icon-arrow-up"></div>
                            <div class="c-tree__item__name c-object-label__name">Load Earlier Items</div>
                        </a>
                    </div>
                </li>

                <tree-item v-for="child in splitChildren"
                        :key="child.id"
                        :node="child">
                </tree-item>

                <li v-if="page < lastPage && children.length > page_threshold"
                    @click="nextPage"
                    class="c-tree__item-h"
                    style="font-size: 0.7em">
                    <div class="c-tree__item">
                        <a class="c-tree__item__label c-object-label"
                            style="padding: 0;">
                            <div class="c-tree__item__type-icon c-object-label__type-icon icon-arrow-down"></div>
                            <div class="c-tree__item__name c-object-label__name">Load More Items</div>
                        </a>
                    </div>
                </li>
            </template>
        </ul>
    </li>
</template>

<script>
    import viewControl from '../components/viewControl.vue';
    import ObjectLabel from '../components/ObjectLabel.vue';

    const PAGE_THRESHOLD = 25;

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
                expanded: false,
                page: 1,
                page_threshold: PAGE_THRESHOLD
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
            },
            splitChildren() {
                if (this.children.length > this.page_threshold) {
                    let maxIndex = this.page * this.page_threshold,
                        minIndex = maxIndex - this.page_threshold;

                    return this.children.slice(minIndex, maxIndex);
                } else {
                    return this.children;
                }
            },
            lastPage() {
                return Math.floor(this.children.length / this.page_threshold);
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
                this.children.push({
                    id: this.openmct.objects.makeKeyString(child.identifier),
                    object: child,
                    objectPath: [child].concat(this.node.objectPath),
                    navigateToParent: this.navigateToPath
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
            },
            nextPage() {
                if (this.page <= this.lastPage) {
                    this.page += 1;
                }
            },
            previousPage() {
                if (this.page >= 1) {
                    this.page -= 1;
                }
            }
        },
        components: {
            viewControl,
            ObjectLabel
        }
    }
</script>
