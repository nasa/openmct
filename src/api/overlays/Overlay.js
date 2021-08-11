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

        const {
            disableAutoHide,
            dismissable = true,
            size
        } = options;

        this.disableAutoHide = disableAutoHide;
        this.container = document.createElement('div');
        this.container.classList.add('l-overlay-wrapper', cssClasses[size]);
        this.dismissable = dismissable !== false;

        this.component = new Vue({
            components: {
                OverlayComponent: OverlayComponent
            },
            provide: {
                dismiss: this.dismiss.bind(this),
                element: options.element,
                buttons: options.buttons,
                dismissable: this.dismissable
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
