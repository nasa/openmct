import * as Emitter from 'tiny-emitter';
const emitter = new Emitter();

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
      Object.assign(oldObject, newObject);
    }

    this.objectPath.forEach((object) => {
      if (object) {
        const unobserve = this.openmct.objects.observe(
          object,
          '*',
          updateObject.bind(this, object)
        );
        emitter.once('hook:unmounted', unobserve);
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

      let actionsCollection = this.openmct.actions.getActionsCollection(this.objectPath);
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
      emitter.emit('context-click-active', true);
    },
    onContextMenuunmounted() {
      this.contextClickActive = false;
      emitter.emit('context-click-active', false);
    }
  }
};
