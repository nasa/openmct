<template>
<li class="c-tree__item-h">
    <div
        class="c-tree__item"
        :class="{ 'is-alias': isAlias, 'is-navigated-object': navigated }"
        @click="handleSelection"
    >
        <view-control
            v-model="expanded"
            class="c-tree__item__view-control"
            :enabled="hasChildren"
            :propagate="false"
        />
        <div
            class="c-tree__item__type-icon c-object-label__type-icon"
            :class="typeClass"
        ></div>
        <div class="c-tree__item__name c-object-label__name">{{ node.object.name }}</div>
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
            @itemSelected="handleChildSelection(child.object)"
        />
    </ul>
</li>
</template>

<script>
import viewControl from '@/ui/components/viewControl.vue';

const LOCAL_STORAGE_KEY__TREE_EXPANDED = 'mct-tree-expanded';

export default {
    name: 'TreeItem',
    inject: ['openmct'],
    components: {
        viewControl
    },
    props: {
        node: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            hasChildren: false,
            isLoading: false,
            loaded: false,
            navigated: false,
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
        },
        typeClass() {
            let type = this.openmct.types.get(this.node.object.type);
            if (!type) {
                return 'icon-object-unknown';
            }
            return type.definition.cssClass;
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
        // TODO: should highlight if navigated to.
        // TODO: set isAlias per tree-item

        this.domainObject = this.node.object;
        let removeListener = this.openmct.objects.observe(this.domainObject, '*', (newObject) => {
            this.domainObject = newObject;
        });

        this.$once('hook:destroyed', removeListener);
        if (this.openmct.composition.get(this.node.object)) {
            this.hasChildren = true;
        }

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
                expandedPaths = expandedPaths.filter(path => path && !path.startsWith(this.navigateToPath));
            }

            localStorage.setItem(LOCAL_STORAGE_KEY__TREE_EXPANDED, JSON.stringify(expandedPaths));
        },
        removeLocalStorageExpanded() {
            let expandedPaths = localStorage.getItem(LOCAL_STORAGE_KEY__TREE_EXPANDED);
            expandedPaths = expandedPaths ? JSON.parse(expandedPaths) : [];
            expandedPaths = expandedPaths.filter(path => !path.startsWith(this.navigateToPath));
            localStorage.setItem(LOCAL_STORAGE_KEY__TREE_EXPANDED, JSON.stringify(expandedPaths));
        },
        handleSelection() {
            this.$emit('itemSelected', this.node.object);
        },
        handleChildSelection(item) {
            this.$emit('itemSelected', item);
        }
    }
}
</script>
