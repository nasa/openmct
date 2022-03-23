<template>
<div
    :style="treeItemStyles"
    class="c-tree__item-h"
>
    <div
        class="c-tree__item"
        :class="{
            'is-alias': isAlias,
            'is-navigated-object': shouldHightlight,
            'is-context-clicked': contextClickActive,
            'is-new': isNewItem
        }"
        @click.capture="itemClick"
        @contextmenu.capture="handleContextMenu"
    >
        <view-control
            ref="action"
            class="c-tree__item__view-control"
            :value="isOpen || isLoading"
            :enabled="!activeSearch && hasComposition"
            @input="itemAction()"
        />
        <object-label
            ref="objectLabel"
            :domain-object="node.object"
            :object-path="node.objectPath"
            :navigate-to-path="navigationPath"
            @context-click-active="setContextClickActive"
        />
        <span
            v-if="isLoading"
            class="loading"
        ></span>
    </div>
</div>
</template>

<script>
import viewControl from '../components/viewControl.vue';
import ObjectLabel from '../components/ObjectLabel.vue';

export default {
    name: 'TreeItem',
    components: {
        viewControl,
        ObjectLabel
    },
    inject: ['openmct'],
    props: {
        node: {
            type: Object,
            required: true
        },
        isSelectorTree: {
            type: Boolean,
            required: true
        },
        selectedItem: {
            type: Object,
            required: true
        },
        activeSearch: {
            type: Boolean,
            default: false
        },
        leftOffset: {
            type: String,
            default: '0px'
        },
        isNew: {
            type: Boolean,
            default: false
        },
        itemIndex: {
            type: Number,
            required: false,
            default: undefined
        },
        itemOffset: {
            type: Number,
            required: false,
            default: undefined
        },
        itemHeight: {
            type: Number,
            required: false,
            default: 0
        },
        openItems: {
            type: Array,
            required: true
        },
        loadingItems: {
            type: Object,
            required: true
        }
    },
    data() {
        this.navigationPath = this.node.navigationPath;

        return {
            hasComposition: false,
            navigated: this.isNavigated(),
            contextClickActive: false
        };
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
        isSelectedItem() {
            return this.selectedItem.objectPath === this.node.objectPath;
        },
        isNewItem() {
            return this.isNew;
        },
        isLoading() {
            return Boolean(this.loadingItems[this.navigationPath]);
        },
        isOpen() {
            return this.openItems.includes(this.navigationPath);
        },
        shouldHightlight() {
            if (this.isSelectorTree) {
                return this.isSelectedItem;
            } else {
                return this.navigated;
            }
        },
        treeItemStyles() {
            let itemTop = (this.itemOffset + this.itemIndex) * this.itemHeight + 'px';

            return {
                'top': itemTop,
                'position': 'absolute',
                'padding-left': this.leftOffset
            };
        }
    },
    mounted() {
        this.domainObject = this.node.object;

        if (this.openmct.composition.get(this.domainObject)) {
            this.hasComposition = true;
        }

        this.openmct.router.on('change:path', this.highlightIfNavigated);

        this.$emit('tree-item-mounted', this.navigationPath);
    },
    destroyed() {
        this.openmct.router.off('change:path', this.highlightIfNavigated);
        this.$emit('tree-item-destoyed', this.navigationPath);
    },
    methods: {
        itemAction() {
            this.$emit('tree-item-action', this.isOpen || this.isLoading ? 'close' : 'open');
        },
        itemClick(event) {
            // skip for navigation, let viewControl handle click
            if (this.$refs.action.$el === event.target) {
                return;
            }

            event.stopPropagation();

            if (!this.isSelectorTree) {
                this.$refs.objectLabel.navigateOrPreview(event);
            } else {
                this.$emit('tree-item-selection', this.node);
            }
        },
        handleContextMenu(event) {
            event.stopPropagation();

            if (this.isSelectorTree) {
                return;
            }

            this.$refs.objectLabel.showContextMenu(event);
        },
        isNavigated() {
            return this.navigationPath === this.openmct.router.currentLocation.path;
        },
        highlightIfNavigated() {
            this.navigated = this.isNavigated();
        },
        setContextClickActive(active) {
            this.contextClickActive = active;
        }
    }
};
</script>
