import mount from 'utils/mount';

import EventInspectorView from './components/EventInspectorView.vue';

export default function EventInspectorViewProvider(openmct) {
  const TIMELINE_VIEW = 'time-strip.event.inspector';
  return {
    key: TIMELINE_VIEW,
    name: 'Event',
    canView: function (selection) {
      if (selection.length === 0 || selection[0].length === 0) {
        return false;
      }

      const selectionType = selection[0][0].context?.type;
      const event = selection[0][0].context?.event;
      return selectionType === 'time-strip-event-selection' && event;
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
                domainObject: selection[0][0].context.item,
                event: selection[0][0].context.event
              },
              template: '<event-inspector-view></event-inspector-view>'
            },
            {
              app: openmct.app,
              element
            }
          );
          _destroy = destroy;
        },
        priority: function () {
          return openmct.priority.HIGH;
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
