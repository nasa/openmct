export default {
  emits: ['on-change'],
  data() {
    return {
      isChecked: false
    };
  },
  methods: {
    toggleCheckBox(event) {
      this.isChecked = !this.isChecked;

      const data = {
        model: this.model,
        value: this.isChecked
      };

      this.$emit('on-change', data);
    }
  }
};
