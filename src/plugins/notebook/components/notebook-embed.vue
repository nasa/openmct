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
            {{ createdOn }}
        </div>
    </div>
</div>
</template>

<script>
import Moment from 'moment';
import PreviewAction from '../../../ui/preview/PreviewAction';
import PainterroInstance from '../utils/painterroInstance';
import RemoveDialog from '../utils/removeDialog';
import SnapshotTemplate from './snapshot-template.html';
import { togglePopupMenu } from '../utils/popup-menu';
import Vue from 'vue';

export default {
    inject: ['openmct'],
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
            actions: []
        }
    },
    computed: {
        createdOn() {
            return this.formatTime(this.embed.createdOn, 'YYYY-MM-DD HH:mm:ss');
        }
    },
    beforeMount() {
        this.populateActionMenu();
    },
    mounted() {
        this.initRemoveDialog();
    },
    methods: {
        annotateSnapshot() {
            let painterroInstance = null;
            const annotateVue = new Vue({
                template: '<div id="snap-annotation"></div>'
            });

            const annotateOverlay = this.openmct.overlays.overlay({
                element: annotateVue.$mount().$el,
                size: 'large',
                dismissable: false,
                buttons: [
                    {
                        label: 'Cancel',
                        emphasis: true,
                        callback: () => {
                            painterroInstance.dismiss();
                            annotateOverlay.dismiss();
                        }
                    },
                    {
                        label: 'Save',
                        callback: () => {
                            painterroInstance.save();
                            annotateOverlay.dismiss();
                            this.snapshotOverlay.dismiss();
                            this.openSnapshot();
                        }
                    }
                ],
                onDestroy: () => {
                    annotateVue.$destroy(true);
                }
            });

            painterroInstance = new PainterroInstance();
            painterroInstance.callback = this.updateSnapshot;
            painterroInstance.show(this.embed.snapshot.src);
        },
        changeLocation() {
            this.openmct.time.stopClock();
            this.openmct.time.bounds({
                start: this.embed.bounds.start,
                end: this.embed.bounds.end
            });

            const link = this.embed.historicLink;

            window.location.href = link;
            const message = 'Time bounds changed to fixed timespan mode';
            this.openmct.notifications.alert(message);
        },
        formatTime(unixTime, timeFormat) {
            return Moment.utc(unixTime).format(timeFormat);
        },
        initRemoveDialog() {
            const buttons = [
                { label: "No" },
                {
                    label: "Yes",
                    emphasis: true,
                    clicked: this.removeEmbed.bind(this)
                }
            ];
            const cssClass = 'icon-trash';
            const iconClass = "error";
            const message = `This action will permanently ${this.removeActionString.toLowerCase()}. Do you wish to continue?`;
            const name = this.removeActionString;

            const removeDialog = new RemoveDialog(this.openmct, {
                buttons,
                cssClass,
                iconClass,
                message,
                name
            });

            const removeAction = removeDialog.getRemoveAction();

            this.actions = this.actions.concat(removeAction);
        },
        openSnapshot() {
            const snapshot = new Vue({
                data: () => {
                    return {
                        createdOn: this.createdOn,
                        embed: this.embed
                    };
                },
                methods: {
                    annotateSnapshot: this.annotateSnapshot.bind(this)
                },
                template: SnapshotTemplate
            }).$mount();

            this.snapshotOverlay = this.openmct.overlays.overlay({
                element: snapshot.$el,
                onDestroy: () => { snapshot.$destroy(true) },
                size: 'large',
                dismissable: true,
                buttons: [
                    {
                        label: 'Done',
                        emphasis: true,
                        callback: () => {
                            this.snapshotOverlay.dismiss();
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
        removeEmbed(embed) {
            this.$emit('removeEmbed', embed.id);
        },
        toggleActionMenu(event) {
            togglePopupMenu(event, this.openmct);
        },
        updateEmbed(embed) {
            this.$emit('updateEmbed', embed);
        },
        updateSnapshot(snapshotObject) {
            this.embed.snapshot = snapshotObject;
            this.updateEmbed(this.embed);
        }
    }
}
</script>
