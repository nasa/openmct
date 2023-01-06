<template>
<div
    class="l-pane"
    :class="paneClasses"
>
    <div
        v-if="handle"
        class="l-pane__handle"
        @mousedown.prevent="startResizing"
    ></div>
    <div class="l-pane__header">
        <span
            v-if="label"
            class="l-pane__label"
        >{{ label }}</span>
        <slot name="controls"></slot>
        <button
            v-if="isCollapsable"
            class="l-pane__collapse-button c-icon-button"
            @click="toggleCollapse"
        ></button>
    </div>
    <button
        class="l-pane__expand-button"
        @click="toggleCollapse"
    >
        <span class="l-pane__expand-button__label">{{ label }}</span>
    </button>
    <div class="l-pane__contents">
        <slot></slot>
    </div>
</div>
</template>

<script>
const COLLAPSE_THRESHOLD_PX = 40;

export default {
    inject: ['openmct'],
    props: {
        handle: {
            type: String,
            default: '',
            validator: function (value) {
                return ['', 'before', 'after'].indexOf(value) !== -1;
            }
        },
        label: {
            type: String,
            default: ''
        },
        hideParam: {
            type: String,
            default: ''
        }
    },
    data() {
        return {
            collapsed: false,
            resizing: false
        };
    },
    computed: {
        isCollapsable() {
            return this.hideParam?.length > 0;
        },
        paneClasses() {
            return {
                'l-pane--horizontal-handle-before': this.type === 'horizontal' && this.handle === 'before',
                'l-pane--horizontal-handle-after': this.type === 'horizontal' && this.handle === 'after',
                'l-pane--vertical-handle-before': this.type === 'vertical' && this.handle === 'before',
                'l-pane--vertical-handle-after': this.type === 'vertical' && this.handle === 'after',
                'l-pane--collapsed': this.collapsed,
                'l-pane--reacts': !this.handle,
                'l-pane--resizing': this.resizing === true
            };
        }
    },
    beforeMount() {
        this.type = this.$parent.type;
        this.styleProp = (this.type === 'horizontal') ? 'width' : 'height';
    },
    async mounted() {
        await this.$nextTick();
        // Hide tree and/or inspector pane if specified in URL
        if (this.isCollapsable) {
            this.handleHideUrl();
        }
    },
    methods: {
        addHideParam(target) {
            this.openmct.router.setSearchParam(target, 'true');
        },
        endResizing(_event) {
            document.body.removeEventListener('mousemove', this.updatePosition);
            document.body.removeEventListener('mouseup', this.endResizing);
            this.resizing = false;
            this.$emit('end-resizing');
            this.trackSize();
        },
        getNewSize(event) {
            const delta = this.startPosition - this.getPosition(event);
            if (this.handle === "before") {
                return `${this.initial + delta}px`;
            }

            if (this.handle === "after") {
                return `${this.initial - delta}px`;
            }
        },
        getPosition(event) {
            return this.type === 'horizontal'
                ? event.pageX
                : event.pageY;
        },
        handleCollapse() {
            this.currentSize = (this.dragCollapse === true) ? this.initial : this.$el.style[this.styleProp];
            this.$el.style[this.styleProp] = '';
            this.collapsed = true;
        },
        handleExpand() {
            this.$el.style[this.styleProp] = this.currentSize;
            delete this.currentSize;
            delete this.dragCollapse;
            this.collapsed = false;
        },
        handleHideUrl() {
            const hideParam = this.openmct.router.getSearchParam(this.hideParam);

            if (hideParam === 'true') {
                this.handleCollapse();
            }
        },
        removeHideParam(target) {
            this.openmct.router.deleteSearchParam(target);
        },
        startResizing(event) {
            this.startPosition = this.getPosition(event);
            document.body.addEventListener('mousemove', this.updatePosition);
            document.body.addEventListener('mouseup', this.endResizing);
            this.resizing = true;
            this.$emit('start-resizing');
            this.trackSize();
        },
        toggleCollapse(_event) {
            if (this.collapsed) {
                this.handleExpand();
                this.removeHideParam(this.hideParam);
            } else {
                this.handleCollapse();
                this.addHideParam(this.hideParam);
            }
        },
        trackSize() {
            if (!this.dragCollapse) {
                if (this.type === 'vertical') {
                    this.initial = this.$el.offsetHeight;
                } else if (this.type === 'horizontal') {
                    this.initial = this.$el.offsetWidth;
                }
            }
        },
        updatePosition(event) {
            const size = this.getNewSize(event);
            const intSize = parseInt(size.substr(0, size.length - 2), 10);
            if (intSize < COLLAPSE_THRESHOLD_PX && this.isCollapsable === true) {
                this.dragCollapse = true;
                this.end();
                this.toggleCollapse();
            } else {
                this.$el.style[this.styleProp] = size;
            }
        }
    }
};
</script>
