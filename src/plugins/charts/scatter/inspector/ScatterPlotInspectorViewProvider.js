import mount from 'utils/mount';

import { SCATTER_PLOT_INSPECTOR_KEY, SCATTER_PLOT_KEY } from '../scatterPlotConstants';
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
      let _destroy = null;
      return {
        show: function (element) {
          const { destroy } = mount(
            {
              el: element,
              components: {
                PlotOptions
              },
              provide: {
                openmct,
                domainObject: selection[0][0].context.item
              },
              template: '<plot-options></plot-options>'
            },
            {
              app: openmct.app,
              element
            }
          );
          _destroy = destroy;
        },
        priority: function () {
          return openmct.priority.HIGH + 1;
        },
        destroy: function () {
          if (_destroy) {
            _destroy();
          }
        }
      };
    }
  };
}
