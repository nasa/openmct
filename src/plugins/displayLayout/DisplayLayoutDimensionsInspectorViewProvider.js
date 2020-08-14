import Vue from 'vue';
import DisplayLayoutDimensionsInspectorView from './components/DisplayLayoutDimensionsInspectorView.vue';

export default function DisplayLayoutDimensionsInspectorViewProvider(openmct, options) {
    return {
        key: 'display-layout-dimensions',
        name: 'Dimensions',
        canView: function (selection) {
            if (selection.length === 0) {
                return false;
            }

            let domainObject = selection[0][0].context.item;

            return domainObject && domainObject.type === 'layout';
        },
        view: function (selection) {
            let component;
            let domainObject = selection[0][0].context.item;

            return {
                show: function (element) {
                    component = new Vue({
                        el: element,
                        components: {
                            DisplayLayoutDimensionsInspectorView: DisplayLayoutDimensionsInspectorView
                        },
                        provide: {
                            openmct,
                            domainObject
                        },
                        template: '<display-layout-dimensions-inspector-view></display-layout-dimensions-inspector-view>'
                    });
                },
                destroy: function () {
                    component.$destroy();
                    component = undefined;
                }
            };
        },
        priority: function () {
            return 1;
        }
    };
}
