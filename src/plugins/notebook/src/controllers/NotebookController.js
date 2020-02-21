/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

define([
    'vue',
    './EntryController',
    './EmbedController',
    '../../res/templates/notebook.html',
    '../../res/templates/entry.html',
    '../../res/templates/embed.html',
    '../../../../ui/components/search.vue',
    '../../../../ui/preview/PreviewAction',
    '../../../../ui/mixins/object-link'
],
function (
    Vue,
    EntryController,
    EmbedController,
    NotebookTemplate,
    EntryTemplate,
    EmbedTemplate,
    search,
    PreviewAction,
    objectLinkMixin
) {

    function NotebookController(openmct, domainObject) {
        this.openmct = openmct;
        this.domainObject = domainObject;
        this.entrySearch = '';
        this.previewAction = new PreviewAction.default(openmct);

        this.show = this.show.bind(this);
        this.destroy = this.destroy.bind(this);
        this.newEntry = this.newEntry.bind(this);
        this.entryPosById = this.entryPosById.bind(this);
    }

    NotebookController.prototype.initializeVue = function (container) {
        var self = this,
            entryController = new EntryController(this.openmct, this.domainObject),
            embedController = new EmbedController(this.openmct, this.domainObject);

        this.container = container;

        var notebookEmbed = {
            inject:['openmct', 'domainObject'],
            mixins:[objectLinkMixin.default],
            props:['embed', 'entry'],
            template: EmbedTemplate,
            data: embedController.exposedData,
            methods: embedController.exposedMethods(),
            beforeMount: embedController.populateActionMenu(self.openmct, [self.previewAction])
        };

        var entryComponent = {
            props:['entry'],
            template: EntryTemplate,
            components: {
                'notebook-embed': notebookEmbed
            },
            data: entryController.exposedData,
            methods: entryController.exposedMethods(),
            mounted: self.focusOnEntry
        };

        var NotebookVue = Vue.extend({
            provide: {openmct: self.openmct, domainObject: self.domainObject},
            components: {
                'notebook-entry': entryComponent,
                'search': search.default
            },
            data: function () {
                return {
                    entrySearch: self.entrySearch,
                    showTime: '0',
                    sortEntries: self.domainObject.defaultSort,
                    entries: self.domainObject.entries,
                    currentEntryValue: ''
                };
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

        this.NotebookVue =  new NotebookVue();
        container.appendChild(this.NotebookVue.$mount().$el);
    };

    NotebookController.prototype.newEntry = function (event) {
        this.NotebookVue.search('');

        var date = Date.now(),
            embed;

        if (event.dataTransfer && event.dataTransfer.getData('openmct/domain-object-path')) {
            var selectedObject = JSON.parse(event.dataTransfer.getData('openmct/domain-object-path'))[0],
                selectedObjectId = selectedObject.identifier.key,
                cssClass = this.openmct.types.get(selectedObject.type);

            embed = {
                type: selectedObjectId,
                id: '' + date,
                cssClass: cssClass,
                name: selectedObject.name,
                snapshot: ''
            };
        }

        var entries = this.domainObject.entries,
            lastEntryIndex = this.NotebookVue.sortEntries === 'newest' ? 0 : entries.length - 1,
            lastEntry = entries[lastEntryIndex];

        if (lastEntry === undefined || lastEntry.text || lastEntry.embeds.length) {
            var createdEntry = {'id': 'entry-' + date, 'createdOn': date, 'embeds':[]};

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
    };

    NotebookController.prototype.entryPosById = function (entryId) {
        var foundId = -1;

        this.domainObject.entries.forEach(function (element, index) {
            if (element.id === entryId) {
                foundId = index;
                return;
            }
        });

        return foundId;
    };

    NotebookController.prototype.focusOnEntry = function () {
        if (!this.entry.text) {
            this.$refs.contenteditable.focus();
        }
    };

    NotebookController.prototype.filterBySearch = function (entryArray, filterString) {
        if (filterString) {
            var lowerCaseFilterString = filterString.toLowerCase();

            return entryArray.filter(function (entry) {
                if (entry.text) {
                    return entry.text.toLowerCase().includes(lowerCaseFilterString);
                } else {
                    return false;
                }
            });
        } else {
            return entryArray;
        }
    };

    NotebookController.prototype.sort = function (array, sortDirection) {
        let oldest = (a,b) => {
                if (a.createdOn < b.createdOn) {
                    return -1;
                } else if (a.createdOn > b.createdOn) {
                    return 1;
                } else {
                    return 0;
                }
            },
            newest = (a,b) => {
                if (a.createdOn < b.createdOn) {
                    return 1;
                } else if (a.createdOn > b.createdOn) {
                    return -1;
                } else {
                    return 0;
                }
            };

        if (sortDirection === 'newest') {
            return array.sort(newest);
        } else {
            return array.sort(oldest);
        }
    };

    NotebookController.prototype.show = function (container) {
        this.initializeVue(container);
    };

    NotebookController.prototype.destroy = function (container) {
        this.NotebookVue.$destroy(true);
    };

    return NotebookController;
});
