/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
/*global define*/

define([
    'zepto',
    'text!../../res/templates/tree/tree-label.html'
], function ($, labelTemplate) {
    'use strict';

    function TreeLabelView(gestureService) {
        this.el = $(labelTemplate);
        this.gestureService = gestureService;
    }

    function getGlyph(domainObject) {
        var type = domainObject.getCapability('type');
        return type.getGlyph();
    }

    function isLink(domainObject) {
        var location = domainObject.getCapability('location');
        return location.isLink();
    }

    TreeLabelView.prototype.updateView = function (domainObject) {
        var titleEl = this.el.find('.t-title-label'),
            glyphEl = this.el.find('.t-item-icon-glyph'),
            iconEl = this.el.find('.t-item-icon');

        titleEl.text(domainObject ? domainObject.getModel().name : "");
        glyphEl.text(domainObject ? getGlyph(domainObject) : "");

        if (domainObject && isLink(domainObject)) {
            iconEl.addClass('l-icon-link');
        } else {
            iconEl.removeClass('l-icon-link');
        }
    };

    TreeLabelView.prototype.model = function (domainObject) {
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
                [ 'info', 'menu', 'drag' ]
            );
        }
    };

    TreeLabelView.prototype.elements = function () {
        return this.el;
    };

    return TreeLabelView;
});
