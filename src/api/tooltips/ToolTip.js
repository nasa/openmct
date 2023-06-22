import TooltipComponent from './components/TooltipComponent.vue';
import EventEmitter from 'EventEmitter';
import Vue from 'vue';

class Tooltip extends EventEmitter {
  constructor(
    { toolTipText, toolTipLocation, parentElement } = {
      tooltipText: '',
      toolTipLocation: 'below',
      parentElement: null
    }
  ) {
    super();

    this.container = document.createElement('div');

    this.component = new Vue({
      components: {
        TooltipComponent: TooltipComponent
      },
      provide: {
        toolTipText,
        toolTipLocation,
        parentElement
      },
      template: '<tooltip-component toolTipText="toolTipText"></tooltip-component>'
    });

    this.isActive = null;
  }

  destroy() {
    if (!this.isActive) {
      return;
    }
    document.body.removeChild(this.container);
    this.component.$destroy();
    this.isActive = false;
  }

  /**
   * @private
   **/
  show() {
    document.body.appendChild(this.container);
    this.container.appendChild(this.component.$mount().$el);
    this.isActive = true;
  }
}

export default Tooltip;
