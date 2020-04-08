<template>
<div class="l-browse-bar__view-switcher c-ctrl-wrapper c-ctrl-wrapper--menus-left">
    <button
        class="l-browse-bar__context-actions c-disclosure-button"
        title="popup menu"
        @click.stop="toggleMenu"
    >
        <span class="c-button__label"></span>
    </button>
    <div
        v-show="showMenu"
        class="c-menu"
    >
        <ul>
            <li
                v-for="(item, index) in popupMenuItems"
                :key="index"
                :class="item.cssClass"
                :title="item.name"
                @click="item.callback"
            >
                {{ item.name }}
            </li>
        </ul>
    </div>
</div>
</template>

<script>

export default {
    inject: ['openmct'],
    props: {
        domainObject: {
            type: Object,
            default() {
                return {};
            }
        },
        popupMenuItems: {
            type: Array,
            default() {
                return [];
            }
        }
    },
    data() {
        return {
            showMenu: false
        }
    },
    mounted() {
        document.addEventListener('click', this.hideMenu);
    },
    destroyed() {
        document.removeEventListener('click', this.hideMenu);
    },
    methods: {
        toggleMenu() {
            this.showMenu = !this.showMenu;
        },
        hideMenu() {
            this.showMenu = false;
        }
    }
}
</script>
