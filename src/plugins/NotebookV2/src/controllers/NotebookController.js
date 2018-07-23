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
     'text!../../res/templates/entry.html'
 ], function (
     Vue,
     moment,
     NotebookView,
     NotebookEntry
    ) {

    function NotebookController(openmct, domainObject) {
        this.openmct = openmct;
        this.domainObject = domainObject;
        this.entrySearch = '';

        this.show = this.show.bind(this);
        this.newEntry = this.newEntry.bind(this);
        this.textFocus = this.textFocus.bind(this);
        this.textBlur = this.textBlur.bind(this);
        this.entryPosById = this.entryPosById.bind(this);
        this.deleteEntry = this.deleteEntry.bind(this);
    }

    NotebookController.prototype.initializeVue = function (container){
        var self = this;
        
        Vue.component('notebook-entry', {
            props:['entry'],
            template: NotebookEntry,
            methods: {
                textFocus: self.textFocus,
                textBlur: self.textBlur,
                formatTime: self.formatTime,
                triggerDelete: self.triggerDelete
            },
            mounted: self.focusOnEntry
        });

        var notebookVue = Vue.extend({
            template: NotebookView,
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
            lastEntry = entries[entries.length - 1],
            date = Date.now();
        
        if (lastEntry === undefined || lastEntry.text || lastEntry.embeds) {
            var createdEntry = {'id': 'entry-' + date, 'createdOn': date};
            
            entries.push(createdEntry);
            this.openmct.objects.mutate(this.domainObject, 'entries', entries);
        } else {
            // var lastElement = this.NotebookVue.$refs[lastEntry.id][0];
            // lastElement.focus();

            lastEntry.createdOn = date;

            this.openmct.objects.mutate(this.domainObject, 'entries[entries.length-1]', lastEntry);
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
                console.log(this.domainObject.entries[entryPos]);
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
            this.$el.querySelector("[contenteditable='true']").focus();
        }
    };

    NotebookController.prototype.triggerDelete = function () {
        this.$emit('delete-entry', this.entry.id);
    };

    NotebookController.prototype.deleteEntry = function (entryId) {
        var entryPos = this.entryPosById(entryId);

        if (entryPos !== -1) {
            this.domainObject.entries.splice(entryPos, 1);
            this.openmct.objects.mutate(this.domainObject, 'entries', this.domainObject.entries);
            console.log(this.domainObject);
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