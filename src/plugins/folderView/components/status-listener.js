export default {
  inject: ['openmct'],
  props: {
    item: {
      type: Object,
      required: true
    }
  },
  computed: {
    statusClass() {
      return this.status ? `is-status--${this.status}` : '';
    }
  },
  data() {
    return {
      status: ''
    };
  },
  methods: {
    setStatus(status) {
      this.status = status;
    }
  },
  mounted() {
    let identifier = this.item.model.identifier;

    this.status = this.openmct.status.get(identifier);
    this.removeStatusListener = this.openmct.status.observe(identifier, this.setStatus);
  },
  unmounted() {
    this.removeStatusListener();
  }
};
