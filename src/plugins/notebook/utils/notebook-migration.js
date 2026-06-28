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
import { mutateObject } from './notebook-entries.js';
import {
  createNotebookImageDomainObject,
  getThumbnailURLFromImageUrl,
  saveNotebookImageDomainObject,
  updateNamespaceOfDomainObject
} from './notebook-image.js';

export const IMAGE_MIGRATION_VER = 'v1';

export function notebookImageMigration(openmct, domainObject) {
  const configuration = domainObject.configuration;
  const notebookEntries = configuration.entries;

  const imageMigrationVer = configuration.imageMigrationVer;
  if (imageMigrationVer && imageMigrationVer === IMAGE_MIGRATION_VER) {
    return;
  }

  configuration.imageMigrationVer = IMAGE_MIGRATION_VER;

  // to avoid muliple notebookImageMigration calls updating images.
  mutateObject(openmct, domainObject, 'configuration', configuration);

  configuration.sections.forEach((section) => {
    const sectionId = section.id;
    section.pages.forEach((page) => {
      const pageId = page.id;
      const notebookSection = (notebookEntries && notebookEntries[sectionId]) || {};
      const pageEntries = (notebookSection && notebookSection[pageId]) || [];
      pageEntries.forEach((entry) => {
        entry.embeds.forEach(async (embed) => {
          const snapshot = embed.snapshot;
          const fullSizeImageURL = snapshot.src;
          if (fullSizeImageURL) {
            const thumbnailImageURL = await getThumbnailURLFromImageUrl(fullSizeImageURL);
            const object = createNotebookImageDomainObject(fullSizeImageURL);
            const notebookImageDomainObject = updateNamespaceOfDomainObject(
              object,
              domainObject.identifier.namespace
            );
            embed.snapshot = {
              fullSizeImageObjectIdentifier: notebookImageDomainObject.identifier,
              thumbnailImage: { src: thumbnailImageURL || '' }
            };

            mutateObject(openmct, domainObject, 'configuration.entries', notebookEntries);

            saveNotebookImageDomainObject(openmct, notebookImageDomainObject);
          }
        });
      });
    });
  });
}
