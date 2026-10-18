import ImageExporter from './ImageExporter.js';

const EXPORT_CLASS_NAME = 'export-plot';

function getExportFilename(domainObject, filenameSuffix, filename) {
  return filename ?? `${domainObject?.name ?? 'Open MCT View'} - ${filenameSuffix}`;
}

export function getImageExportViewContext(openmct, element, domainObject, filenameSuffix) {
  return {
    exportJPG(filename) {
      const imageExporter = new ImageExporter(openmct);
      const exportFilename = getExportFilename(domainObject, filenameSuffix, filename);

      return imageExporter.exportJPG(element, exportFilename, EXPORT_CLASS_NAME);
    },
    exportPNG(filename) {
      const imageExporter = new ImageExporter(openmct);
      const exportFilename = getExportFilename(domainObject, filenameSuffix, filename);

      return imageExporter.exportPNG(element, exportFilename, EXPORT_CLASS_NAME);
    }
  };
}
