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
                :root-path="rootPath"
                :node="child"
                :collapse-children="collapseMyChildren"
                :ancestors="ancestors + 1"
                @expanded="handleExpanded"
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
        rootPath: {
            type: String,
            default: ''
        },
        collapseChildren: {
            type: Boolean,
            default: false
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
            collapseMyChildren: false,
            childrenSlideClass: SLIDE_LEFT
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
            console.log('tree-item: watch:expanded - ' + this.domainObject.name, this.expanded);
            if(this.expanded) {
                this.$emit('expanded', this.domainObject);
            }
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
            this.setLocalStorageExpanded(this.navigateToPath);
        },
        collapseChildren() {

            console.log('tree-item: collapseChildren watch: callapse this', this.domainObject.name, this.collapseChildren)
            if(this.collapseChildren) {
                this.expanded = false;
                this.activeChild = undefined;
            }
        }
    },
    beforeMount() {
        console.log('tree-item: beforeMount', this.node.object.name);
    },
    mounted() {
        // TODO: click navigation should not fubar hash quite so much.
        // TODO: should support drag/drop composition
        let objectComposition = this.openmct.composition.get(this.node.object);

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

        console.log('tree-item: mounted - domainObject', this.domainObject.name, this.domainObject);
        console.log('tree-item: mounted - hasChildren', this.hasChildren);
        console.log('tree-item: mounted - expanded', this.expanded);
    },
    beforeDestroy() {
        /****
            * calling this.setLocalStorageExpanded explicitly here because for whatever reason,
            * the watcher on this.expanded is not triggering this.setLocalStorageExpanded(),
            * even though Vue documentation states, "At this stage the instance is still fully functional."
        *****/
        console.log('tree-item: beforeDestroy', this.domainObject.name);
        this.expanded = false;
        this.setLocalStorageExpanded();
        this.activeChild = undefined;
    },
    destroyed() {
        console.log('tree-item: destroyed', this.domainObject.name);
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
        finishLoading() {
            this.isLoading = false;
            this.loaded = true;
        },
        buildPathString(parentPath) {
            return [parentPath, this.openmct.objects.makeKeyString(this.node.object.identifier)].join('/');
        },
        highlightIfNavigated(newPath, oldPath) {
            console.log('tree-item: router change:path | highlightifnavigated - me: ' + this.domainObject.name + ' paths: ', {newPath, oldPath})
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
            console.log('tree-item: getlocalstorageexpanded', {expandedPaths});
        },
        // expanded nodes/paths are stored in local storage as an array
        setLocalStorageExpanded() {
            let expandedPaths = localStorage.getItem(LOCAL_STORAGE_KEY__TREE_EXPANDED);
            expandedPaths = expandedPaths ? JSON.parse(expandedPaths) : [];
            console.log('tree-item: setexpandedpaths', {expandedPaths})
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
            console.log('tree-item: removelocalstorageexpanded')
            let expandedPaths = localStorage.getItem(LOCAL_STORAGE_KEY__TREE_EXPANDED);
            expandedPaths = expandedPaths ? JSON.parse(expandedPaths) : [];
            expandedPaths = expandedPaths.filter(path => !path.startsWith(this.navigateToPath));
            localStorage.setItem(LOCAL_STORAGE_KEY__TREE_EXPANDED, JSON.stringify(expandedPaths));
        },
        handleExpanded(expandedObject) {
            this.activeChild = this.openmct.objects.makeKeyString(expandedObject.identifier);
            this.collapseMyChildren = false; // reset
            this.childrenSlideClass = SLIDE_LEFT;
        },
        resetTreeHere() {
            console.log('tree-item: resetTreeHere - ', this.domainObject.name, this.openmct.objects.makeKeyString(this.domainObject.identifier));
            console.log('tree-item: resetTreeHere - SLIDE RIGHT YO!!!!');
            this.childrenSlideClass = SLIDE_RIGHT;
            this.expanded = true;
            this.activeChild = undefined;
            this.collapseMyChildren = true;
            let expandedPaths = localStorage.getItem(LOCAL_STORAGE_KEY__TREE_EXPANDED);
            if (expandedPaths) {
                expandedPaths = JSON.parse(expandedPaths);
                // expandedPaths.pop();
                console.log('tree-item: resetTreeHere - expandedPaths', {expandedPaths});
                // localStorage.setItem(LOCAL_STORAGE_KEY__TREE_EXPANDED, JSON.stringify(expandedPaths));
            }
        }
    }
}
</script>
