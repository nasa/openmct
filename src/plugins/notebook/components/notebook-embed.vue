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
            <PopupMenu :popup-menu-items="popupMenuItems" />
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
import PopupMenu from './popup-menu.vue';
import PreviewAction from '../../../ui/preview/PreviewAction';
import PainterroInstance from '../utils/painterroInstance';
import RemoveDialog from '../utils/removeDialog';
import SnapshotTemplate from './snapshot-template.html';
import Vue from 'vue';

export default {
    inject: ['openmct'],
    components: {
        PopupMenu
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
                return 'Remove This Embed';
            }
        }
    },
    data() {
        return {
            popupMenuItems: []
        }
    },
    computed: {
        createdOn() {
            return this.formatTime(this.embed.createdOn, 'YYYY-MM-DD HH:mm:ss');
        }
    },
    mounted() {
        this.addPopupMenuItems();
    },
    methods: {
        addPopupMenuItems() {
            const removeEmbed = {
                cssClass: 'icon-trash',
                name: this.removeActionString,
                callback: this.getRemoveDialog.bind(this)
            }
            const preview = {
                cssClass: 'icon-eye-open',
                name: 'Preview',
                callback: this.previewEmbed.bind(this)
            }

            this.popupMenuItems = [removeEmbed, preview];
        },
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
        getRemoveDialog() {
            const options = {
                name: this.removeActionString,
                callback: this.removeEmbed.bind(this)
            }
            const removeDialog = new RemoveDialog(this.openmct, options);
            removeDialog.show();
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
        previewEmbed() {
            const self = this;
            const previewAction = new PreviewAction(self.openmct);
            previewAction.invoke(JSON.parse(self.embed.objectPath));
        },
        removeEmbed(success) {
            if (!success) {
                return;
            }

            this.$emit('removeEmbed', this.embed.id);
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
