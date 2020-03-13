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
    '../../res/templates/snapshotTemplate.html',
    'vue',
    'painterro'
],
function (
    Moment,
    $,
    SnapshotTemplate,
    Vue,
    Painterro
) {
    function EmbedController(openmct, domainObject) {
        console.log('EmbedController');
        this.openmct = openmct;
        this.domainObject = domainObject;
        this.popupService = openmct.$injector.get('popupService');
        this.agentService = openmct.$injector.get('agentService');

        this.exposedData = this.exposedData.bind(this);
        this.exposedMethods = this.exposedMethods.bind(this);
        this.toggleActionMenu = this.toggleActionMenu.bind(this);
    }

    EmbedController.prototype.openSnapshot = function (domainObject, entry, embed) {
        console.log('openSnapshot', entry, embed);
        function annotateSnapshot(openmct) {
            return function () {

                var save = false,
                    painterroInstance = {},
                    annotateVue = new Vue({
                        template: '<div id="snap-annotation"></div>'
                    }),
                    self = this;

                let annotateOverlay = openmct.overlays.overlay({
                    element: annotateVue.$mount().$el,
                    size: 'large',
                    dismissable: false,
                    buttons: [
                        {
                            label: 'Cancel',
                            callback: function () {
                                save = false;
                                painterroInstance.save();
                                annotateOverlay.dismiss();
                            }
                        },
                        {
                            label: 'Save',
                            callback: function () {
                                save = true;
                                painterroInstance.save();
                                annotateOverlay.dismiss();
                            }
                        }
                    ],
                    onDestroy: function () {
                        annotateVue.$destroy(true);
                    }
                });

                painterroInstance = Painterro({
                    id: 'snap-annotation',
                    activeColor: '#ff0000',
                    activeColorAlpha: 1.0,
                    activeFillColor: '#fff',
                    activeFillColorAlpha: 0.0,
                    backgroundFillColor: '#000',
                    backgroundFillColorAlpha: 0.0,
                    defaultFontSize: 16,
                    defaultLineWidth: 2,
                    defaultTool: 'ellipse',
                    hiddenTools: ['save', 'open', 'close', 'eraser', 'pixelize', 'rotate', 'settings', 'resize'],
                    translation: {
                        name: 'en',
                        strings: {
                            lineColor: 'Line',
                            fillColor: 'Fill',
                            lineWidth: 'Size',
                            textColor: 'Color',
                            fontSize: 'Size',
                            fontStyle: 'Style'
                        }
                    },
                    saveHandler: function (image, done) {
                        if (save) {
                            var entryPos = self.findInArray(domainObject.entries, entry.id),
                                embedPos = self.findInArray(entry.embeds, embed.id);

                            if (entryPos !== -1 && embedPos !== -1) {
                                var url = image.asBlob(),
                                    reader = new window.FileReader();

                                reader.readAsDataURL(url);
                                reader.onloadend = function () {
                                    var snapshot = reader.result,
                                        snapshotObject = {
                                            src: snapshot,
                                            type: url.type,
                                            size: url.size,
                                            modified: Date.now()
                                        },
                                        dirString = 'entries[' + entryPos + '].embeds[' + embedPos + '].snapshot';

                                    openmct.objects.mutate(domainObject, dirString, snapshotObject);
                                };
                            }
                        } else {
                            console.log('You cancelled the annotation!!!');
                        }
                        done(true);
                    }
                }).show(embed.snapshot.src);
            };
        }

        var self = this,
            snapshot = new Vue({
                data: function () {
                    return {
                        embed: self.embed
                    };
                },
                methods: {
                    formatTime: self.formatTime,
                    annotateSnapshot: annotateSnapshot(self.openmct),
                    findInArray: self.findInArray
                },
                template: SnapshotTemplate
            });

        var snapshotOverlay = this.openmct.overlays.overlay({
            element: snapshot.$mount().$el,
            onDestroy: () => {snapshot.$destroy(true)},
            size: 'large',
            dismissable: true,
            buttons: [
                {
                    label: 'Done',
                    emphasis: true,
                    callback: function () {
                        snapshotOverlay.dismiss();
                    }
                }
            ]
        });
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

    EmbedController.prototype.populateActionMenu = function (openmct, actions) {
        console.log('populateActionMenu', actions);
        return function () {
            var self = this;

            openmct.objects.get(self.embed.type).then(function (domainObject) {
                actions.forEach((action) => {
                    self.actions.push({
                        cssClass: action.cssClass,
                        name: action.name,
                        perform: () => {
                            action.invoke([domainObject].concat(openmct.router.path));
                        }
                    });
                });
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

                var dialog = self.openmct.overlays.dialog({
                    iconClass: "alert",
                    message: 'This action will permanently delete this embed. Do you wish to continue?',
                    buttons: [{
                        label: "No",
                        callback: function () {
                            dialog.dismiss();
                        }
                    },
                    {
                        label: "Yes",
                        emphasis: true,
                        callback: function () {
                            entry.embeds.splice(embedPosition, 1);
                            var dirString = 'entries[' + entryPosition + '].embeds';

                            self.openmct.objects.mutate(self.domainObject, dirString, entry.embeds);
                            dialog.dismiss();
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
            body.off(initiatingEvent, menuClickHandler);
            dismissExistingMenu = undefined;
        }

        function menuClickHandler(e) {
            window.setTimeout(() => {
                dismiss();
            }, 100);
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

        body.on(initiatingEvent, menuClickHandler);
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
            openSnapshot: self.openSnapshot,
            formatTime: self.formatTime,
            toggleActionMenu: self.toggleActionMenu,
            findInArray: self.findInArray
        };
    };

    return EmbedController;
});
