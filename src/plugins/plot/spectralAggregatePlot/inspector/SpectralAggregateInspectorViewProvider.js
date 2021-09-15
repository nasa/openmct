import { SPECTRAL_AGGREGATE_INSPECTOR_KEY, SPECTRAL_AGGREGATE_KEY } from './SpectralAggregateConstants';
import Vue from 'vue';
import SpectralAggregatePlotOptions from "./SpectralAggregatePlotOptions.vue";

export default function SpectralAggregateInspectorViewProvider(openmct) {
    return {
        key: SPECTRAL_AGGREGATE_INSPECTOR_KEY,
        name: 'Spectral Aggregate Plot Inspector View',
        canView: function (selection) {
            if (selection.length === 0 || selection[0].length === 0) {
                return false;
            }

            let object = selection[0][0].context.item;

            return object
                && object.type === SPECTRAL_AGGREGATE_KEY;
        },
        view: function (selection) {
            let component;

            return {
                show: function (element) {
                    component = new Vue({
                        el: element,
                        components: {
                            SpectralAggregatePlotOptions
                        },
                        provide: {
                            openmct,
                            domainObject: selection[0][0].context.item
                        },
                        template: '<spectral-aggregate-options></spectral-aggregate-options>'
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