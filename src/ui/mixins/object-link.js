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
            let url;

            if (this.navigateToPath) {
                url = '#' + this.navigateToPath;
            } else {
                url = '#/browse/' + this.objectPath
                    .map(o => o && this.openmct.objects.makeKeyString(o.identifier))
                    .reverse()
                    .join('/');
            }
            if (this.sequenceNumber) {
                url += `?sequenceNumber=${this.sequenceNumber}`;
            }
            return url;
        }
    }
};
