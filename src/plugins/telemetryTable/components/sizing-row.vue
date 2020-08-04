<template>
    <div style="visibility: hidden;">SIZING ROW</div>
</template>

<script>
export default {
    props: {
        rowHeight: {
            type: Number,
            default: 0
        }
    },
    mounted() {
        this.height = this.$el.offsetHeight;
        this.pollID = window.setInterval(this.heightPoll, 1000);
    },
    destroyed() {
        window.clearInterval(this.pollID);
    },
    methods: {
        heightPoll() {
            let height = this.$el.offsetHeight;

            if (height !== this.height) {
                if (height < this.rowHeight) {
                    height = this.rowHeight;
                }
                this.$emit('change-height', height);
                this.height = height;
            }
        }
    }
}
</script>