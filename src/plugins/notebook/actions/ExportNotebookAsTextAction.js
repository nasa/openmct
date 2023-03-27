import {saveAs} from 'saveAs';

export default class ExportNotebookAsTextAction {
    constructor(openmct) {
        this.openmct = openmct;

        this.cssClass = 'icon-export';
        this.description = 'Exports notebook contents as a text file';
        this.group = "action";
        this.key = 'exportNotebookAsText';
        this.name = 'Export Notebook as Text';
        this.priority = 1;
    }

    async invoke(objectPath, view) {
        const identifier = objectPath[0].identifier;
        const domainObject = await this.openmct.objects.get(identifier);
        console.debug('🧞‍♀️ ExportNotebookAsTextAction.invoke', domainObject);

        let notebookAsText = `# ${domainObject.name}\n\n`;

        const notebookSections = domainObject.configuration.sections;
        const notebookEntries = domainObject.configuration.entries;

        notebookSections.forEach(section => {
            notebookAsText += `## ${section.name}\n\n`;

            const notebookPages = section.pages;

            notebookPages.forEach(page => {
                notebookAsText += `### ${page.name}\n\n`;

                const notebookPageEntries = notebookEntries[section.id]?.[page.id];
                notebookPageEntries.forEach(entry => {
                    notebookAsText += `${entry.text}\n\n`;
                });
            });
        });

        const blob = new Blob([notebookAsText], {type: "text/markdown"});
        const fileName = domainObject.name + '.md';
        saveAs(blob, fileName);
    }

    appliesTo(objectPath) {
        const domainObject = objectPath[0];
        const type = this.openmct.types.get(domainObject.type);

        return type?.definition?.name === 'Notebook';
    }
}
