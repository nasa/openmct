// src/plugins/condition/ConditionInspectorView.js

import mount from 'utils/mount';

import ConditionConfigView from './components/ConditionInspectorConfigView.vue';

export default function ConditionInspectorView(openmct) {
  return {
    key: 'condition-config',
    name: 'Config',
    canView: function (selection) {
      return selection.length > 0 && selection[0][0].context.item.type === 'conditionSet';
    },
    view: function (selection) {
      let _destroy = null;
      const domainObject = selection[0][0].context.item;

      return {
        show: function (element) {
          const { destroy } = mount(
            {
              el: element,
              components: {
                ConditionConfigView: ConditionConfigView
              },
              provide: {
                openmct,
                domainObject
              },
              template: '<condition-config-view></condition-config-view>'
            },
            {
              app: openmct.app,
              element
            }
          );
          _destroy = destroy;
        },
        showTab: function (isEditing) {
          return isEditing;
        },
        priority: function () {
          return 1;
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
