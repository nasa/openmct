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

define([
    'moment',
    'zepto',
    '../utils/SnapshotOverlay',
],
function (
    Moment,
    $,
    SnapshotOverlay
) {
    function EmbedController (openmct, domainObject) {
        this.openmct = openmct;
        this.domainObject = domainObject;
        this.objectService = openmct.$injector.get('objectService');
        this.navigationService = openmct.$injector.get('navigationService');
        this.popupService = openmct.$injector.get('popupService');
        this.agentService = openmct.$injector.get('agentService');
        this.dialogService = openmct.$injector.get('dialogService');


        this.navigate = this.navigate.bind(this);
        this.exposedData = this.exposedData.bind(this);
        this.exposedMethods = this.exposedMethods.bind(this);
        this.toggleActionMenu = this.toggleActionMenu.bind(this);
    }

    EmbedController.prototype.navigate = function (embedType) {
        this.objectService.getObjects([embedType]).then(function (objects) {
            this.navigationService.setNavigation(objects[embedType]);   
        }.bind(this));
    };

    EmbedController.prototype.openSnapshot = function () {
        if (!this.snapshotOverlay) {
            this.snapShotOverlay = new SnapshotOverlay(this.embed, this.formatTime);
        } else {
            this.snapShotOverlay = undefined;
        }
    };

    EmbedController.prototype.formatTime = function (unixTime, timeFormat) {
        return Moment(unixTime).format(timeFormat);
    };

    EmbedController.prototype.findInArray = function (array, id) {
        var foundId = -1;

        array.forEach(function (element, index) {
            if (element.id === id) {
                foundId = index;
                return;
            }
        });

        return foundId;
    };

    EmbedController.prototype.actionToMenuDecorator = function (action) {
        return {
            name: action.getMetadata().name,
            cssClass: action.getMetadata().cssClass,
            perform: action.perform
        };
    };

    EmbedController.prototype.populateActionMenu = function (objectService, actionService) {
        return function () {
            var self = this;

            objectService.getObjects([self.embed.type]).then(function (resp) {
                var domainObject = resp[self.embed.type],
                    previewAction = actionService.getActions({key: 'mct-preview-action', domainObject: domainObject})[0];

                self.actions.push(self.actionToMenuDecorator(previewAction));
            });
        };
    };

    EmbedController.prototype.removeEmbedAction = function () {
        var self = this;

        return {
            name: 'Remove Embed',
            cssClass: 'icon-trash',
            perform: function (embed, entry) {
                var entryPosition = self.findInArray(self.domainObject.entries, entry.id),
                    embedPosition = self.findInArray(entry.embeds, embed.id);

                var warningDialog = self.dialogService.showBlockingMessage({
                    severity: "error",
                    title: "This action will permanently delete this embed. Do you wish to continue?",
                    options: [{
                        label: "OK",
                        callback: function () {
                            entry.embeds.splice(embedPosition, 1);
                            var dirString = 'entries[' + entryPosition + '].embeds';

                            self.openmct.objects.mutate(self.domainObject, dirString, entry.embeds);

                            warningDialog.dismiss();
                        }
                    },{
                        label: "Cancel",
                        callback: function () {
                            warningDialog.dismiss();
                        }
                    }]
                });
            }
        };
    };

    EmbedController.prototype.toggleActionMenu = function (event) {
        event.preventDefault();

        var body = $(document.body),
            container = $(event.target.parentElement.parentElement),
            initiatingEvent = this.agentService.isMobile() ?
                'touchstart' : 'mousedown',
            menu = container.find('.menu-element'),
            dismissExistingMenu;

        // Remove the context menu
        function dismiss() {
            container.find('.hide-menu').append(menu);
            body.off(initiatingEvent, dismiss);
            menu.off(initiatingEvent, menuClickHandler);
            dismissExistingMenu = undefined;
        }

        function menuClickHandler(e) {
            e.stopPropagation();
            window.setTimeout(dismiss, 300);
        }

        // Dismiss any menu which was already showing
        if (dismissExistingMenu) {
            dismissExistingMenu();
        }

        // ...and record the presence of this menu.
        dismissExistingMenu = dismiss;

        this.popupService.display(menu, [event.pageX,event.pageY], {
            marginX: 0,
            marginY: -50
        });

        // Stop propagation so that clicks or touches on the menu do not close the menu
        menu.on(initiatingEvent, menuClickHandler);

        body.on(initiatingEvent, dismiss);

    };

    EmbedController.prototype.exposedData = function () {
        return {
            actions: [this.removeEmbedAction()],
            showActionMenu: false
        };
    };

    EmbedController.prototype.exposedMethods = function () {
        var self = this;

        return {
            navigate: self.navigate,
            openSnapshot: self.openSnapshot,
            formatTime: self.formatTime,
            toggleActionMenu: self.toggleActionMenu,
            actionToMenuDecorator: self.actionToMenuDecorator
        };
    };

    return EmbedController;
});
