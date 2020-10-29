import { throws } from "assert";

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
            return `is-${this.status}`;
        }
    },
    data() {
        return {
            status: ''
        }
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
    destroyed() {
        this.removeStatusListener();
    }
};