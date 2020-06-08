<template>
<li class="c-tree__item-h">
    <div
        class="c-tree__item"
        :class="{ 'is-alias': isAlias, 'is-navigated-object': navigated }"
        :style="{ paddingLeft: ancestors * 10 + 10 + 'px' }"
    >
        <view-control
            v-model="expanded"
            class="c-tree__item__view-control"
            :enabled="hasChildren && activeChild !== undefined"
            :control-class="'c-nav__up'"
            @input="resetTreeHere"
        />
        <object-label
            :domain-object="node.object"
            :object-path="node.objectPath"
            :navigate-to-path="navigateToPath"
        />
        <view-control
            v-model="expanded"
            class="c-tree__item__view-control"
            :control-class="'c-nav__down'"
            :enabled="hasChildren && !activeChild && !expanded"
        />
    </div>
    <ul
        v-if="expanded"
        class="c-tree"
    >
        <li
            v-if="isLoading && !loaded"
            class="c-tree__item-h"
        >
            <div class="c-tree__item loading">
                <span class="c-tree__item__label">Loading...</span>
            </div>
        </li>
        <template
            v-for="child in children"
        >
            <tree-item
                v-if="activeChild && child.id === activeChild || !activeChild"
                :key="child.id"
                :class="{[childrenSlideClass] : child.id !== activeChild}"
                :node="child"
                :collapse-children="collapseMyChildren"
                :ancestors="ancestors + 1"
                :sync-check="triggerChildSync"
                @expanded="handleExpanded"
                @childState="handleChildState"
            />
        </template>
    </ul>
</li>
</template>

<script>
import viewControl from '../components/viewControl.vue';
import ObjectLabel from '../components/ObjectLabel.vue';

const LOCAL_STORAGE_KEY__TREE_EXPANDED = 'mct-tree-expanded';
const SLIDE_RIGHT = 'slide-right';
const SLIDE_LEFT = 'slide-left';

function copyItem(item) {
    return JSON.parse(JSON.stringify(item));
}

export default {
    name: 'TreeItem',
    inject: ['openmct'],
    components: {
        viewControl,
        ObjectLabel
    },
    props: {
        node: {
            type: Object,
            required: true
        },
        ancestors: {
            type: Number,
            default: 0
        },
        collapseChildren: {
            type: String,
            default: ''
        },
        syncCheck: {
            type: String,
            default: ''
        }
    },
    data() {
        this.navigateToPath = this.buildPathString(this.node.navigateToParent);
        return {
            hasChildren: false,
            isLoading: false,
            loaded: false,
            navigated: this.navigateToPath === this.openmct.router.currentLocation.path,
            children: [],
            expanded: false,
            activeChild: undefined,
            collapseMyChildren: '',
            childrenSlideClass: SLIDE_LEFT,
            triggerChildSync: '',
            onChildrenLoaded: [],
            mountedChildren: [],
            onChildMounted: []
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
        expanded() {
            if (!this.hasChildren) {
                return;
            }
            if(this.expanded) {
                this.$emit('expanded', this.domainObject);
                this.loadChildren();
            }
            this.setLocalStorageExpanded(this.navigateToPath);
        },
        collapseChildren() {
            if(this.collapseChildren) {
                this.expanded = false;
                this.activeChild = undefined;
                this.loaded = false;
                this.children = [];
            }
        },
        syncCheck() {
            let currentLocationPath = this.openmct.router.currentLocation.path;
            if(currentLocationPath) {
                let isAncestor = currentLocationPath.includes(this.navigateToPath);

                // not the currently navigated object, but it is an ancestor
                if(isAncestor && !this.navigated) {
                    let descendantPath = currentLocationPath.split(this.navigateToPath + '/')[1],
                        descendants = descendantPath.split('/'),
                        descendantCount = descendants.length,
                        immediateDescendant = descendants[0];

                    this.activeChild = undefined;

                    if(descendantCount > 1) {
                        this.activeChild = immediateDescendant;
                    }

                    // if current path is not expanded, need to expand (load children) and trigger sync
                    if(!this.expanded) {
                        if(descendantCount > 1) {
                            this.onChildrenLoaded.push(() => {
                                this.triggerChildrenSyncCheck()
                            });
                        }
                        this.expanded = true;

                    // if current path IS expanded, then we need to check that child is mounted
                    // as it could have been unmounted previously if it was not the activeChild
                    } else {
                        let alreadyMounted = this.mountedChildren.includes(immediateDescendant);
                        if(alreadyMounted) {
                            this.triggerChildrenSyncCheck()
                        } else {
                            this.onChildMounted.push({
                                child: immediateDescendant,
                                callback: () => {
                                    this.triggerChildrenSyncCheck()
                                }
                            });
                        }
                    }
                } else {
                    this.expanded = false;
                    this.activeChild = undefined;
                }
            }
        }
    },
    mounted() {
        let objectComposition = this.openmct.composition.get(this.node.object);

        this.$emit('childState', { 
            type: 'mounted',
            id: this.openmct.objects.makeKeyString(this.node.object.identifier),
            name: this.node.object.name
        });

        this.domainObject = this.node.object;
        let removeListener = this.openmct.objects.observe(this.domainObject, '*', (newObject) => {
            this.domainObject = newObject;
        });

        this.$once('hook:destroyed', removeListener);
        if (objectComposition && objectComposition.domainObject.composition.length > 0) {
            this.hasChildren = true;
        }

        this.openmct.router.on('change:path', this.highlightIfNavigated);

        this.getLocalStorageExpanded();
    },
    beforeDestroy() {
        /****
            * calling this.setLocalStorageExpanded explicitly here because for whatever reason,
            * the watcher on this.expanded is not triggering this.setLocalStorageExpanded(),
            * even though Vue documentation states, "At this stage the instance is still fully functional."
        *****/
        this.expanded = false;
        this.setLocalStorageExpanded();
        this.activeChild = undefined;
    },
    destroyed() {
        this.$emit('childState', {
            type: 'destroyed',
            id: this.openmct.objects.makeKeyString(this.domainObject.identifier),
            name: this.domainObject.name
        });
        this.openmct.router.off('change:path', this.highlightIfNavigated);
        if (this.composition) {
            this.composition.off('add', this.addChild);
            this.composition.off('remove', this.removeChild);
            delete this.composition;
        }
    },
    methods: {
        addChild(child) {
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
        loadChildren() {
            if (!this.loaded && !this.isLoading) {
                this.composition = this.openmct.composition.get(this.domainObject);
                this.composition.on('add', this.addChild);
                this.composition.on('remove', this.removeChild);
                this.composition.load().then(this.finishLoading);
                this.isLoading = true;
            }
        },
        finishLoading() {
            this.isLoading = false;
            this.loaded = true;
            // specifically for sync child loading
            for(let callback of this.onChildrenLoaded) {
                callback();
            }
            this.onChildrenLoaded = [];
        },
        triggerChildrenSyncCheck() {
            this.triggerChildSync = this.makeHash();
        },
        buildPathString(parentPath) {
            return [parentPath, this.openmct.objects.makeKeyString(this.node.object.identifier)].join('/');
        },
        highlightIfNavigated(newPath, oldPath) {
            if (newPath === this.navigateToPath) {
                this.navigated = true;
            } else if (oldPath === this.navigateToPath) {
                this.navigated = false;
            }
        },
        getLocalStorageExpanded() {
            let expandedPaths = localStorage.getItem(LOCAL_STORAGE_KEY__TREE_EXPANDED);
            if (expandedPaths) {
                expandedPaths = JSON.parse(expandedPaths);
                this.expanded = expandedPaths.includes(this.navigateToPath);
            }
        },
        // expanded nodes/paths are stored in local storage as an array
        setLocalStorageExpanded() {
            let expandedPaths = localStorage.getItem(LOCAL_STORAGE_KEY__TREE_EXPANDED);
            expandedPaths = expandedPaths ? JSON.parse(expandedPaths) : [];
            if (this.expanded) {
                if (!expandedPaths.includes(this.navigateToPath)) {
                    expandedPaths.push(this.navigateToPath);
                }
            } else {
                // remove this node path and all children paths from stored expanded paths
                expandedPaths = expandedPaths.filter(path => !path.startsWith(this.navigateToPath));
            }

            localStorage.setItem(LOCAL_STORAGE_KEY__TREE_EXPANDED, JSON.stringify(expandedPaths));
        },
        removeLocalStorageExpanded() {
            let expandedPaths = localStorage.getItem(LOCAL_STORAGE_KEY__TREE_EXPANDED);
            expandedPaths = expandedPaths ? JSON.parse(expandedPaths) : [];
            expandedPaths = expandedPaths.filter(path => !path.startsWith(this.navigateToPath));
            localStorage.setItem(LOCAL_STORAGE_KEY__TREE_EXPANDED, JSON.stringify(expandedPaths));
        },
        handleExpanded(expandedObject) {
            this.activeChild = this.openmct.objects.makeKeyString(expandedObject.identifier);
            this.childrenSlideClass = SLIDE_LEFT;
        },
        handleChildState(opts) {
            if(opts.type === 'mounted') {
                this.mountedChildren.push(opts.id);
                if(this.onChildMounted.length && this.onChildMounted[0].child === opts.id) {
                    this.onChildMounted[0].callback();
                    this.onChildMounted = [];
                }
            } else {
                if(this.mountedChildren.includes(opts.id)) {
                    let removeIndex = this.mountedChildren.indexOf(opts.id);
                    this.mountedChildren.splice(removeIndex, 1);
                }
            }
        },
        resetTreeHere() {
            this.childrenSlideClass = SLIDE_RIGHT;
            this.activeChild = undefined;
            this.collapseMyChildren = this.makeHash();
            this.expanded = true;
        },
        makeHash(length = 20) {
            let hash = String(Date.now()),
                characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            length -= hash.length;
            for (let i = 0; i < length; i++) {
                hash += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            return hash;
        }
    }
}
</script>
