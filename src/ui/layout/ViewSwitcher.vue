<template>
<div
    v-if="views.length > 1"
    class="l-browse-bar__view-switcher c-ctrl-wrapper c-ctrl-wrapper--menus-left"
>
    <button
        class="c-icon-button c-button--menu"
        :class="currentView.cssClass"
        title="Change the current view"
        @click.stop="toggleViewMenu"
    >
        <span class="c-icon-button__label">
            {{ currentView.name }}
        </span>
    </button>
    <div
        v-show="showViewMenu"
        class="c-menu"
    >
        <ul>
            <li
                v-for="(view, index) in views"
                :key="index"
                :class="view.cssClass"
                :title="view.name"
                @click="setView(view)"
            >
                {{ view.name }}
            </li>
        </ul>
    </div>
</div>
</template>

<script>
export default {
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
    data() {
        return {
            showViewMenu: false
        };
    },
    mounted() {
        document.addEventListener('click', this.hideViewMenu);
    },
    destroyed() {
        document.removeEventListener('click', this.hideViewMenu);
    },
    methods: {
        setView(view) {
            this.$emit('setView', view);
        },
        toggleViewMenu() {
            this.showViewMenu = !this.showViewMenu;
        },
        hideViewMenu() {
            this.showViewMenu = false;
        }
    }
};
</script>
