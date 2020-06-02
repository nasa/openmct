<template>
<div class="c-button--menu_switcher">
    <button
        class="c-button--menu"
        :class="iconClass"
        :title="title"
        @click.stop="toggleMenu"
    >
        <span class="c-button__label"></span>
    </button>
    <div
        v-show="showMenu"
        class="c-button--menu_switcher__content"
    >
        <span class="holder t-close-btn-holder c-button--menu_switcher__close-btn">
            <a class="s-icon-button icon-x t-btn-close"></a>
        </span>
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
