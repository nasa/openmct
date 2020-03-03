<template>
<li class="c-notebook__entry c-ne has-local-controls"
    @drop.prevent="dropOnEntry(entry.id, $event)"
>
    <div class="c-ne__time-and-content">
        <div v-if="!readOnly"
             class="c-ne__time"
        >
            <span>{{ formatTime(entry.createdOn, 'YYYY-MM-DD') }}</span>
            <span>{{ formatTime(entry.createdOn, 'HH:mm:ss') }}</span>
        </div>
        <div class="c-ne__content">
            <div class="c-ne__text c-input-inline"
                 contenteditable="true"
                 @blur="textBlur($event, entry.id)"
                 @focus="textFocus($event, entry.id)"
            >{{ entry.text }}
            </div>
            <div class="c-ne__embeds">
                <NotebookEmbed v-for="embed in entry.embeds"
                               ref="notebookEmbed"
                               :key="embed.id"
                               :embed="embed"
                               :object-path="embed.objectPath"
                               :entry="entry"
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
</li>
</template>

<script>
import NotebookEmbed from './notebook-embed.vue';
import { createNewEmbed, getNotebookEntries } from '../utils/notebook-entries';
import { EVENT_REMOVE_EMBED, EVENT_UPDATE_EMBED, EVENT_UPDATE_ENTRY } from '../notebook-constants';
import Moment from 'moment';

export default {
    inject: ['openmct'],
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
            currentEntryValue: ''
        }
    },
    watch: {
        readOnly(readOnly) {
            // this.$el.querySelector('.c-ne__text c-input-inline').contenteditable = !this.readOnly;
        },
        selectedSection(selectedSection) {
        },
        selectedPage(selectedSection) {
        }
    },
    mounted() {
        this.updateEntries = this.updateEntries.bind(this);

        if (this.$refs.notebookEmbed) {
            this.$refs.notebookEmbed.forEach(embed => {
                embed.$on(EVENT_REMOVE_EMBED, this.removeEmbed.bind(this));
                embed.$on(EVENT_UPDATE_EMBED, this.updateEmbed.bind(this));
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
        deleteEntry() {
            const self = this;
            if (!self.domainObject || !self.selectedSection || !self.selectedPage || !self.entry.id) {
                return;
            }

            const entryPosById = this.entryPosById(this.entry.id);
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
                            this.updateEntries(entries);
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
        dropOnEntry(entryId, $event) {
            if (!this.domainObject || !this.selectedSection || !this.selectedPage) {
                return;
            }

            var data = $event.dataTransfer.getData('openmct/domain-object-path');

            const objectPath = JSON.parse(data);
            const domainObject = objectPath[0];
            const domainObjectKey = domainObject.identifier.key;
            const domainObjectType = this.openmct.types.get(domainObject.type);
            const cssClass = domainObjectType && domainObjectType.definition
                ? domainObjectType.definition.cssClass
                : 'icon-object-unknown';
            const entryPos = this.entryPosById(entryId);
            const newEmbed = createNewEmbed(domainObject.name, cssClass, domainObjectKey, '', domainObject, objectPath);
            const entries = getNotebookEntries(this.domainObject, this.selectedSection, this.selectedPage);
            const currentEntryEmbeds = entries[entryPos].embeds;
            currentEntryEmbeds.push(newEmbed);
            this.updateEntries(entries);
        },
        entryPosById(entryId) {
            if (!this.domainObject || !this.selectedSection || !this.selectedPage) {
                return;
            }

            const entries = getNotebookEntries(this.domainObject, this.selectedSection, this.selectedPage);
            let foundId = -1;
            entries.forEach((element, index) => {
                if (element.id === entryId) {
                    foundId = index;

                    return;
                }
            });

            return foundId;
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
        removeEmbed(id) {
            const embedPosition = this.findPositionInArray(this.entry.embeds, id);
            this.entry.embeds.splice(embedPosition, 1);
            this.updateEntry(this.entry);
        },
        textBlur($event, entryId) {
            if (!this.domainObject || !this.selectedSection || !this.selectedPage) {
                return;
            }

            const target = $event.target;
            if (!target) {
                return;
            }

            const entryPos = this.entryPosById(entryId);
            if (this.currentEntryValue !== target.innerText) {
                const entries = getNotebookEntries(this.domainObject, this.selectedSection, this.selectedPage);
                entries[entryPos].text = target.textContent.trim();
                this.updateEntries(entries);
            }
        },
        textFocus($event) {
            if (!this.domainObject || !this.selectedSection || !this.selectedPage) {
                return;
            }

            if ($event.target) {
                this.currentEntryValue = $event.target.innerText;
            } else {
                $event.target.innerText = '';
            }
        },
        updateEmbed(newEmbed) {
            let embed = this.entry.embeds.find(e => e.id === newEmbed.id);

            if (!embed) {
                return;
            }

            embed = newEmbed;
            this.updateEntry(this.entry);
        },
        updateEntry(newEntry) {
            if (!this.domainObject || !this.selectedSection || !this.selectedPage) {
                return;
            }

            const entries = getNotebookEntries(this.domainObject, this.selectedSection, this.selectedPage);
            entries.forEach(entry => {
                if (entry.id === newEntry.id) {
                    entry = newEntry;
                }
            });

            this.updateEntries(entries);
        },
        updateEntries(entries) {
            if (!this.domainObject || !this.selectedSection || !this.selectedPage) {
                return;
            }

            const configuration = this.domainObject.configuration;
            const notebookEntries = configuration.entries || {};
            notebookEntries[this.selectedSection.id][this.selectedPage.id] = entries;

            this.openmct.objects.mutate(this.domainObject, 'configuration.entries', notebookEntries);
        }
    }
}
</script>
