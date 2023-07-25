import { toRaw } from 'vue';

export default {
  inject: ['openmct'],
  props: {
    objectPath: {
      type: Array,
      default() {
        return [];
      }
    }
  },
  data() {
    return {
      contextClickActive: false
    };
  },
  mounted() {
    //TODO: touch support
    this.$nextTick(() => {
      this.$refs.root.addEventListener('contextmenu', this.showContextMenu);
    });

    function updateObject(oldObject, newObject) {
      const rawNewObject = toRaw(newObject);
      const rawOldObject = toRaw(oldObject);
      Object.assign(rawOldObject, rawNewObject);
    }

    this.objectPath.forEach((object) => {
      if (object) {
        const unobserve = this.openmct.objects.observe(
          object,
          '*',
          updateObject.bind(this, object)
        );
        this.$once('hook:unmounted', unobserve);
      }
    });
  },
  beforeUnmount() {
    this.$refs.root.removeEventListener('contextMenu', this.showContextMenu);
  },
  methods: {
    showContextMenu(event) {
      if (this.readOnly) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      let actionsCollection = this.openmct.actions.getActionsCollection(toRaw(this.objectPath));
      let actions = actionsCollection.getVisibleActions();
      let sortedActions = this.openmct.actions._groupAndSortActions(actions);

      const menuOptions = {
        onDestroy: this.onContextMenuDestroyed
      };

      const menuItems = this.openmct.menus.actionsToMenuItems(
        sortedActions,
        actionsCollection.objectPath,
        actionsCollection.view
      );
      this.openmct.menus.showMenu(event.clientX, event.clientY, menuItems, menuOptions);
      this.contextClickActive = true;
      this.$emit('context-click-active', true);
    },
    onContextMenuDestroyed() {
      this.contextClickActive = false;
      this.$emit('context-click-active', false);
    }
  }
};
