import { SCATTER_PLOT_INSPECTOR_KEY, SCATTER_PLOT_KEY } from '../scatterPlotConstants';
import Vue from 'vue';
import PlotOptions from './PlotOptions.vue';

export default function ScatterPlotInspectorViewProvider(openmct) {
  return {
    key: SCATTER_PLOT_INSPECTOR_KEY,
    name: 'Config',
    canView: function (selection) {
      if (selection.length === 0 || selection[0].length === 0) {
        return false;
      }

      let object = selection[0][0].context.item;

      return object && object.type === SCATTER_PLOT_KEY;
    },
    view: function (selection) {
      let component;

      return {
        show: function (element) {
          component = new Vue({
            el: element,
            components: {
              PlotOptions
            },
            provide: {
              openmct,
              domainObject: selection[0][0].context.item
            },
            template: '<plot-options></plot-options>'
          });
        },
        priority: function () {
          return openmct.priority.HIGH + 1;
        },
        destroy: function () {
          if (component) {
            component.$destroy();
            component = undefined;
          }
        }
      };
    }
  };
}
