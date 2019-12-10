const dataAttribute = 'theme';

export const installTheme = (themeName) => {
    const currentTheme = document.querySelector(`link[data-${dataAttribute}]`);
    console.log(currentTheme)
    if (currentTheme) {
        currentTheme.remove();
    }

    const newTheme = document.createElement('link');
    newTheme.setAttribute('rel', 'stylesheet');
    newTheme.setAttribute('href', `${__OPENMCT_ROOT_RELATIVE__}${themeName}Theme.css`);
    newTheme.dataset[dataAttribute] = '';

    document.head.appendChild(newTheme);
}
