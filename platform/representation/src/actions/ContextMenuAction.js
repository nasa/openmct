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
/*global define,Promise*/

/**
 * Module defining ContextMenuAction. Created by shale on 06/30/2015.
 */
define(
    ["../gestures/GestureConstants"],
    function (GestureConstants) {
        "use strict";

        var MENU_TEMPLATE = "<mct-representation key=\"'context-menu'\" " +
                "mct-object=\"domainObject\" " +
                "ng-class=\"menuClass\" " +
                "ng-style=\"menuStyle\">" +
                "</mct-representation>",
            dismissExistingMenu;

        /**
         * Launches a custom context menu for the domain object it contains.
         *
         * @memberof platform/representation
         * @constructor
         * @param $compile Angular's $compile service
         * @param $document the current document
         * @param $rootScope Angular's root scope
         * @param {platform/commonUI/general.PopupService} popupService
         * @param actionContext the context in which the action
         *                      should be performed
         * @implements {Action}
         */
        function ContextMenuAction(
            $compile,
            $document,
            $rootScope,
            popupService,
            agentService,
            actionContext
        ) {
            this.$compile = $compile;
            this.agentService = agentService;
            this.actionContext = actionContext;
            this.popupService = popupService;
            this.getDocument = function () { return $document; };
            this.getRootScope = function () { return $rootScope; };
        }

        ContextMenuAction.prototype.perform = function () {
            var $compile = this.$compile,
                $document = this.getDocument(),
                $rootScope = this.getRootScope(),
                actionContext = this.actionContext,
                eventCoords = [
                    actionContext.event.pageX,
                    actionContext.event.pageY
                ],
                menuDim = GestureConstants.MCT_MENU_DIMENSIONS,
                body = $document.find('body'),
                scope = $rootScope.$new(),
                initiatingEvent = this.agentService.isMobile() ?
                        'touchstart' : 'mousedown',
                menu,
                popup;

            // Remove the context menu
            function dismiss() {
                if (popup) {
                    popup.dismiss();
                    popup = undefined;
                }
                scope.$destroy();
                body.off("mousedown", dismiss);
                dismissExistingMenu = undefined;
            }

            // Dismiss any menu which was already showing
            if (dismissExistingMenu) {
                dismissExistingMenu();
            }

            // ...and record the presence of this menu.
            dismissExistingMenu = dismiss;

            // Set up the scope, including menu positioning
            scope.domainObject = actionContext.domainObject;
            scope.menuClass = { "context-menu-holder": true };
            // Create the context menu
            menu = $compile(MENU_TEMPLATE)(scope);

            popup = this.popupService.display(menu, eventCoords, {
                marginX: -menuDim[0],
                marginY: -menuDim[1]
            });

            scope.menuClass['go-left'] = popup.goesLeft();
            scope.menuClass['go-up'] = popup.goesUp();

            // Stop propagation so that clicks or touches on the menu do not close the menu
            menu.on(initiatingEvent, function (event) {
                event.stopPropagation();
            });

            // Dismiss the menu when body is clicked/touched elsewhere
            // ('mousedown' because 'click' breaks left-click context menus)
            // ('touchstart' because 'touch' breaks context menus up)
            body.on(initiatingEvent, dismiss);
            // NOTE: Apply to mobile?
            menu.on('click', dismiss);

            // Don't launch browser's context menu
            actionContext.event.preventDefault();
        };

        return ContextMenuAction;
    }
);
