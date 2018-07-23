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
     'text!../../res/templates/notebook.html',
     'text!../../res/templates/entry.html',
     'text!../../res/templates/embed.html'
 ], function (
     Vue,
     moment,
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
        this.textFocus = this.textFocus.bind(this);
        this.textBlur = this.textBlur.bind(this);
        this.entryPosById = this.entryPosById.bind(this);
        this.deleteEntry = this.deleteEntry.bind(this);
        this.dropOnEntry = this.dropOnEntry.bind(this);
        this.navigate = this.navigate.bind(this);
    }

    NotebookController.prototype.initializeVue = function (container){
        var self = this;
        
        var notebookEmbed = {
            props:['embed'],
            template: EmbedTemplate,
            methods: {
                navigate: self.navigate
            }
        };

        var entryComponent = {
            props:['entry'],
            template: EntryTemplate,
            components: {
                'notebook-embed': notebookEmbed
            },
            methods: {
                textFocus: self.textFocus,
                textBlur: self.textBlur,
                formatTime: self.formatTime,
                triggerDelete: self.triggerDelete,
                dropOnEntry: self.dropOnEntry,
                dragoverOnEntry: self.dragoverOnEntry
            },
            mounted: self.focusOnEntry
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
                    console.log(this.entrySearch);
                },
                newEntry: self.newEntry,
                formatTime: self.formatTime,
                deleteEntry: self.deleteEntry
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

    NotebookController.prototype.textFocus = function ($event) {
        if ($event.target) {
            this.NotebookVue.currentEntryValue = $event.target.innerText;
        } else {
            $event.target.innerText = '';
        }
    };

    NotebookController.prototype.textBlur = function ($event, entryId) {
        if ($event.target) {
            var entryPos = this.entryPosById(entryId);
            
            if (this.NotebookVue.currentEntryValue !== $event.target.innerText) {
                this.openmct.objects.mutate(this.domainObject, 'entries[' + entryPos + '].text', $event.target.innerText);
            }
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

    NotebookController.prototype.formatTime = function (unixTime, timeFormat) {
        return moment(unixTime).format(timeFormat);
    };

    NotebookController.prototype.focusOnEntry = function () {
        if (!this.entry.text) {
            this.$refs.contenteditable.focus();
        }
    };

    NotebookController.prototype.triggerDelete = function () {
        this.$emit('delete-entry', this.entry.id);
    };

    NotebookController.prototype.deleteEntry = function (entryId) {
        var entryPos = this.entryPosById(entryId),
            domainObject = this.domainObject,
            openmct = this.openmct;

        if (entryPos !== -1) {

            var errorDialog = this.dialogService.showBlockingMessage({
                severity: "error",
                title: "This action will permanently delete this Notebook entry. Do you wish to continue?",
                options: [{
                    label: "OK",
                    callback: function () {
                        domainObject.entries.splice(entryPos, 1);
                        openmct.objects.mutate(domainObject, 'entries', domainObject.entries);

                        errorDialog.dismiss();
                    }
                },{
                    label: "Cancel",
                    callback: function () {
                        errorDialog.dismiss();
                    }
                }]
            });
        }
    };

    NotebookController.prototype.dropOnEntry = function (entryId) {
        var selectedObject = this.dndService.getData('mct-domain-object'),
            selectedObjectId = selectedObject.getId(),
            selectedModel = selectedObject.getModel(),
            cssClass = selectedObject.getCapability('type').typeDef.cssClass,
            entryPos = this.entryPosById(entryId),
            currentEntryEmbeds = this.domainObject.entries[entryPos].embeds,
            newEmbed = {
                type: selectedObjectId,
                id: '' + Date.now(),
                cssClass: cssClass,
                name: selectedModel.name,
                snapshot: ''
            };
        
        currentEntryEmbeds.push(newEmbed);
        this.openmct.objects.mutate(this.domainObject, 'entries[' + entryPos + '].embeds', currentEntryEmbeds);

        console.log(currentEntryEmbeds);
    };

    NotebookController.prototype.dragoverOnEntry = function (dragoverEvent) {
      
    };

    NotebookController.prototype.navigate = function (embedType) {
        this.objectService.getObjects([embedType]).then(function (objects) {
            this.navigationService.setNavigation(objects[embedType]);   
        }.bind(this));
    };

    NotebookController.prototype.show = function (container) {
        this.initializeVue(container);
    };

    NotebookController.prototype.destroy = function (container) {
        this.NotebookVue.$destroy(true);
    };

    return NotebookController;
 });