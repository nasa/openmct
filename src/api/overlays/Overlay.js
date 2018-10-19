import OverlayComponent from './components/OverlayComponent.vue';
import EventEmitter from 'EventEmitter';
import Vue from 'vue';

const cssClasses = {
    large: 'l-overlay-large',
    small: 'l-overlay-small',
    fit: 'l-overlay-fit'
};

class Overlay extends EventEmitter {
    constructor(options) {
        super();

        this.container = document.createElement('div');
        this.container.classList.add('l-overlay-wrapper', cssClasses[options.size]);

        this.component = new Vue({
            provide: {
                dismiss: this.dismiss.bind(this),
                element: options.element,
                buttons: options.buttons,
                notDismissable: options.notDismissable ? true : false
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
        this.component.$destroy();
        document.body.removeChild(this.container);
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
