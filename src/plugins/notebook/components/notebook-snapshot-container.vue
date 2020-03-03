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
            <button @click="close">X</button>
        </div>
    </div>
    <div class="">
        <ul>
            <li v-for="(snapshot, index) in snapshots"
                :key="snapshot.id"
            >
                {{ index + 1 }} : {{ snapshot.id }} {{ snapshot.name }}
            </li>
        </ul>
    </div>
</div>
</template>

<script>
// import NotebookEmbed from './notebook-embed.vue';
import snapshotContainer, { NOTEBOOK_SNAPSHOT_MAX_COUNT } from '../snapshot-container';
import { EVENT_SNAPSHOTS_UPDATED } from '../notebook-constants';

import $ from 'zepto';

export default {
    inject: ['openmct'],
    components: {
        // NotebookEmbed
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
            popupService: this.openmct.$injector.get('popupService'),
            snapshots: snapshotContainer.getSnapshots()
        }
    },
    mounted() {
        snapshotContainer.on(EVENT_SNAPSHOTS_UPDATED, this.snapshotsUpdated);
    },
    methods: {
        close() {
            this.toggleSnapshot();
        },
        getNotebookSnapshotMaxCount() {
            return NOTEBOOK_SNAPSHOT_MAX_COUNT;
        },
        removeAllSnapshotAction() {
            var self = this;

            return {
                name: 'Delete All Snapshots',
                cssClass: 'icon-trash',
                perform: function (embed, entry) {
                    var dialog = self.openmct.overlays.dialog({
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
        snapshotsUpdated() {
            this.snapshots = snapshotContainer.getSnapshots();
        },
        toggleActionMenu(event) {
            event.preventDefault();

            const body = $(document.body);
            const container = $(event.target.parentElement.parentElement);
            const classList = document.querySelector('body').classList;
            const isPhone = Array.from(classList).includes('phone');
            const isTablet = Array.from(classList).includes('tablet');

            const initiatingEvent = isPhone || isTablet
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
