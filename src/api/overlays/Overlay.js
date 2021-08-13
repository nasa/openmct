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
    constructor({
        buttons,
        autoHide = true,
        dismissable = true,
        element,
        onDestroy,
        size
    } = {}) {
        super();

        this.container = document.createElement('div');
        this.container.classList.add('l-overlay-wrapper', cssClasses[size]);

        this.autoHide = autoHide;
        this.dismissable = dismissable !== false;

        this.component = new Vue({
            components: {
                OverlayComponent: OverlayComponent
            },
            provide: {
                dismiss: this.dismiss.bind(this),
                element,
                buttons,
                dismissable: this.dismissable
            },
            template: '<overlay-component></overlay-component>'
        });

        if (onDestroy) {
            this.once('destroy', onDestroy);
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
