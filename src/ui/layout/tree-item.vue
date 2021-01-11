<template>
<div
    :style="{
        'top': virtualScroll ? itemTop : 'auto',
        'position': virtualScroll ? 'absolute' : 'relative'
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
            v-model="expanded"
            :class="VIEW_CONTROL_CLASS"
            :control-class="'c-nav__up'"
            :enabled="showUp"
            @input="resetTreeHere"
        />
        <object-label
            ref="objectLabel"
            :domain-object="node.object"
            :object-path="node.objectPath"
            :navigate-to-path="navigationPath"
            :style="{ paddingLeft: leftOffset }"
            @context-click-active="setContextClickActive"
        />
        <view-control
            v-model="expanded"
            :class="VIEW_CONTROL_CLASS"
            :control-class="'c-nav__down'"
            :enabled="hasComposition && showDown"
        />
    </div>
</div>
</template>

<script>
import viewControl from '../components/viewControl.vue';
import ObjectLabel from '../components/ObjectLabel.vue';

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
        leftOffset: {
            type: String,
            default: '0px'
        },
        showUp: {
            type: Boolean,
            default: false
        },
        showDown: {
            type: Boolean,
            default: true
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
        virtualScroll: {
            type: Boolean,
            default: false
        }
    },
    data() {
        this.navigationPath = this.node.navigationPath;

        return {
            VIEW_CONTROL_CLASS: 'c-tree__item__view-control',
            hasComposition: false,
            navigated: this.isNavigated(),
            expanded: false,
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
            this.$emit('expanded', this.domainObject);
        }
    },
    mounted() {
        let objectComposition = this.openmct.composition.get(this.node.object);

        this.domainObject = this.node.object;
        let removeListener = this.openmct.objects.observe(this.domainObject, '*', (newObject) => {
            this.domainObject = newObject;
        });

        this.$once('hook:destroyed', removeListener);
        if (objectComposition) {
            this.hasComposition = true;
        }

        this.openmct.router.on('change:path', this.highlightIfNavigated);
    },
    destroyed() {
        this.openmct.router.off('change:path', this.highlightIfNavigated);
    },
    methods: {
        handleClick(event) {
            let classList = [...event.target.classList];

            // ignore for view control, let it handle the click
            if (classList.includes(this.VIEW_CONTROL_CLASS) && classList.includes('is-enabled')) {
                return;
            }

            event.stopPropagation();

            this.$refs.objectLabel.$el.click();
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
        resetTreeHere() {
            this.$emit('resetTree', this.node);
        },
        setContextClickActive(active) {
            this.contextClickActive = active;
        }
    }
};
</script>
