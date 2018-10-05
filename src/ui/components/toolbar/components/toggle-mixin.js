export default {
    data() {
        return {
            open: false
        }
    },
    methods: {
        toggle(event) {
            if (this.open) {
                document.removeEventListener('click', this.toggle);
                this.open = false;
            } else {
                document.addEventListener('click', this.toggle);
                event.stopPropagation();
                this.open = true;
            }
        }
    },
    destroyed() {
        document.removeEventListener('click', this.toggle);
    },
}
