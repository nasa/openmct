import { createNotebookImageDomainObject, getThumbnailURLFromimageUrl } from './notebook-image';
import { mutateObject } from './notebook-entries';

export function notebookImageMigration(openmct, identifier) {
    openmct.objects.get(identifier)
        .then(domainObject => {
            const configuration = domainObject.configuration;
            const notebookEntries = configuration.entries;

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
                                const object = await createNotebookImageDomainObject(openmct, fullSizeImageURL, thumbnailImageURL);

                                embed.snapshot = {
                                    fullSizeImageObjectIdentifier: object.identifier,
                                    thumbnailImage: { src: thumbnailImageURL || '' }
                                };

                                mutateObject(openmct, domainObject, 'configuration.entries', notebookEntries);
                            }
                        });
                    });
                });
            });
        });
}
