<template>
<div class="c-switcher-menu">
    <button
        :id="id"
        class="c-button c-button--menu c-switcher-menu__button"
        :class="iconClass"
        :title="title"
        @click="toggleMenu"
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
import {v4 as uuid} from 'uuid';

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
            id: uuid(),
            showMenu: false
        };
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
        hideMenu(e) {
            if (this.id === e.target.id) {
                return;
            }

            this.showMenu = false;
        }
    }
};
</script>
