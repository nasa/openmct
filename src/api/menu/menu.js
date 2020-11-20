/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2020, United States Government
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
import EventEmitter from 'EventEmitter';
import MenuComponent from './components/Menu.vue';
import Vue from 'vue';

class Menu extends EventEmitter {
    constructor(options) {
        super();

        this.options = options;

        this.component = new Vue({
            provide: {
                actions: options.actions
            },
            components: {
                MenuComponent
            },
            template: '<menu-component />'
        });

        if (options.onDestroy) {
            this.once('destroy', options.onDestroy);
        }

        this.dismiss = this.dismiss.bind(this);
        this.show = this.show.bind(this);

        this.show();
    }

    dismiss() {
        this.emit('destroy');
        document.body.removeChild(this.component.$el);
        document.removeEventListener('click', this.dismiss);
        this.component.$destroy();
    }

    show() {
        this.component.$mount();
        document.body.appendChild(this.component.$el);

        let position = this._calculatePopupPosition(this.options.x, this.options.y, this.component.$el);

        this.component.$el.style.left = `${position.x}px`;
        this.component.$el.style.top = `${position.y}px`;

        document.addEventListener('click', this.dismiss);
    }

    /**
     * @private
     */
    _calculatePopupPosition(eventPosX, eventPosY, menuElement) {
        let menuDimensions = menuElement.getBoundingClientRect();
        let overflowX = (eventPosX + menuDimensions.width) - document.body.clientWidth;
        let overflowY = (eventPosY + menuDimensions.height) - document.body.clientHeight;

        if (overflowX > 0) {
            eventPosX = eventPosX - overflowX;
        }

        if (overflowY > 0) {
            eventPosY = eventPosY - overflowY;
        }

        return {
            x: eventPosX,
            y: eventPosY
        };
    }
}

export default Menu;
