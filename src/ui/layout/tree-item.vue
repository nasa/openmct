<template>
<li class="c-tree__item-h">
    <div
        class="c-tree__item"
        :class="{ 'is-alias': isAlias, 'is-navigated-object': navigated }"
    >
        <view-control
            v-model="expanded"
            class="c-tree__item__view-control"
            :enabled="hasChildren"
        />
        <object-label
            :domain-object="node.object"
            :object-path="node.objectPath"
            :navigate-to-path="navigateToPath"
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
        <tree-item
            v-for="child in children"
            :key="child.id"
            :node="child"
        />
    </ul>
</li>
</template>

<script>
import viewControl from '../components/viewControl.vue';
import ObjectLabel from '../components/ObjectLabel.vue';

const LOCAL_STORAGE_KEY__TREE_NAVIGATED = 'mct-tree-navigated';
const LOCAL_STORAGE_KEY__TREE_EXPANDED = 'mct-tree-expanded';

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
    watch: {
        expanded() {
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
    },
    destroyed() {
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
        }
    }
}
</script>
