<template>
<div></div>
</template>

<style>
</style>

<script>
export default {
    inject: ['openmct'],
    props: {
        view: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            selection: []
        }
    },
    mounted() {
        this.show();
    },
    updated() {
        this.show();
    },
    methods: {
        show() {
            if (this.view) {
                let viewContainer = document.createElement('div');
                this.$el.append(viewContainer)
                this.view.show(viewContainer);
            }
        }
    }
}
</script>
