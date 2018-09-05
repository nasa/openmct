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
     'moment',
     './EntryController',
     '../utils/SnapshotOverlay',
     'text!../../res/templates/notebook.html',
     'text!../../res/templates/entry.html',
     'text!../../res/templates/embed.html'
    ], 
    function (
     Vue,
     Moment,
     EntryController,
     SnapshotOverlay,
     NotebookTemplate,
     EntryTemplate,
     EmbedTemplate
    ) {

    function NotebookController(openmct, domainObject) {
        this.openmct = openmct;
        this.domainObject = domainObject;
        this.entrySearch = '';
        this.dialogService = this.openmct.$injector.get('dialogService');
        this.dndService = this.openmct.$injector.get('dndService');
        this.objectService = this.openmct.$injector.get('objectService');
        this.navigationService = this.openmct.$injector.get('navigationService');

        this.show = this.show.bind(this);
        this.destroy = this.destroy.bind(this);
        this.newEntry = this.newEntry.bind(this);
        this.entryPosById = this.entryPosById.bind(this);
        this.navigate = this.navigate.bind(this);
    }

    NotebookController.prototype.initializeVue = function (container){
        var self = this,
            entryController = new EntryController(this.openmct, this.domainObject);

        this.container = container;

        var notebookEmbed = {
            props:['embed'],
            template: EmbedTemplate,
            methods: {
                navigate: self.navigate,
                openSnapshot: self.openSnapshot,
                formatTime: self.formatTime
            }
        };

        var entryComponent = {
            props:['entry'],
            template: EntryTemplate,
            components: {
                'notebook-embed': notebookEmbed
            },
            data: entryController.exposedData,
            methods: entryController.exposedMethods()
        };

        var notebookVue = Vue.extend({
            template: NotebookTemplate,
            components: {
                'notebook-entry': entryComponent
            },
            data: function () {
                return {
                    entrySearch: self.entrySearch,
                    showTime: '0',
                    sortEntries: '-createdOn',
                    entries: self.domainObject.entries,
                    currentEntryValue: ''
                };
            },
            methods: {
                search: function (event) {
                    if (event.target.value) {
                        this.entrySearch = event.target.value;
                    }
                },
                newEntry: self.newEntry,
                filterBySearch: self.filterBySearch
            }
        });

        this.NotebookVue =  new notebookVue();
        this.NotebookVue.$mount(container);
    };

    NotebookController.prototype.newEntry = function (event) {
        
        var entries = this.domainObject.entries,
            lastEntryIndex = entries.length - 1,
            lastEntry = entries[lastEntryIndex],
            date = Date.now();

        if (lastEntry === undefined || lastEntry.text || lastEntry.embeds.length) {
            var createdEntry = {'id': 'entry-' + date, 'createdOn': date, 'embeds':[]};
            
            entries.push(createdEntry);
            this.openmct.objects.mutate(this.domainObject, 'entries', entries);
        } else {
            lastEntry.createdOn = date;

            this.openmct.objects.mutate(this.domainObject, 'entries[entries.length-1]', lastEntry);
            this.focusOnEntry.bind(this.NotebookVue.$children[lastEntryIndex])();
        }

        this.entrySearch = '';
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

    NotebookController.prototype.formatTime = function (unixTime, timeFormat) {
        return Moment(unixTime).format(timeFormat);
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

    NotebookController.prototype.navigate = function (embedType) {
        this.objectService.getObjects([embedType]).then(function (objects) {
            this.navigationService.setNavigation(objects[embedType]);   
        }.bind(this));
    };

    NotebookController.prototype.openSnapshot = function () {
        if (!this.snapshotOverlay) {
            this.snapShotOverlay = new SnapshotOverlay(this.embed);
        } else {
            this.snapShotOverlay = undefined;
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