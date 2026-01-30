<template>
  <div class="c-switcher-menu">
    <button
      :id="id"
      class="c-button c-button--menu c-switcher-menu__button"
      :class="iconClass"
      :aria-label="accessibleLabel"
      :title="title"
      @click="toggleMenu"
    />
    <div v-show="showMenu" class="c-switcher-menu__content">
      <slot></slot>
    </div>
  </div>
</template>

<script>
import { v4 as uuid } from 'uuid';

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
  computed: {
    accessibleLabel() {
      const slotText = this.$slots.default?.[0]?.text?.trim();
      return slotText ? `${this.title} for ${slotText}` : this.title;
    }
  },
  mounted() {
    document.addEventListener('click', this.hideMenu);
  },
  unmounted() {
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
