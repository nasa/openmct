import mount from 'utils/mount';

import TableComponent from './components/table.vue';
import TelemetryTable from './TelemetryTable';

export default class TelemetryTableView {
  constructor(openmct, domainObject, objectPath) {
    this.openmct = openmct;
    this.domainObject = domainObject;
    this.objectPath = objectPath;
    this._destroy = null;
    this.component = null;

    Object.defineProperty(this, 'table', {
      value: new TelemetryTable(domainObject, openmct),
      enumerable: false,
      configurable: false
    });
  }

  getViewContext() {
    if (!this.component) {
      return {};
    }

    return this.component.$refs.tableComponent.getViewContext();
  }

  onEditModeChange(editMode) {
    this.component.isEditing = editMode;
  }

  onClearData() {
    this.table.clearData();
  }

  getTable() {
    return this.table;
  }

  destroy() {
    if (this._destroy) {
      this._destroy();
    }
  }

  show(element, editMode) {
    const { vNode, destroy } = mount(
      {
        el: element,
        components: {
          TableComponent
        },
        provide: {
          openmct: this.openmct,
          objectPath: this.objectPath,
          table: this.table,
          currentView: this
        },
        data() {
          return {
            isEditing: editMode,
            marking: {
              disableMultiSelect: false,
              enable: true,
              rowName: '',
              rowNamePlural: '',
              useAlternateControlBar: false
            }
          };
        },
        template:
          '<table-component ref="tableComponent" :is-editing="isEditing" :marking="marking"></table-component>'
      },
      {
        app: this.openmct.app,
        element
      }
    );
    this.component = vNode.componentInstance;
    this._destroy = destroy;
  }
}
