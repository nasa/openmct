/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

import ContextMenuComponent from '../../ui/components/controls/ContextMenu.vue';
import Vue from 'vue';

/**
 * The ContextMenuRegistry allows the addition of new context menu actions, and for the context menu to be launched from
 * custom HTML elements.
 * @interface ContextMenuRegistry
 * @memberof module:openmct
 */
class ContextMenuRegistry {
    constructor() {
        this._allActions = [];
        this._activeContextMenu = undefined;

        this._hideActiveContextMenu = this._hideActiveContextMenu.bind(this);
        this.registerAction = this.registerAction.bind(this);
    }

    /**
     * Defines an item to be added to context menus. Allows specification of text, appearance, and behavior when
     * selected. Applicabilioty can be restricted by specification of an `appliesTo` function.
     *
     * @interface ContextMenuAction
     * @memberof module:openmct
     * @property {string} name the human-readable name of this view
     * @property {string} description a longer-form description (typically
     *           a single sentence or short paragraph) of this kind of view
     * @property {string} cssClass the CSS class to apply to labels for this
     *           view (to add icons, for instance)
     */
    /**
     * @method appliesTo
     * @memberof module:openmct.ContextMenuAction#
     * @param {DomainObject[]} objectPath the path of the object that the context menu has been invoked on.
     * @returns {boolean} true if the action applies to the objects specified in the 'objectPath', otherwise false.
     */
    /**
     * Code to be executed when the action is selected from a context menu
     * @method invoke
     * @memberof module:openmct.ContextMenuAction#
     * @param {DomainObject[]} objectPath the path of the object to invoke the action on.
     */
    /**
     * @param {ContextMenuAction} actionDefinition
     */
    registerAction(actionDefinition) {
        this._allActions.push(actionDefinition);
    }

    /**
     * @private
     */
    _attachTo(targetElement, objectPath, eventName) {
        eventName = eventName || 'contextmenu';

        if (eventName !== 'contextmenu' && eventName !== 'click') {
            throw `'${eventName}' event not supported for context menu`;
        }

        let showContextMenu = (event) => {
            this._showContextMenuForObjectPath(event, objectPath);
        };

        targetElement.addEventListener(eventName, showContextMenu);

        return function detach() {
            targetElement.removeEventListener(eventName, showContextMenu);
        }
    }

    /**
     * @private
     */
    _showContextMenuForObjectPath(objectPath, event) {
        let applicableActions = this._allActions.filter(
            (action) => action.appliesTo(objectPath));

        event.preventDefault();

        if (this._activeContextMenu) {
            this._hideActiveContextMenu();
        }

        this._activeContextMenu = this._createContextMenuForObject(objectPath, applicableActions);
        this._activeContextMenu.$mount();
        document.body.appendChild(this._activeContextMenu.$el);

        let position = this._calculatePopupPosition(event, this._activeContextMenu.$el);
        this._activeContextMenu.$el.style.left = `${position.x}px`;
        this._activeContextMenu.$el.style.top = `${position.y}px`;

        document.addEventListener('click', this._hideActiveContextMenu);
    }

    /**
     * @private
     */
    _calculatePopupPosition(event, menuElement) {
        let x = event.clientX;
        let y = event.clientY;
        let menuDimensions = menuElement.getBoundingClientRect();
        let diffX = (x + menuDimensions.width) - document.body.clientWidth;
        let diffY = (y + menuDimensions.height) - document.body.clientHeight;

        if (diffX > 0) {
            x = x - diffX;
        }

        if (diffY > 0) {
            y = y - diffY;
        }

        return {
            x: x,
            y: y
        }
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
    _createContextMenuForObject(objectPath, actions) {
        return new Vue({
            components: {
                ContextMenu: ContextMenuComponent
            },
            provide: {
                actions: actions,
                objectPath: objectPath
            },
            template: '<ContextMenu></ContextMenu>'
        });
    }
}
export default ContextMenuRegistry;
