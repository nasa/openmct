/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
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

define([
    'zepto',
    'text!../../res/templates/tree/tree-label.html'
], ($, labelTemplate) => {

    class TreeLabelView {
      constructor(gestureService) {
        this.el = $(labelTemplate);
        this.gestureService = gestureService;
    }

     isLink(domainObject) {
        let location = domainObject.getCapability('location');
        return location.isLink();
    }

    getClass(domainObject) {
        let type = domainObject.getCapability('type');
        return type.getCssClass();
    }

    updateView(domainObject) {
        let titleEl = this.el.find('.t-title-label'),
            iconEl = this.el.find('.t-item-icon');

        titleEl.text(domainObject ? domainObject.getModel().name : "");
        iconEl.addClass(domainObject ? this.getClass(domainObject) : "");

        if (domainObject && this.isLink(domainObject)) {
            iconEl.addClass('l-icon-link');
        } else {
            iconEl.removeClass('l-icon-link');
        }
    };

    model(domainObject) {
        if (this.unlisten) {
            this.unlisten();
            delete this.unlisten;
        }

        if (this.activeGestures) {
            this.activeGestures.destroy();
            delete this.activeGestures;
        }

        this.updateView(domainObject);

        if (domainObject) {
            this.unlisten = domainObject.getCapability('mutation')
                .listen(this.updateView.bind(this, domainObject));

            this.activeGestures = this.gestureService.attachGestures(
                this.elements(),
                domainObject,
                ['info', 'menu', 'drag']
            );
        }
    };

    elements() {
        return this.el;
    };
  }
    return TreeLabelView;
});
