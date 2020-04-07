<template>
<div class="c-snapshots-h">
    <div class="l-browse-bar">
        <div class="l-browse-bar__start">
            <div class="l-browse-bar__object-name--w icon-notebook">
                <div class="l-browse-bar__object-name">
                    Notebook Snapshots
                    <span v-if="snapshots.length"
                          class="l-browse-bar__object-details"
                    >&nbsp;{{ snapshots.length }} of {{ getNotebookSnapshotMaxCount() }}
                    </span>
                </div>
                <a class="l-browse-bar__context-actions c-disclosure-button"
                   @click="toggleActionMenu"
                ></a>
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

        </div>
        <div class="l-browse-bar__end">
            <button class="c-click-icon c-click-icon--major icon-x"
                    @click="close"
            ></button>
        </div>
    </div><!-- closes l-browse-bar -->
    <div class="c-snapshots">
        <span v-for="snapshot in snapshots"
              :key="snapshot.id"
              draggable="true"
              @dragstart="startEmbedDrag(snapshot, $event)"
        >
            <NotebookEmbed ref="notebookEmbed"
                           :key="snapshot.id"
                           :embed="snapshot"
                           :remove-action-string="'Delete Snapshot'"
                           @updateEmbed="updateSnapshot"
                           @removeEmbed="removeSnapshot"
            />
        </span>
        <div v-if="!snapshots.length > 0"
             class="hint"
        >
            There are no Notebook Snapshots currently.
        </div>
    </div>
</div>
</template>

<script>
import NotebookEmbed from './notebook-embed.vue';
import RemoveDialog from '../utils/removeDialog';
import { NOTEBOOK_SNAPSHOT_MAX_COUNT } from '../snapshot-container';
import { EVENT_SNAPSHOTS_UPDATED } from '../notebook-constants';
import { togglePopupMenu } from '../utils/popup-menu';

export default {
    inject: ['openmct', 'snapshotContainer'],
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
            actions: [],
            snapshots: []
        }
    },
    mounted() {
        this.initRemoveDialog();
        this.snapshotContainer.on(EVENT_SNAPSHOTS_UPDATED, this.snapshotsUpdated);
        this.snapshots = this.snapshotContainer.getSnapshots();
    },
    beforeDestory() {
    },
    methods: {
        close() {
            this.toggleSnapshot();
        },
        getNotebookSnapshotMaxCount() {
            return NOTEBOOK_SNAPSHOT_MAX_COUNT;
        },
        initRemoveDialog() {
            const buttons = [
                { label: "No" },
                {
                    label: "Yes",
                    emphasis: true,
                    clicked: this.removeAllSnapshots.bind(this)
                }
            ];
            const cssClass = 'icon-trash';
            const iconClass = "error";
            const message = 'This action will delete all notebook snapshots. Do you want to continue?';
            const name = 'Delete All Snapshots';

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
        removeAllSnapshots() {
            this.snapshotContainer.removeAllSnapshots();
        },
        removeSnapshot(id) {
            this.snapshotContainer.removeSnapshot(id);
        },
        snapshotsUpdated() {
            this.snapshots = this.snapshotContainer.getSnapshots();
        },
        startEmbedDrag(snapshot, event) {
            event.dataTransfer.setData('text/plain', snapshot.id);
            event.dataTransfer.setData('openmct/snapshot/id', snapshot.id);
        },
        toggleActionMenu(event) {
            togglePopupMenu(event, this.openmct);
        },
        updateSnapshot(snapshot) {
            this.snapshotContainer.updateSnapshot(snapshot);
        }
    }
}
</script>
