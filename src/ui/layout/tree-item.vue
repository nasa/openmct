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

const LOCAL_STORAGE__TREE_STATE_ID = 'mct-tree--';

function makeLocalStorageStateKey(id) {
    return `${LOCAL_STORAGE__TREE_STATE_ID}${id}`;
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
            this.setLocalStorageState();
        },
        navigated() {
            this.setLocalStorageState();
        }
    },
    beforeMount() {
        this.initLocalStorageState();
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
        this.getLocalStorageState();
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
            this.removeLocalStorageState(makeLocalStorageStateKey(removeId));
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
        initLocalStorageState() {
            this.key = makeLocalStorageStateKey(this.openmct.objects.makeKeyString(this.node.object.identifier))
            this.state = {
                expanded: [],
                navigated: ''
            };
        },
        getLocalStorageState() {
            const state = localStorage.getItem(this.key);

            if (state) {
                this.state = JSON.parse(state);
                console.log(this.state.navigated)
                console.log(this.navigateToPath)
                this.expanded = this.state.expanded.includes(this.navigateToPath);
                this.navigated = this.state.navigated === this.navigateToPath;
            } else {
                this.setLocalStorageState();
            }
        },
        setLocalStorageState() {
            this.state.expanded = this.expanded
                ? [...new Set([this.navigateToPath, ...this.state.expanded])]
                : this.state.expanded.filter(path => path !== this.navigateToPath);
            this.state.navigated = this.navigated ? this.navigateToPath : '';

            if ((this.state.expanded && this.state.expanded.length) || this.state.navigated) {
                localStorage.setItem(this.key, JSON.stringify(this.state));
            } else {
                this.removeLocalStorageState(this.key);
            }
        },
        removeLocalStorageState(key) {
            localStorage.removeItem(key);
        }
    }
}
</script>
