<template>
<div class="c-notebook__entry c-ne has-local-controls"
     @dragover="changeCursor"
     @drop.capture="cancelEditMode"
     @drop.prevent="dropOnEntry"
>
    <div class="c-ne__time-and-content">
        <div class="c-ne__time">
            <span>{{ createdOnDate }}</span>
            <span>{{ createdOnTime }}</span>
        </div>
        <div class="c-ne__content">
            <div :id="entry.id"
                 class="c-ne__text"
                 :class="{'c-input-inline' : !readOnly }"
                 :contenteditable="!readOnly"
                 :style="!entry.text.length ? defaultEntryStyle : ''"
                 @blur="updateEntryValue($event, entry.id)"
                 @focus="updateCurrentEntryValue($event, entry.id)"
            >{{ entry.text.length ? entry.text : defaultText }}</div>
            <div class="c-snapshots c-ne__embeds">
                <NotebookEmbed v-for="embed in entry.embeds"
                               :key="embed.id"
                               :embed="embed"
                               :entry="entry"
                               @removeEmbed="removeEmbed"
                               @updateEmbed="updateEmbed"
                />
            </div>
        </div>
    </div>
    <div v-if="!readOnly"
         class="c-ne__local-controls--hidden"
    >
        <button class="c-icon-button c-icon-button--major icon-trash"
                title="Delete this entry"
                @click="deleteEntry"
        >
        </button>
    </div>
    <div v-if="readOnly"
         class="c-ne__section-and-page"
    >
        <a class="c-click-link"
           @click="navigateToSection()"
        >
            {{ result.section.name }}
        </a>
        <span class="icon-arrow-right"></span>
        <a class="c-click-link"
           @click="navigateToPage()"
        >
            {{ result.page.name }}
        </a>
    </div>
</div>
</template>

<script>
import NotebookEmbed from './notebook-embed.vue';
import { createNewEmbed, getEntryPosById, getNotebookEntries } from '../utils/notebook-entries';
import Moment from 'moment';

export default {
    inject: ['openmct', 'snapshotContainer'],
    components: {
        NotebookEmbed
    },
    props: {
        domainObject: {
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
        result: {
            type: Object,
            default() {
                return {};
            }
        },
        selectedPage: {
            type: Object,
            default() {
                return {};
            }
        },
        selectedSection: {
            type: Object,
            default() {
                return {};
            }
        },
        readOnly: {
            type: Boolean,
            default() {
                return true;
            }
        }
    },
    data() {
        return {
            currentEntryValue: '',
            defaultEntryStyle: {
                fontStyle: 'italic',
                color: '#6e6e6e'
            },
            defaultText: 'add description'
        }
    },
    computed : {
        createdOnDate() {
            return this.formatTime(this.entry.createdOn, 'YYYY-MM-DD');
        },
        createdOnTime() {
            return this.formatTime(this.entry.createdOn, 'HH:mm:ss');
        }
    },
    mounted() {
        this.updateEntries = this.updateEntries.bind(this);
        this.dropOnEntry = this.dropOnEntry.bind(this);
    },
    methods: {
        cancelEditMode(event) {
            const isEditing = this.openmct.editor.isEditing();
            if (isEditing) {
                this.openmct.editor.cancel();
            }
        },
        changeCursor() {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
        },
        deleteEntry() {
            const self = this;
            const entryPosById = self.entryPosById(self.entry.id);
            if (entryPosById === -1) {
                return;
            }

            const dialog = this.openmct.overlays.dialog({
                iconClass: 'alert',
                message: 'This action will permanently delete this entry. Do you wish to continue?',
                buttons: [
                    {
                        label: "Ok",
                        emphasis: true,
                        callback: () => {
                            const entries = getNotebookEntries(self.domainObject, self.selectedSection, self.selectedPage);
                            entries.splice(entryPosById, 1);
                            self.updateEntries(entries);
                            dialog.dismiss();
                        }
                    },
                    {
                        label: "Cancel",
                        callback: () => {
                            dialog.dismiss();
                        }
                    }
                ]
            });
        },
        dropOnEntry($event) {
            event.stopImmediatePropagation();

            const snapshotId = $event.dataTransfer.getData('openmct/snapshot/id');
            if (snapshotId.length) {
                this.moveSnapshot(snapshotId);

                return;
            }

            const data = $event.dataTransfer.getData('openmct/domain-object-path');
            const objectPath = JSON.parse(data);
            const entryPos = this.entryPosById(this.entry.id);
            const bounds = this.openmct.time.bounds();
            const snapshotMeta = {
                bounds,
                link: null,
                objectPath,
                openmct: this.openmct
            }
            const newEmbed = createNewEmbed(snapshotMeta);
            const entries = getNotebookEntries(this.domainObject, this.selectedSection, this.selectedPage);
            const currentEntryEmbeds = entries[entryPos].embeds;
            currentEntryEmbeds.push(newEmbed);
            this.updateEntries(entries);
        },
        entryPosById(entryId) {
            return getEntryPosById(entryId, this.domainObject, this.selectedSection, this.selectedPage);
        },
        findPositionInArray(array, id) {
            let position = -1;
            array.some((item, index) => {
                const found = item.id === id;
                if (found) {
                    position = index;
                }

                return found;
            });

            return position;
        },
        formatTime(unixTime, timeFormat) {
            return Moment(unixTime).format(timeFormat);
        },
        moveSnapshot(snapshotId) {
            const snapshot = this.snapshotContainer.getSnapshot(snapshotId);
            this.entry.embeds.push(snapshot);
            this.updateEntry(this.entry);
            this.snapshotContainer.removeSnapshot(snapshotId);
        },
        navigateToPage() {
            this.$emit('changeSectionPage', {
                sectionId: this.result.section.id,
                pageId: this.result.page.id
            });
        },
        navigateToSection() {
            this.$emit('changeSectionPage', {
                sectionId: this.result.section.id,
                pageId: null
            });
        },
        removeEmbed(id) {
            const embedPosition = this.findPositionInArray(this.entry.embeds, id);
            this.entry.embeds.splice(embedPosition, 1);
            this.updateEntry(this.entry);
        },
        selectTextInsideElement(element) {
            const range = document.createRange();
            range.selectNodeContents(element);
            var selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        },
        updateCurrentEntryValue($event) {
            if (this.readOnly) {
                return;
            }

            const target = $event.target
            this.currentEntryValue = target ? target.innerText : '';

            if (!this.entry.text.length) {
                this.selectTextInsideElement(target);
            }
        },
        updateEmbed(newEmbed) {
            this.entry.embeds.some(e => {
                const found = (e.id === newEmbed.id);
                if (found) {
                    e = newEmbed;
                }

                return found;
            });

            this.updateEntry(this.entry);
        },
        updateEntry(newEntry) {
            const entries = getNotebookEntries(this.domainObject, this.selectedSection, this.selectedPage);
            entries.some(entry => {
                const found = (entry.id === newEntry.id);
                if (found) {
                    entry = newEntry;
                }

                return found;
            });

            this.updateEntries(entries);
        },
        updateEntryValue($event, entryId) {
            if (!this.domainObject || !this.selectedSection || !this.selectedPage) {
                return;
            }

            const target = $event.target;
            if (!target) {
                return;
            }

            const entryPos = this.entryPosById(entryId);
            const value = target.textContent.trim();
            if (this.currentEntryValue !== value) {
                const entries = getNotebookEntries(this.domainObject, this.selectedSection, this.selectedPage);
                entries[entryPos].text = value;

                this.updateEntries(entries);
            }
        },
        updateEntries(entries) {
            this.$emit('updateEntries', entries);
        }
    }
}
</script>
