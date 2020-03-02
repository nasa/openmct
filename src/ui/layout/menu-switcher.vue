<template>
<div class="l-browse-bar__view-switcher c-ctrl-wrapper c-ctrl-wrapper--menus-left">
    <button
        class="c-button--menu"
        :class="currentType && currentType.cssClass"
        title="Switch types"
        @click="getData"
        @click.stop="toggleMenu"
    >
        <span class="c-button__label">
        </span>
    </button>
    <div
        v-show="showMenu"
        class="c-menu"
    >
        <ul>
            <li
                v-for="(type, index) in types"
                :key="index"
                :class="type.cssClass"
                :title="type.name"
                @click="onSwitch(type)"
            >
                {{ type.name }}
            </li>
        </ul>
    </div>
</div>
</template>

<script>
export default {
    props: {
        currentType: {
            type: Object,
            default() {
                return {};
            }
        },
        onSwitch: {
            type: Function,
            required: true
        },
        getData: {
            type: Function,
            default() {
                return () => {};
            }
        },
        types: {
            type: Array,
            required: true
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
