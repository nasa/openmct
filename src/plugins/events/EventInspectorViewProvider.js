import mount from 'utils/mount';

import EventInspectorView from './components/EventInspectorView.vue';

export default function EventInspectorViewProvider(openmct) {
  const INSPECTOR_KEY = 'telemetry.events.inspector';
  return {
    key: INSPECTOR_KEY,
    name: 'Event',
    canView: function (selection) {
      if (
        !Array.isArray(selection) ||
        selection.length === 0 ||
        !Array.isArray(selection[0]) ||
        selection[0].length === 0
      ) {
        return false;
      }
      let object = selection[0][0].context?.item;

      return object && object.type === INSPECTOR_KEY;
    },
    view: function (selection) {
      let _destroy = null;

      return {
        show: function (element) {
          const { destroy } = mount(
            {
              el: element,
              components: {
                EventInspectorView
              },
              provide: {
                openmct,
                domainObject: selection[0][0].context.item
              },
              template: '<event-inspector></event-inspector>'
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
