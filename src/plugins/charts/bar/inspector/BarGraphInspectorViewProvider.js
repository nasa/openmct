import mount from 'utils/mount';

import { BAR_GRAPH_INSPECTOR_KEY, BAR_GRAPH_KEY } from '../BarGraphConstants.js';
import BarGraphOptions from './BarGraphOptions.vue';

export default function BarGraphInspectorViewProvider(openmct) {
  return {
    key: BAR_GRAPH_INSPECTOR_KEY,
    name: 'Config',
    canView: function (selection) {
      if (selection.length === 0 || selection[0].length === 0) {
        return false;
      }

      let object = selection[0][0].context.item;

      return object && object.type === BAR_GRAPH_KEY;
    },
    view: function (selection) {
      let _destroy = null;

      return {
        show: function (element) {
          const { destroy } = mount(
            {
              el: element,
              components: {
                BarGraphOptions
              },
              provide: {
                openmct,
                domainObject: selection[0][0].context.item
              },
              template: '<bar-graph-options></bar-graph-options>'
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
