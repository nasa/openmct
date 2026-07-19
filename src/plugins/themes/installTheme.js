const dataAttribute = 'theme';

export function installTheme(openmct, themeName) {
  const currentTheme = document.querySelector(`link[data-${dataAttribute}]`);
  if (currentTheme) {
    currentTheme.remove();
  }

  const newTheme = document.createElement('link');
  newTheme.setAttribute('rel', 'stylesheet');

  // eslint-disable-next-line no-undef
  const href = `${openmct.getAssetPath()}${__OPENMCT_ROOT_RELATIVE__}${themeName}Theme.css`;
  newTheme.setAttribute('href', href);
  newTheme.dataset[dataAttribute] = themeName;

  document.head.appendChild(newTheme);
}
