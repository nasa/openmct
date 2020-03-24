<template>
<li class="c-tree__item-h">
    <div
        class="c-tree__item"
        :class="{ 'is-alias': isAlias, 'is-navigated-object': navigated }"
        @click="handleItemSelected(node.object, node)"
    >
        <view-control
            v-model="expanded"
            class="c-tree__item__view-control"
            :enabled="hasChildren"
            :propagate="false"
        />
        <div class="c-tree__item__label c-object-label">
            <div
                class="c-tree__item__type-icon c-object-label__type-icon"
                :class="typeClass"
            ></div>
            <div class="c-tree__item__name c-object-label__name">{{ node.object.name }}</div>
        </div>
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
        <condition-set-dialog-tree-item
            v-for="child in children"
            :key="child.id"
            :node="child"
            :selected-item="selectedItem"
            :handle-item-selected="handleItemSelected"
        />
    </ul>
</li>
</template>

<script>
import viewControl from '@/ui/components/viewControl.vue';

export default {
    name: 'ConditionSetDialogTreeItem',
    inject: ['openmct'],
    components: {
        viewControl
    },
    props: {
        node: {
            type: Object,
            required: true
        },
        selectedItem: {
            type: Object,
            default() {
                return undefined;
            }
        },
        handleItemSelected: {
            type: Function,
            default() {
                return (item) => {};
            }
        }
    },
    data() {
        return {
            hasChildren: false,
            isLoading: false,
            loaded: false,
            children: [],
            expanded: false
        }
    },
    computed: {
        navigated() {
            const itemId = this.selectedItem && this.selectedItem.itemId;
            const isSelectedObject = itemId && this.openmct.objects.areIdsEqual(this.node.object.identifier, itemId);
            if (isSelectedObject && this.node.objectPath && this.node.objectPath.length > 1) {
                const isParent = this.openmct.objects.areIdsEqual(this.node.objectPath[1].identifier, this.selectedItem.parentId);
                return isSelectedObject && isParent;
            }
            return isSelectedObject;
        },
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

    },
    beforeDestroy() {
        this.expanded = false;
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
        }
    }
}
</script>
