<template>
<div class="c-switcher-menu">
    <button
        class="c-button c-button--menu c-switcher-menu__button"
        :class="iconClass"
        :title="title"
        @click.stop="toggleMenu"
    >
        <span class="c-button__label"></span>
    </button>
    <div
        v-show="showMenu"
        class="c-switcher-menu__content"
    >
        <slot></slot>
    </div>
</div>
</template>

<script>

export default {
    inject: ['openmct'],
    props: {
        iconClass: {
            type: String,
            default() {
                return '';
            }
        },
        title: {
            type: String,
            default() {
                return '';
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
