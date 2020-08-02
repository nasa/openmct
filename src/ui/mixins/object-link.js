export default {
    inject: ['openmct'],
    props: {
        'objectPath': {
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

            return '#/browse/' + this.objectPath
                .map(o => o && this.openmct.objects.makeKeyString(o.identifier))
                .reverse()
                .join('/');
        }
    }
};
