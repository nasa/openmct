<template>
<div class="c-snapshot-container">
    <div class="l-browse-bar">
        <div class="l-browse-bar__start">
            <div class="c-ne__embed__info">
                <div class="c-ne__embed__name">
                    Notebook Snapshots
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
                                    @click="action.perform()"
                                >
                                    {{ action.name }}
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <div class="">{{ snapshots.length }} of {{ getNotebookSnapshotMaxCount() }}</div>
        </div>
        <div class="l-browse-bar__end">
            <button class="c-icon-button icon-x"
                    @click="close"
            ></button>
        </div>
    </div>
    <div class="">
        <span v-for="snapshot in snapshots"
              :key="snapshot.id"
              draggable="true"
              @dragstart="startEmbedDrag(snapshot, $event)"
        >
            <NotebookEmbed ref="notebookEmbed"
                           :key="snapshot.id"
                           :embed="snapshot"
                           :remove-action-string="'Delete Snapshot'"
            />
        </span>
    </div>
</div>
</template>

<script>
import NotebookEmbed from './notebook-embed.vue';
import snapshotContainer, { NOTEBOOK_SNAPSHOT_MAX_COUNT } from '../snapshot-container';
import { EVENT_REMOVE_EMBED, EVENT_UPDATE_EMBED, EVENT_SNAPSHOTS_UPDATED } from '../notebook-constants';
import { togglePopupMenu } from '../utils/popup-menu';

export default {
    inject: ['openmct'],
    components: {
        NotebookEmbed
    },
    props: {
        toggleSnapshot: {
            type: Function,
            default() {
                return () => {};
            }
        }
    },
    data() {
        return {
            actions: [this.removeAllSnapshotAction()],
            snapshots: snapshotContainer.getSnapshots()
        }
    },
    mounted() {
        snapshotContainer.on(EVENT_SNAPSHOTS_UPDATED, this.snapshotsUpdated);

        if (this.$refs.notebookEmbed) {
            this.$refs.notebookEmbed.forEach(embed => {
                embed.$on(EVENT_REMOVE_EMBED, this.removeSnapshot.bind(this));
                embed.$on(EVENT_UPDATE_EMBED, this.updateSnapshot.bind(this));
            });
        }
    },
    beforeDestory() {
        if (this.$refs.notebookEmbed) {
            this.$refs.notebookEmbed.forEach(embed => {
                embed.$off();
            });
        }
    },
    methods: {
        close() {
            this.toggleSnapshot();
        },
        getNotebookSnapshotMaxCount() {
            return NOTEBOOK_SNAPSHOT_MAX_COUNT;
        },
        removeAllSnapshotAction() {
            const self = this;

            return {
                name: 'Delete All Snapshots',
                cssClass: 'icon-trash',
                perform: function (embed) {
                    const dialog = self.openmct.overlays.dialog({
                        iconClass: "error",
                        message: 'This action will delete all Notebook Snapshots. Do you want to continue?',
                        buttons: [
                            {
                                label: "No",
                                callback: () => {
                                    dialog.dismiss();
                                }
                            },
                            {
                                label: "Yes",
                                emphasis: true,
                                callback: () => {
                                    self.removeAllSnapshots();
                                    dialog.dismiss();
                                }
                            }
                        ]
                    });
                }
            };
        },
        removeAllSnapshots() {
            snapshotContainer.removeAllSnapshots();
        },
        removeSnapshot(id) {
            snapshotContainer.removeSnapshot(id);
        },
        snapshotsUpdated() {
            this.snapshots = snapshotContainer.getSnapshots();
            this.$nextTick(() => {
                if (!this.$refs.notebookEmbed) {
                    return;
                }

                this.$refs.notebookEmbed.forEach(embed => {
                    embed.$off();
                    embed.$on(EVENT_REMOVE_EMBED, this.removeSnapshot.bind(this));
                    embed.$on(EVENT_UPDATE_EMBED, this.updateSnapshot.bind(this));
                });
            });
        },
        startEmbedDrag(snapshot, event) {
            event.dataTransfer.setData('text/plain', snapshot.id);
            event.dataTransfer.setData('snapshot/id', snapshot.id);
        },
        toggleActionMenu(event) {
            togglePopupMenu(event, this.openmct);
        },
        updateSnapshot(snapshot) {
            snapshotContainer.updateSnapshot(snapshot);
        }
    }
}
</script>
