<template>
<div class="c-ne__embed">
    <div v-if="embed.snapshot"
         class="c-ne__embed__snap-thumb"
         @click="openSnapshot()"
    >
        <img :src="embed.snapshot.src">
    </div>
    <div class="c-ne__embed__info">
        <div class="c-ne__embed__name">
            <a class="c-ne__embed__link"
               :href="objectLink"
               :class="embed.cssClass"
            >{{ embed.name }}</a>
            <a class="c-ne__embed__context-available icon-arrow-down"
               @click="toggleActionMenu"
            ></a>
        </div>
        <div class="hide-menu hidden">
            <div class="menu-element context-menu-wrapper mobile-disable-select">
                <div class="c-menu">
                    <ul>
                        <li v-for="action in actions"
                            :key="action.name"
                            :class="action.cssClass"
                            @click="action.perform(embed, entry)"
                        >
                            {{ action.name }}
                        </li>
                    </ul>
                </div>
            </div>
        </div>
        <div v-if="embed.snapshot"
             class="c-ne__embed__time"
        >
            {{ formatTime(embed.createdOn, 'YYYY-MM-DD HH:mm:ss') }}
        </div>
    </div>
</div>
</template>

<script>
import Moment from 'moment';
import $ from 'zepto';
import objectLink from '../../../ui/mixins/object-link';
import PreviewAction from '../../../ui/preview/PreviewAction';
import Painterro from 'painterro';
import SnapshotTemplate from './snapshot-template.html';
import Vue from 'vue';

export default {
    inject: ['openmct', 'domainObject'],
    components: {
    },
    mixins: [objectLink],
    props: {
        embed: {
            type: Object,
            default() {
                return {};
            }
        },
        entry: {
            type: Object,
            default() {
                return {};
            }
        },
        objectPath: {
            type: Array,
            default() {
                return [];
            }
        }
    },
    data() {
        return {
            actions: [this.removeEmbedAction()],
            agentService: this.openmct.$injector.get('agentService'),
            currentEntryValue: '',
            popupService: this.openmct.$injector.get('popupService'),
            showActionMenu: false
        }
    },
    watch: {
    },
    beforeMount() {
        this.populateActionMenu();
    },
    methods: {
        annotateSnapshot() {
            console.log('TODO: annotateSnapshot');
            const self = this;

            let save = false;
            let painterroInstance = {};
            const annotateVue = new Vue({
                template: '<div id="snap-annotation"></div>'
            });

            let annotateOverlay = self.openmct.overlays.overlay({
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
                        // const entryPos = self.findInArray(domainObject.entries, entry.id);
                        // const embedPos = self.findInArray(entry.embeds, embed.id);

                        const entryPos = -1;
                        const embedPos = -1;

                        console.log('save handler', this);

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

                                this.openmct.objects.mutate(this.domainObject, dirString, snapshotObject);
                            };
                        }
                    } else {
                        console.log('You cancelled the annotation!!!');
                    }
                    done(true);
                }
            }).show(this.embed.snapshot.src);
        },
        findInArray() {
            console.log('TODO: findInArray');
        },
        formatTime(unixTime, timeFormat) {
            return Moment(unixTime).format(timeFormat);
        },
        openSnapshot() {
            const self = this;
            const snapshot = new Vue({
                data: () => {
                    return {
                        embed: self.embed
                    };
                },
                methods: {
                    formatTime: self.formatTime,
                    annotateSnapshot: self.annotateSnapshot,
                    findInArray: self.findInArray
                },
                template: SnapshotTemplate
            });

            const snapshotOverlay = this.openmct.overlays.overlay({
                element: snapshot.$mount().$el,
                onDestroy: () => { snapshot.$destroy(true) },
                size: 'large',
                dismissable: true,
                buttons: [
                    {
                        label: 'Done',
                        emphasis: true,
                        callback: () => {
                            snapshotOverlay.dismiss();
                        }
                    }
                ]
            });
        },
        populateActionMenu() {
            var self = this;
            const actions = [new PreviewAction(self.openmct)];
            self.openmct.objects.get(self.embed.type)
                .then((domainObject) => {
                    actions.forEach((action) => {
                        self.actions.push({
                            cssClass: action.cssClass,
                            name: action.name,
                            perform: () => {
                                action.invoke([domainObject].concat(self.openmct.router.path));
                            }
                        });
                    });
                });
        },
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
            };
        },
        toggleActionMenu(event) {
            event.preventDefault();

            const body = $(document.body);
            const container = $(event.target.parentElement.parentElement);
            const initiatingEvent = this.agentService.isMobile()
                ? 'touchstart'
                : 'mousedown';
            const menu = container.find('.menu-element');
            let dismissExistingMenu;

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
    }
}
</script>
