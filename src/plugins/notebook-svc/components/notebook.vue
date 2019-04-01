<template>
    <div class="c-notebook">
        <div class="c-notebook__head">
            <search class="c-notebook__search"
                    :value="searchValue"
                    @input="searchEntries"
                    @clear="searchEntries">
            </search>

            <div class="c-notebook__controls ">
                <select class="c-notebook__controls__time" v-model="timeFrame">
                    <option value="0" :selected="timeFrame==='0'">Show all</option>
                    <option value="1" :selected="timeFrame==='1'">Last hour</option>
                    <option value="8" :selected="timeFrame==='8'">Last 8 hours</option>
                    <option value="24" :selected="timeFrame==='24'">Last 24 hours</option>
                </select>
                <select class="c-notebook__controls__time" v-model="sortOrder">
                    <option value="newest" :selected="sortOrder === 'newest'">Newest first</option>
                    <option value="oldest" :selected="sortOrder === 'oldest'">Oldest first</option>
                </select>
            </div>
        </div>
        <div class="c-notebook__drag-area icon-plus"
            @click="newEntry">
            <span class="c-notebook__drag-area__label">To start a new entry, click here or drag and drop any object</span>
        </div>
        <div class="c-notebook__entries">
            <ul>
                <entry
                    v-for="entry in entries"
                    :key="entry.id"
                    :entry="entry"
                    @update-entry="persistEntry"
                    @delete-entry="deleteEntry"
                    @drop-embed="addEmbed">
                </entry>
            </ul>
        </div>
    </div>
</template>

<style lang="scss">

</style>

<script>
import Search from '../../../ui/components/search.vue';
import Entry from './entry.vue';
import Moment from 'moment';
import searchVue from '../../../ui/components/search.vue';

function formatTime(unixTime, format) {
    return Moment(unixTime).format(format)
}

export default {
    inject: ['openmct', 'providedDomainObject'],
    components: {
        Search,
        Entry
    },
    provide: {
        formatTime
    },
    data() {
        return {
            domainObject: this.providedDomainObject,
            timeFrame: '0',
            searchValue: '',
            sortOrder: this.providedDomainObject.configuration.sortOrder
        }
    },
    methods: {
        searchEntries(value) {
            this.searchValue = value;
        },
        updateDomainObject(domainObject) {
            this.domainObject = domainObject;
        },
        newEntry() {
            this.searchValue = '';

            let date = Date.now(),
                entry = {'id': 'entry-' + date, 'createdOn': date, 'embeds':[]},
                entries = this.domainObject.entries,
                lastEntry = entries[entries.length - 1];
            
            if (lastEntry && !lastEntry.text) {
                let lastEntryComponent = this.$children.find(entryComponent => {
                    if (entryComponent.entry) {
                        return entryComponent.entry.id === lastEntry.id;
                    }
                });
                
                lastEntryComponent.$refs.contenteditable.focus();
            } else {
                entries.push(entry);

                this.openmct.objects.mutate(this.domainObject, 'entries', entries);
            }
        },
        findEntry(entryId) {
            return this.domainObject.entries.findIndex(entry => {
                return entry.id === entryId;
            })
        },
        persistEntry(entryId, text) {
            let entryPos = this.findEntry(entryId);

            this.openmct.objects.mutate(this.domainObject, `entries[${entryPos}].text`, text);
        },
        deleteEntry(entryId) {
            let entryPos = this.findEntry(entryId),
                entries = this.domainObject.entries;
            
            entries.splice(entryPos, 1);
            this.openmct.objects.mutate(this.domainObject, 'entries', entries);
        },
        applySearch(entries) {
            return entries.filter((entry) => {
                if (entry.text.includes(this.searchValue)) {
                    return entry;
                }
            });
        },
        addEmbed(entryId, event) {
            var data = event.dataTransfer.getData('openmct/domain-object-path');

            if (data) {
                var objectPath = JSON.parse(data),
                    domainObject = objectPath[0],
                    domainObjectKey = domainObject.identifier.key,
                    domainObjectType = this.openmct.types.get(domainObject.type),
                    cssClass = domainObjectType && domainObjectType.definition ? 
                        domainObjectType.definition.cssClass : 'icon-object-unknown',
                    entryPos = this.findEntry(entryId),
                    currentEntryEmbeds = this.domainObject.entries[entryPos].embeds,
                    newEmbed = {
                        id: '' + Date.now(),
                        domainObject: domainObject,
                        objectPath: objectPath,
                        type: domainObjectKey,
                        cssClass: cssClass,
                        name: domainObject.name,
                        snapshot: ''
                    };
    
                currentEntryEmbeds.push(newEmbed);
                this.openmct.objects.mutate(this.domainObject, 'entries[' + entryPos + '].embeds', currentEntryEmbeds);
            }
        }
    },
    computed: {
        entries() {
            let entries = [...this.domainObject.entries];
            
            if (this.searchValue !== '') {
                entries = this.applySearch(entries);
            }

            if (this.sortOrder === 'newest') {
                return entries.reverse();
            } else {
                return entries;
            }
        }
    },
    mounted() {
        this.openmct.objects.observe(this.domainObject, '*', this.updateDomainObject);
    }
}
</script>
