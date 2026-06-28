/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2024, United States Government
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
import { saveAs } from 'file-saver';
import Moment from 'moment';

import { NOTEBOOK_TYPE, RESTRICTED_NOTEBOOK_TYPE } from '../notebook-constants.js';
const UNKNOWN_USER = 'Unknown';
const UNKNOWN_TIME = 'Unknown';
const ALLOWED_TYPES = [NOTEBOOK_TYPE, RESTRICTED_NOTEBOOK_TYPE];
const EXPORT_NOTEBOOK_AS_TEXT_ACTION_KEY = 'exportNotebookAsText';

class ExportNotebookAsTextAction {
  constructor(openmct) {
    this.openmct = openmct;

    this.cssClass = 'icon-export';
    this.description = 'Exports notebook contents as a text file';
    this.group = 'export';
    this.key = EXPORT_NOTEBOOK_AS_TEXT_ACTION_KEY;
    this.name = 'Export Notebook as Text';
  }

  invoke(objectPath) {
    this.showForm(objectPath);
  }

  getTagName(tagId, availableTags) {
    const foundTag = availableTags.find((tag) => tag.id === tagId);
    if (foundTag) {
      return foundTag.label;
    } else {
      return tagId;
    }
  }

  getTagsForEntry(entry, domainObjectKeyString, annotations) {
    const foundTags = [];
    annotations.forEach((annotation) => {
      const target = annotation.targets.find(
        (annotationTarget) => annotationTarget.keyString === domainObjectKeyString
      );
      if (target?.entryId === entry.id) {
        annotation.tags.forEach((tag) => {
          if (!foundTags.includes(tag)) {
            foundTags.push(tag);
          }
        });
      }
    });

    return foundTags;
  }

  formatTimeStamp(timestamp) {
    if (timestamp) {
      return `${Moment.utc(timestamp).format('YYYY-MM-DD HH:mm:ss')} UTC`;
    } else {
      return UNKNOWN_TIME;
    }
  }

  appliesTo(objectPath) {
    const domainObject = objectPath[0];

    return ALLOWED_TYPES.includes(domainObject.type);
  }

  async onSave(changes, objectPath) {
    const availableTags = this.openmct.annotation.getAvailableTags();
    const identifier = objectPath[0].identifier;
    const domainObject = await this.openmct.objects.get(identifier);
    let foundAnnotations = [];
    // only load annotations if there are tags
    if (availableTags.length) {
      foundAnnotations = await this.openmct.annotation.getAnnotations(domainObject.identifier);
    }

    let notebookAsText = `# ${domainObject.name}\n\n`;

    if (changes.exportMetaData) {
      const createdTimestamp = domainObject.created;
      const createdBy = this.getUserName(domainObject.createdBy);
      const modifiedBy = this.getUserName(domainObject.modifiedBy);
      const modifiedTimestamp = domainObject.modified ?? domainObject.created;
      notebookAsText += `Created on ${this.formatTimeStamp(
        createdTimestamp
      )} by user ${createdBy}\n\n`;
      notebookAsText += `Updated on ${this.formatTimeStamp(
        modifiedTimestamp
      )} by user ${modifiedBy}\n\n`;
    }

    const notebookSections = domainObject.configuration.sections;
    const notebookEntries = domainObject.configuration.entries;

    notebookSections.forEach((section) => {
      notebookAsText += `## ${section.name}\n\n`;

      const notebookPages = section.pages;

      notebookPages.forEach((page) => {
        notebookAsText += `### ${page.name}\n\n`;

        const notebookPageEntries = notebookEntries[section.id]?.[page.id];
        if (!notebookPageEntries) {
          // blank page
          return;
        }

        notebookPageEntries.forEach((entry) => {
          if (changes.exportMetaData) {
            const createdTimestamp = entry.createdOn;
            const createdBy = this.getUserName(entry.createdBy);
            const createdByRole = entry.createdByRole;
            const modifiedBy = this.getUserName(entry.modifiedBy);
            const modifiedByRole = entry.modifiedByRole;
            const modifiedTimestamp = entry.modified ?? entry.created;
            notebookAsText += `Created on ${this.formatTimeStamp(
              createdTimestamp
            )} by user ${createdBy}${createdByRole ? `: ${createdByRole}` : ''}\n\n`;
            notebookAsText += `Updated on ${this.formatTimeStamp(
              modifiedTimestamp
            )} by user ${modifiedBy}${modifiedByRole ? `: ${modifiedByRole}` : ''}\n\n`;
          }

          if (changes.exportTags) {
            const domainObjectKeyString = this.openmct.objects.makeKeyString(
              domainObject.identifier
            );
            const tags = this.getTagsForEntry(entry, domainObjectKeyString, foundAnnotations);
            const tagNames = tags.map((tag) => this.getTagName(tag, availableTags));
            if (tagNames) {
              notebookAsText += `Tags: ${tagNames.join(', ')}\n\n`;
            }
          }

          notebookAsText += `${entry.text}\n\n`;
        });
      });
    });

    const blob = new Blob([notebookAsText], { type: 'text/markdown' });
    const fileName = domainObject.name + '.md';
    saveAs(blob, fileName);
  }

  getUserName(userId) {
    if (userId && userId.length) {
      return userId;
    }

    return UNKNOWN_USER;
  }

  async showForm(objectPath) {
    const formStructure = {
      title: 'Export Notebook Text',
      sections: [
        {
          rows: [
            {
              key: 'exportMetaData',
              control: 'toggleSwitch',
              name: 'Include Metadata (created/modified, etc.)',
              required: true,
              value: false
            },
            {
              name: 'Include Tags',
              control: 'toggleSwitch',
              required: true,
              key: 'exportTags',
              value: false
            }
          ]
        }
      ]
    };

    const changes = await this.openmct.forms.showForm(formStructure);

    return this.onSave(changes, objectPath);
  }
}

export { EXPORT_NOTEBOOK_AS_TEXT_ACTION_KEY };

export default ExportNotebookAsTextAction;
