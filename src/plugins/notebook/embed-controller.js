import $ from 'zepto';
import Moment from 'moment';
import Painterro from 'painterro';
import Vue from 'vue';

import SnapshotTemplate from './components/snapshot-template.html';

export default class EmbedController {
    constructor(openmct, domainObject) {
        console.log('EmbedController');
        this.openmct = openmct;
        this.domainObject = domainObject;
        this.popupService = openmct.$injector.get('popupService');
        this.agentService = openmct.$injector.get('agentService');

        this.exposedData = this.exposedData.bind(this);
        this.exposedMethods = this.exposedMethods.bind(this);
        this.toggleActionMenu = this.toggleActionMenu.bind(this);
    }


    openSnapshot(domainObject, entry, embed) {
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
                                reader.onloadend = () => {
                                    var snapshot = reader.result,
                                        snapshotObject = {
                                            src: snapshot,
                                            type: url.type,
                                            size: url.size,
                                            modified: Date.now()
                                        },
                                        dirString = 'entries[' + entryPos + '].embeds[' + embedPos + '].snapshot';

                                    openmct.objects.mutate(domainObject, dirString, snapshotObject);
                                }
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
                    }
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
    }

    formatTime(unixTime, timeFormat) {
        return Moment(unixTime).format(timeFormat);
    }

    findInArray(array, id) {
        var foundId = -1;

        array.forEach(function (element, index) {
            if (element.id === id) {
                foundId = index;
                return;
            }
        });

        return foundId;
    }

    populateActionMenu(openmct, actions) {
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
        }
    }

    removeEmbedAction() {
        var self = this;

        return {
            name: 'Remove Embed',
            cssClass: 'icon-trash',
            perform: function (embed, entry) {
                var entryPosition = self.findInArray(self.domainObject.entries, entry.id),
                    embedPosition = self.findInArray(entry.embeds, embed.id);

                var dialog = self.openmct.overlays.dialog({
                    iconClass: "alert",
                    message: 'This Action will permanently delete this embed. Do you wish to continue?',
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
        }
    }

    toggleActionMenu(event) {
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
    }

    exposedData() {
        return {
            actions: [this.removeEmbedAction()],
            showActionMenu: false
        }
    }

    exposedMethods() {
        var self = this;

        return {
            openSnapshot: self.openSnapshot,
            formatTime: self.formatTime,
            toggleActionMenu: self.toggleActionMenu,
            findInArray: self.findInArray
        }
    }
}
