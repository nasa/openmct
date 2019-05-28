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

                <li v-if="children.length > page_threshold"
                    class="c-tree__item-h"
                    style="font-size: 0.7em">
                    <div class="c-tree__item">
                        <a class="c-tree__item__label c-object-label">
                            <search 
                                :value="searchValue"
                                @input="searchChildren"
                                @clear="searchChildren">
                            </search>
                        </a>
                    </div>
                </li>
                
                <!-- <li v-if="page > 1 && children.length > page_threshold"
                    @click="previousPage"
                    class="c-tree__item-h"
                    style="font-size: 0.7em">
                    <div class="c-tree__item">
                        <a class="c-tree__item__label c-object-label"
                            style="padding: 0;">
                            <div class="c-tree__item__type-icon c-object-label__type-icon icon-arrow-up"></div>
                            <div class="c-tree__item__name c-object-label__name">Load Last {{page_threshold}} items</div>
                        </a>
                    </div>
                </li> -->
                
                <div :style="style"
                     @scroll="scrollPage"
                     ref="scrollParent">
                    <tree-item v-for="child in filteredAndPagedChildren"
                            :key="child.id"
                            :node="child">
                    </tree-item>
                </div>

                <!-- <li v-if="page < lastPage && children.length > page_threshold"
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
                </li> -->
            </template>
        </ul>
    </li>
</template>

<script>
    import viewControl from '../components/viewControl.vue';
    import ObjectLabel from '../components/ObjectLabel.vue';
    import Search from '../components/search.vue';

    const PAGE_THRESHOLD = 50;

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
                page_threshold: PAGE_THRESHOLD,
                searchValue: '',
                filteredChildren: [],
                scrollTop: 0
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
            filteredAndPagedChildren() {
                if (this.searchValue) {
                    this.filteredChildren = this.children.filter((child) => {
                        let searchLowCase = this.searchValue.toLowerCase(),
                            nameLowerCase = child.object.name.toLowerCase();

                        return nameLowerCase.includes(searchLowCase);
                    })
                } else {
                    this.filteredChildren = this.children;
                }

                if (this.filteredChildren.length > this.page_threshold) {
                    let maxIndex = this.page * this.page_threshold,
                        minIndex = maxIndex - this.page_threshold;

                    return this.filteredChildren.slice(minIndex, maxIndex);
                } else {
                    return this.filteredChildren;
                }
            },
            lastPage() {
                return Math.floor(this.filteredChildren.length / this.page_threshold);
            },
            style() {
                let numChildren = this.filteredChildren.length;

                if (!this.$refs.scrollParent || numChildren === 0) {
                    return {};
                }
                
                if ((numChildren * 20) > this.$refs.scrollParent.offsetHeight) {
                    return {
                        "overflow-y": 'scroll',
                        "max-height": (this.page_threshold * 10) + 'px'
                    }
                }
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
                if (this.page < this.lastPage) {
                    this.page += 1;
                }
            },
            previousPage() {
                if (this.page >= 1) {
                    this.page -= 1;
                }
            },
            searchChildren(input) {
                this.searchValue = input;
                this.page = 1;
            },
            scrollPage(event) {
                let offsetHeight = event.target.offsetHeight,
                    scrollTop = event.target.scrollTop,
                    changePage = true;

                window.clearTimeout(this.scrollLoading);

                if (scrollTop > this.scrollTop && scrollTop > offsetHeight) {
                    this.scrollLoading = window.setTimeout(() => {
                        if (this.page < this.lastPage) {
                            this.nextPage();
                            event.target.scrollTop = 1;
                        }
                    }, 250);
                } else if (this.scrollTop <= this.scrollTop && scrollTop <= 0) {
                     this.scrollLoading = window.setTimeout(() => {
                        if (this.page > 1) {
                            this.previousPage();
                            event.target.scrollTop = offsetHeight - 1;
                        }
                    }, 250);
                }
                this.scrollTop = scrollTop;
            }
        },
        components: {
            viewControl,
            ObjectLabel,
            Search
        }
    }
</script>
