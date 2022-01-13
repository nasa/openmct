import { SCATTER_PLOT_INSPECTOR_KEY, SCATTER_PLOT_KEY } from '../ScatterPlotConstants';
import Vue from 'vue';
import ScatterPlotOptions from "./ScatterPlotOptions.vue";

export default function ScatterPlotInspectorViewProvider(openmct) {
    return {
        key: SCATTER_PLOT_INSPECTOR_KEY,
        name: 'Bar Graph Inspector View',
        canView: function (selection) {
            if (selection.length === 0 || selection[0].length === 0) {
                return false;
            }

            let object = selection[0][0].context.item;

            return object
                && object.type === SCATTER_PLOT_KEY;
        },
        view: function (selection) {
            let component;

            return {
                show: function (element) {
                    component = new Vue({
                        el: element,
                        components: {
                            ScatterPlotOptions
                        },
                        provide: {
                            openmct,
                            domainObject: selection[0][0].context.item
                        },
                        template: '<scatter-plot-options></scatter-plot-options>'
                    });
                },
                destroy: function () {
                    if (component) {
                        component.$destroy();
                        component = undefined;
                    }
                }
            };
        },
        priority: function () {
            return 1;
        }
    };
}
