import ContextMenuComponent from '../../ui/components/controls/ContextMenu.vue';
import Vue from 'vue';

class ContextMenuRegistry {
    constructor() {
        this._allActions = [];
        this._activeContextMenu = undefined;

        this._hideActiveContextMenu = this._hideActiveContextMenu.bind(this);
    }

    registerAction(actionDefinition) {
        this._allActions.push(actionDefinition);
    }

    attachTo(targetElement, objectPath) {
        let showContextMenu = (event) => {
            this._showContextMenuForObjectPath(event, objectPath);
        };

        targetElement.addEventListener('contextmenu', showContextMenu);

        return function detach() {
            targetElement.removeEventListener('contextMenu', showContextMenu);
        }
    }

    /**
     * @private
     */
    _showContextMenuForObjectPath(event, objectPath) {
        let applicableActions = this._allActions.filter(
            (action) => action.appliesTo(objectPath));

        event.preventDefault();

        if (this._activeContextMenu) {
            this._hideActiveContextMenu();
        }

        this._activeContextMenu = this._createContextMenuFromActions(applicableActions);
        this._activeContextMenu.$mount();
        this._activeContextMenu.$el.style.left = `${event.clientX}px`;
        this._activeContextMenu.$el.style.top = `${event.clientY}px`;

        document.body.appendChild(this._activeContextMenu.$el);
        document.addEventListener('click', this._hideActiveContextMenu);
    }

    /**
     * @private
     */
    _hideActiveContextMenu() {
        document.removeEventListener('click', this._hideActiveContextMenu);
        document.body.removeChild(this._activeContextMenu.$el);
        this._activeContextMenu.$destroy();
        this._activeContextMenu = undefined;
    }

    /**
     * @private
     */
    _createContextMenuFromActions(actions) {
        return new Vue({
            components: {
                ContextMenu: ContextMenuComponent
            },
            provide: {
                actions: actions
            },
            template: '<ContextMenu></ContextMenu>'
        });
    }
}
export default ContextMenuRegistry;
