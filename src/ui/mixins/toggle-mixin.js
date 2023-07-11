export default {
  data() {
    return {
      open: false
    };
  },
  methods: {
    toggle(event) {
      if (this.open) {
        if (this.isOpening) {
          // Prevent document event handler from closing immediately
          // after opening.  Can't use stopPropagation because that
          // would break other menus with similar behavior.
          this.isOpening = false;

          return;
        }

        document.removeEventListener('click', this.toggle);
        this.open = false;
      } else {
        document.addEventListener('click', this.toggle);
        this.open = true;
        this.isOpening = true;
      }
    }
  },
  destroyed() {
    document.removeEventListener('click', this.toggle);
  }
};
