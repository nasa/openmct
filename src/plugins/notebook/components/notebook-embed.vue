<template>
<div class="c-snapshot c-ne__embed">
    <div v-if="embed.snapshot"
         class="c-ne__embed__snap-thumb"
         @click="openSnapshot()"
    >
        <img :src="embed.snapshot.src">
    </div>
    <div class="c-ne__embed__info">
        <div class="c-ne__embed__name">
            <a class="c-ne__embed__link"
               :class="embed.cssClass"
               @click="changeLocation"
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
                            @click="action.perform(embed)"
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
import PreviewAction from '../../../ui/preview/PreviewAction';
import Painterro from 'painterro';
import SnapshotTemplate from './snapshot-template.html';
import { togglePopupMenu } from '../utils/popup-menu';
import Vue from 'vue';

export default {
    inject: ['openmct'],
    components: {
    },
    props: {
        embed: {
            type: Object,
            default() {
                return {};
            }
        },
        removeActionString: {
            type: String,
            default() {
                return 'Remove Embed';
            }
        }
    },
    data() {
        return {
            actions: [this.removeEmbedAction()],
            agentService: this.openmct.$injector.get('agentService'),
            popupService: this.openmct.$injector.get('popupService')
        }
    },
    watch: {
    },
    beforeMount() {
        this.populateActionMenu();
    },
    methods: {
        annotateSnapshot() {
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
                        const url = image.asBlob();
                        const reader = new window.FileReader();
                        reader.readAsDataURL(url);
                        reader.onloadend = function () {
                            const snapshot = reader.result;
                            const snapshotObject = {
                                src: snapshot,
                                type: url.type,
                                size: url.size,
                                modified: Date.now()
                            };

                            self.embed.snapshot = snapshotObject;
                            self.updateEmbed(self.embed);
                        };
                    } else {
                        console.log('You cancelled the annotation!!!');
                    }

                    done(true);
                }
            }).show(this.embed.snapshot.src);
        },
        changeLocation() {
            const link = this.embed.historicLink;
            if (!link) {
                return;
            }

            const bounds = this.openmct.time.bounds();
            const isTimeBoundChanged = this.embed.bounds.start !== bounds.start
                && this.embed.bounds.end !== bounds.end;
            const isFixedTimespanMode = !this.openmct.time.clock();

            window.location.href = link;

            let message = '';
            if (isTimeBoundChanged) {
                this.openmct.time.bounds({
                    start: this.embed.bounds.start,
                    end: this.embed.bounds.end
                });
                message = 'Time bound values changed';
            }

            if (!isFixedTimespanMode) {
                message = 'Time bound values changed to fixed timespan mode';
            }

            this.openmct.notifications.alert(message);
        },
        formatTime(unixTime, timeFormat) {
            return Moment.utc(unixTime).format(timeFormat);
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
                    annotateSnapshot: self.annotateSnapshot
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
            const self = this;
            const actions = [new PreviewAction(self.openmct)];

            actions.forEach((action) => {
                self.actions.push({
                    cssClass: action.cssClass,
                    name: action.name,
                    perform: () => {
                        action.invoke(JSON.parse(self.embed.objectPath));
                    }
                });
            });
        },
        removeEmbed(id) {
            this.$emit('removeEmbed', id);
        },
        removeEmbedAction() {
            const self = this;

            return {
                name: self.removeActionString,
                cssClass: 'icon-trash',
                perform: function (embed) {
                    const dialog = self.openmct.overlays.dialog({
                        iconClass: "error",
                        message: `This action will permanently ${self.removeActionString.toLowerCase()}. Do you wish to continue?`,
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
                                dialog.dismiss();
                                self.removeEmbed(embed.id);
                            }
                        }]
                    });
                }
            };
        },
        toggleActionMenu(event) {
            togglePopupMenu(event, this.openmct);
        },
        updateEmbed(embed) {
            this.$emit('updateEmbed', embed);
        }
    }
}
</script>
