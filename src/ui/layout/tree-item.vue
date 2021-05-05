<template>
<div
    :style="{
        'top': itemTop,
        'position': 'absolute',
        'padding-left': leftOffset
    }"
    class="c-tree__item-h"
>
    <div
        class="c-tree__item"
        :class="{
            'is-alias': isAlias,
            'is-navigated-object': navigated,
            'is-context-clicked': contextClickActive
        }"
        @click.capture="handleClick"
        @contextmenu.capture="handleContextMenu"
    >
        <view-control
            ref="navigate"
            v-model="expanded"
            class="c-tree__item__view-control"
            :enabled="!activeSearch && hasComposition"
        />
        <object-label
            ref="objectLabel"
            :domain-object="node.object"
            :object-path="node.objectPath"
            :navigate-to-path="navigationPath"
            @context-click-active="setContextClickActive"
        />
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
        isOpen: {
            type: Boolean,
            default: false
        },
        activeSearch: {
            type: Boolean,
            default: false
        },
        leftOffset: {
            type: String,
            default: '0px'
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
        }
    },
    data() {
        this.navigationPath = this.node.navigationPath;

        return {
            hasComposition: false,
            navigated: this.isNavigated(),
            expanded: this.isOpen,
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
        itemTop() {
            return (this.itemOffset + this.itemIndex) * this.itemHeight + 'px';
        }
    },
    watch: {
        expanded() {
            this.$emit('expanded');
        }
    },
    mounted() {
        this.domainObject = this.node.object;

        if (this.openmct.composition.get(this.domainObject)) {
            this.hasComposition = true;
        }

        this.openmct.router.on('change:path', this.highlightIfNavigated);

    },
    destroyed() {
        this.openmct.router.off('change:path', this.highlightIfNavigated);
        this.$emit('tree-item-destoyed', this.navigationPath);
    },
    methods: {
        handleClick(event) {
            // skip for navigation, let viewControl handle click
            if (this.$refs.navigate.$el === event.target) {
                return;
            }

            event.stopPropagation();
            this.$refs.objectLabel.navigateOrPreview(event);
        },
        handleContextMenu(event) {
            event.stopPropagation();
            this.$refs.objectLabel.showContextMenu(event);
        },
        isNavigated() {
            return this.navigationPath === this.openmct.router.currentLocation.path;
        },
        highlightIfNavigated() {
            this.navigated = this.isNavigated();
        },
        // listenForCompositionChanges() {
        //     this.removeListener = this.openmct.objects.observe(this.domainObject, 'composition', (composition) => {
        //         console.log('composition changes for', this.domainObject.name);
        //         this.$emit('composition-change', composition);
        //     });
        // },
        setContextClickActive(active) {
            this.contextClickActive = active;
        }
    }
};
</script>
