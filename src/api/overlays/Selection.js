import SelectionComponent from './components/SelectionComponent.vue';
import Overlay from './Overlay';
import Vue from 'vue';

class Selection extends Overlay {
  constructor({
    iconClass,
    title,
    message,
    selectionOptions,
    onChange,
    currentSelection,
    ...options
  }) {
    let component = new Vue({
      components: {
        SelectionComponent: SelectionComponent
      },
      provide: {
        iconClass,
        title,
        message,
        selectionOptions,
        onChange,
        currentSelection
      },
      template: '<selection-component></selection-component>'
    }).$mount();

    super({
      element: component.$el,
      size: 'fit',
      dismissable: false,
      onChange,
      currentSelection,
      ...options
    });

    this.once('destroy', () => {
      component.$destroy();
    });
  }
}

export default Selection;
