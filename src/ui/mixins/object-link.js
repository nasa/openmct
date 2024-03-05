import objectPathToUrl from '../../tools/url.js';

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
  computed: {
    objectLink() {
      if (!this.objectPath.length) {
        return;
      }

      if (this.navigateToPath) {
        return '#' + this.navigateToPath;
      }

      const url = objectPathToUrl(this.openmct, this.objectPath);

      return url;
    }
  }
};
