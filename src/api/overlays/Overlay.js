import OverlayComponent from './components/OverlayComponent.vue';
import EventEmitter from 'EventEmitter';
import Vue from 'vue';

const cssClasses = {
    large: 'l-overlay-large',
    small: 'l-overlay-small',
    fit: 'l-overlay-fit',
    fullscreen: 'l-overlay-fullscreen'
};

class Overlay extends EventEmitter {
    constructor(options) {
        super();

        this.dismissable = options.dismissable !== false;
        this.container = document.createElement('div');
        this.container.classList.add('l-overlay-wrapper', cssClasses[options.size]);

        this.component = new Vue({
            provide: {
                dismiss: this.dismiss.bind(this),
                element: options.element,
                buttons: options.buttons,
                dismissable: this.dismissable
            },
            components: {
                OverlayComponent: OverlayComponent
            },
            template: '<overlay-component></overlay-component>'
        });

        if (options.onDestroy) {
            this.once('destroy', options.onDestroy);
        }
    }

    dismiss() {
        this.emit('destroy');
        document.body.removeChild(this.container);
        this.component.$destroy();
    }

    /**
     * @private
     **/
    show() {
        document.body.appendChild(this.container);
        this.container.appendChild(this.component.$mount().$el);
    }
}

export default Overlay;
