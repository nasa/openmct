import { getDefaultNotebook, getNotebookSectionAndPage } from './notebook-storage';

export async function getMenuItems(openmct, menuItemOptions) {
  const notebookTypes = [];

  const defaultNotebook = getDefaultNotebook();
  const defaultNotebookObject =
    defaultNotebook && (await openmct.objects.get(defaultNotebook.identifier));
  if (defaultNotebookObject) {
    const { section, page } = getNotebookSectionAndPage(
      defaultNotebookObject,
      defaultNotebook.defaultSectionId,
      defaultNotebook.defaultPageId
    );
    if (section && page) {
      const name = defaultNotebookObject.name;
      const sectionName = section.name;
      const pageName = page.name;
      const defaultPath = `${name} - ${sectionName} - ${pageName}`;

      notebookTypes.push({
        cssClass: menuItemOptions.default.cssClass,
        name: `${menuItemOptions.default.name} ${defaultPath}`,
        onItemClicked: menuItemOptions.default.onItemClicked
      });
    }
  }

  notebookTypes.push({
    cssClass: menuItemOptions.snapshot.cssClass,
    name: menuItemOptions.snapshot.name,
    onItemClicked: menuItemOptions.snapshot.onItemClicked
  });

  return notebookTypes;
}
