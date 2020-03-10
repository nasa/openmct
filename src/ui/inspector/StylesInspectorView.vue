<template>
<div></div>
</template>

<style>
</style>

<script>
import ConditionalStylesView from '../../plugins/condition/components/inspector/ConditionalStylesView.vue';
import Vue from 'vue';
import {getStyleProp} from "@/plugins/condition/utils/constants";

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
        getStyleProperties(item) {
            let styleProps = {};
            for (let key in item) {
                if (item.hasOwnProperty(key)) {
                    let styleProp = getStyleProp(key, item[key]);
                    if (styleProp) {
                        styleProps = {
                            ...styleProps,
                            ...styleProp
                        };
                    }
                }
            }
            return styleProps;
        },
        updateSelection(selection) {
            if (selection.length > 0 && selection[0].length > 0) {
                let domainObject = selection[0][0].context.item;
                let layoutItem = {};
                let styleProps = this.getStyleProperties({
                    fill: 'inherit',
                    stroke: 'inherit',
                    color: 'inherit'
                });
                if (selection[0].length > 1) {
                    //If there are more than 1 items in the selection[0] list, the first one could either be a sub domain object OR a layout drawing control.
                    //The second item in the selection[0] list is the container object (usually a layout)
                    domainObject = selection[0][0].context.item;
                    if (!domainObject) {
                        styleProps = {};
                        layoutItem = selection[0][0].context.layoutItem;
                        styleProps = this.getStyleProperties(layoutItem);
                        domainObject = selection[0][1].context.item;
                    }
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
                        domainObject: domainObject
                    },
                    el: viewContainer,
                    components: {
                        ConditionalStylesView
                    },
                    data() {
                        return {
                            layoutItem,
                            styleProps
                        }
                    },
                    template: '<conditional-styles-view :item-id="layoutItem.id" :initial-styles="styleProps"></conditional-styles-view>'
                });
            }
        }
    }
}
</script>
