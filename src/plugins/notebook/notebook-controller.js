import Vue from 'vue';

import EntryController from './entry-controller';
import EmbedController from './embed-controller';
import NotebookTemplate from './components/notebook.html';
import EntryTemplate from './components/entry.html';
import EmbedTemplate from './components/embed.html';
import Search from '@/ui/components/search.vue';
import PreviewAction from '@/ui/preview/PreviewAction';
import objectLinkMixin from '@/ui/mixins/object-link';


export default class NotebookController {
    constructor(openmct, domainObject) {
        this.openmct = openmct;
        this.domainObject = domainObject;
        this.entrySearch = '';
        this.previewAction = new PreviewAction(openmct);

        this.show = this.show.bind(this);
        this.destroy = this.destroy.bind(this);
        this.newEntry = this.newEntry.bind(this);
        this.entryPosById = this.entryPosById.bind(this);
    }

    initializeVue(container) {
        const self = this,
            entryController = new EntryController(this.openmct, this.domainObject),
            embedController = new EmbedController(this.openmct, this.domainObject);

        this.container = container;

        const notebookEmbed = {
            inject:['openmct', 'domainObject'],
            mixins:[objectLinkMixin],
            props:['embed', 'entry'],
            template: EmbedTemplate,
            data: embedController.exposedData,
            methods: embedController.exposedMethods(),
            beforeMount: embedController.populateActionMenu(self.openmct, [self.previewAction])
        }

        const entryComponent = {
            props:['entry'],
            template: EntryTemplate,
            components: {
                'notebook-embed': notebookEmbed
            },
            data: entryController.exposedData,
            methods: entryController.exposedMethods(),
            mounted: self.focusOnEntry
        }

        const NotebookVue = Vue.extend({
            provide: { openmct: self.openmct, domainObject: self.domainObject},
            components: {
                'notebook-entry': entryComponent,
                'search': Search
            },
            data: function () {
                return {
                    entrySearch: self.entrySearch,
                    showTime: '0',
                    sortEntries: self.domainObject.defaultSort,
                    entries: self.domainObject.entries,
                    currentEntryValue: ''
                }
            },
            computed: {
                filteredAndSortedEntries() {
                    return this.sort(this.filterBySearch(this.entries, this.entrySearch), this.sortEntries);
                }
            },
            methods: {
                search(value) {
                    this.entrySearch = value;
                },
                newEntry: self.newEntry,
                filterBySearch: self.filterBySearch,
                sort: self.sort
            },
            template: NotebookTemplate
        });

        // this.NotebookVue =  new NotebookVue();
        // container.appendChild(this.NotebookVue.$mount().$el);

        return new NotebookVue();
    }

    newEntry(event) {
        console.log('newEntry', this);
        this.NotebookVue.search('');

        const date = Date.now();
        let embed;

        if (event.dataTransfer && event.dataTransfer.getData('openmct/domain-object-path')) {
            const selectedObject = JSON.parse(event.dataTransfer.getData('openmct/domain-object-path'))[0],
                selectedObjectId = selectedObject.identifier.key,
                cssClass = this.openmct.types.get(selectedObject.type);

            embed = {
                type: selectedObjectId,
                id: '' + date,
                cssClass: cssClass,
                name: selectedObject.name,
                snapshot: ''
            }
        }

        const entries = this.domainObject.entries,
            lastEntryIndex = this.NotebookVue.sortEntries === 'newest' ? 0 : entries.length - 1,
            lastEntry = entries[lastEntryIndex];

        if (lastEntry === undefined || lastEntry.text || lastEntry.embeds.length) {
            const createdEntry = {'id': 'entry-' + date, 'createdOn': date, 'embeds':[]}

            if (embed) {
                createdEntry.embeds.push(embed);
            }

            entries.push(createdEntry);
            this.openmct.objects.mutate(this.domainObject, 'entries', entries);
        } else {
            lastEntry.createdOn = date;

            if(embed) {
                lastEntry.embeds.push(embed);
            }

            this.openmct.objects.mutate(this.domainObject, 'entries[entries.length-1]', lastEntry);
            this.focusOnEntry.bind(this.NotebookVue.$children[lastEntryIndex+1])();
        }
    }

    entryPosById(entryId) {
        let foundId = -1;

        this.domainObject.entries.forEach(function (element, index) {
            if (element.id === entryId) {
                foundId = index;
                return;
            }
        });

        return foundId;
    }

    focusOnEntry() {
        if (!this.entry.text) {
            this.$refs.contenteditable.focus();
        }
    }

    filterBySearch(entryArray, filterString) {
        if (!filterString) {
            return entryArray;
        }

        const lowerCaseFilterString = filterString.toLowerCase();

        return entryArray.filter(entry => entry.text
            ? entry.text.toLowerCase().includes(lowerCaseFilterString)
            : false);
    }

    sort(array, sortDirection) {
        const oldest = (a,b) => {
            if (a.createdOn < b.createdOn) {
                return -1;
            }

            if (a.createdOn > b.createdOn) {
                return 1;
            }

            return 0;
        };

        const newest = (a,b) => {
            if (a.createdOn < b.createdOn) {
                return 1;
            }

            if (a.createdOn > b.createdOn) {
                return -1;
            }

            return 0;
        };

        return (sortDirection === 'newest')
            ? array.sort(newest)
            : array.sort(oldest);
    }

    show(container) {
        this.initializeVue(container);
    }

    destroy(container) {
        this.NotebookVue.$destroy(true);
    }
}
