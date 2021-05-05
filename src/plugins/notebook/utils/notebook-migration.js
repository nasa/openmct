import { createNotebookImageDomainObject, getThumbnailURLFromimageUrl } from './notebook-image';
import { mutateObject } from './notebook-entries';

export function notebookImageMigration(openmct, domainObject) {
    const configuration = domainObject.configuration;
    const notebookEntries = configuration.entries;

    const imageMigrationVer = configuration.imageMigrationVer;
    if (imageMigrationVer && imageMigrationVer === 'v1') {
        return;
    }

    configuration.imageMigrationVer = 'v1';

    // to avoid muliple notebookImageMigration calls updating images.
    mutateObject(openmct, domainObject, 'configuration', configuration);

    configuration.sections.forEach(section => {
        const sectionId = section.id;
        section.pages.forEach(page => {
            const pageId = page.id;
            const pageEntries = notebookEntries[sectionId][pageId] || [];
            pageEntries.forEach(entry => {
                entry.embeds.forEach(async (embed) => {
                    const snapshot = embed.snapshot;
                    const fullSizeImageURL = snapshot.src;
                    if (fullSizeImageURL) {
                        const thumbnailImageURL = await getThumbnailURLFromimageUrl(fullSizeImageURL);
                        const notebookImageDomainObject = await createNotebookImageDomainObject(openmct, fullSizeImageURL, thumbnailImageURL);

                        embed.snapshot = {
                            fullSizeImageObjectIdentifier: notebookImageDomainObject.identifier,
                            thumbnailImage: { src: thumbnailImageURL || '' }
                        };

                        mutateObject(openmct, domainObject, 'configuration.entries', notebookEntries);
                    }
                });
            });
        });
    });
}
