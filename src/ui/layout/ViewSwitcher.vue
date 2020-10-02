<template>
<div
    v-if="views.length > 1"
    class="l-browse-bar__view-switcher c-ctrl-wrapper c-ctrl-wrapper--menus-left"
>
    <button
        class="c-icon-button c-button--menu"
        :class="currentView.cssClass"
        title="Change the current view"
        @click.prevent.stop="showMenu"
    >
        <span class="c-icon-button__label">
            {{ currentView.name }}
        </span>
    </button>
</div>
</template>

<script>
export default {
    inject: ['openmct'],
    props: {
        currentView: {
            type: Object,
            required: true
        },
        views: {
            type: Array,
            required: true
        }
    },
    methods: {
        setView(view) {
            this.$emit('setView', view);
        },
        showMenu() {
            const elementBoundingClientRect = this.$el.getBoundingClientRect();
            const x = elementBoundingClientRect.x;
            const y = elementBoundingClientRect.y + elementBoundingClientRect.height;

            this.openmct.menus.showMenu(x, y, this.views);
        }
    }
};
</script>
