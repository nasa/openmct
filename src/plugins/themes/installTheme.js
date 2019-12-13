import snowTheme from '../../plugins/themes/snow-theme.scss';
import espressoTheme from '../../plugins/themes/espresso-theme.scss';
import maelstromTheme from '../../plugins/themes/maelstrom-theme.scss';

const themes = {
    snow: snowTheme,
    espresso: espressoTheme,
    maelstrom: maelstromTheme
}

const dataAttribute = 'theme';

export const installTheme = (openmct, themeName) => {
    // eslint-disable-next-line no-undef
    if (__OPENMCT_USE_STYLE_LOADER__) {
        themes[themeName].use();
    } else {
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
}
