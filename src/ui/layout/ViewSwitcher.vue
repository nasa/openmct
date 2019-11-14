<template>
  <div
    v-if="views.length > 1"
    class="l-browse-bar__view-switcher c-ctrl-wrapper c-ctrl-wrapper--menus-left"
  >
    <button
      class="c-button--menu"
      :class="currentView.cssClass"
      title="Switch view type"
      @click.stop="toggleViewMenu"
    >
      <span class="c-button__label">
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
    props: [
        'currentView',
        'views'
    ],
    data() {
        return {
            showViewMenu: false
        }
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
}
</script>
