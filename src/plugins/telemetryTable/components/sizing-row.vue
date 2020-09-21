<template>
<tr class="c-telemetry-table__sizing-tr"><td>SIZING ROW</td></tr>
</template>

<script>
export default {
    props: {
        isEditing: {
            type: Boolean,
            default: false
        }
    },
    watch: {
        isEditing: function (isEditing) {
            if (isEditing) {
                this.pollForRowHeight();
            } else {
                this.clearPoll();
            }
        }
    },
    mounted() {
        this.$nextTick().then(() => {
            this.height = this.$el.offsetHeight;
            this.$emit('change-height', this.height);
        });
        if (this.isEditing) {
            this.pollForRowHeight();
        }
    },
    destroyed() {
        this.clearPoll();
    },
    methods: {
        pollForRowHeight() {
            this.clearPoll();
            this.pollID = window.setInterval(this.heightPoll, 300);
        },
        clearPoll() {
            if (this.pollID) {
                window.clearInterval(this.pollID);
                this.pollID = undefined;
            }
        },
        heightPoll() {
            let height = this.$el.offsetHeight;
            if (height !== this.height) {
                this.$emit('change-height', height);
                this.height = height;
            }
        }
    }
};
</script>
