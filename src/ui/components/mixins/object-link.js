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
            return '#/browse/' + this.objectPath
                .map(o => this.openmct.objects.makeKeyString(o.identifier))
                .reverse()
                .join('/');
        }
    }
};
