<template>
<div class="c-properties c-properties--properties">
    <div class="c-properties__header">
        Object Styles
    </div>
</div>
</template>

<style>
</style>

<script>
import ConditionalStylesView from '../../plugins/condition/components/inspector/ConditionalStylesView.vue';
import Vue from 'vue';

export default {
    inject: ['openmct'],
    data() {
        return {
            selection: []
        }
    },
    mounted() {
        this.openmct.selection.on('change', this.updateSelection);
        this.updateSelection(this.openmct.selection.get());
    },
    destroyed() {
        this.openmct.selection.off('change', this.updateSelection);
    },
    methods: {
        updateSelection(selection) {
            this.selection = selection;

            if (this.component) {
                this.component.$destroy();
                this.component = undefined;
                this.$el.innerHTML = '';
            }

            let viewContainer = document.createElement('div');
            this.$el.append(viewContainer);
            this.component = new Vue({
                provide: {
                    openmct: this.openmct
                },
                el: viewContainer,
                components: {
                    ConditionalStylesView
                },
                template: '<conditional-styles-view></conditional-styles-view>'
            });

        }
    }
}
</script>
