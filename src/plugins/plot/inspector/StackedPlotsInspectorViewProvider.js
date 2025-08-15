import mount from 'utils/mount';

import PlotOptions from './PlotOptions.vue';

export default function StackedPlotsInspectorViewProvider(openmct) {
  return {
    key: 'stacked-plots-inspector',
    name: 'Config',
    canView: function (selection) {
      if (selection.length === 0 || selection[0].length === 0) {
        return false;
      }

      const object = selection[0][0].context.item;

      const isStackedPlotObject = object && object.type === 'telemetry.plot.stacked';

      return isStackedPlotObject;
    },
    view: function (selection) {
      let _destroy = null;
      let objectPath;

      if (selection.length) {
        objectPath = selection[0].map((selectionItem) => {
          return selectionItem.context.item;
        });
      }

      return {
        show: function (element) {
          const { destroy } = mount(
            {
              el: element,
              components: {
                PlotOptions: PlotOptions
              },
              provide: {
                openmct,
                domainObject: selection[0][0].context.item,
                path: objectPath
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
