<template>
<div></div>
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
            if (selection.length > 0 && selection[0].length > 0) {
                let domainObject = selection[0][0].context.item;
                let layoutItem;
                if (selection[0].length > 1) {
                    //this is a non-domain object layout item
                    domainObject = selection[0][1].context.item;
                    layoutItem = selection[0][0].context.layoutItem;
                }

                if (this.component) {
                    this.component.$destroy();
                    this.component = undefined;
                    this.$el.innerHTML = '';
                }

                let viewContainer = document.createElement('div');
                this.$el.append(viewContainer);
                this.component = new Vue({
                    provide: {
                        openmct: this.openmct,
                        domainObject: domainObject,
                        layoutItem: layoutItem
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
}
</script>
