import { installTheme } from './installTheme';

const THEME_LIST = [
    'espresso',
    'maelstrom',
    'snow'
];

export function getThemeItems(openmct) {
    return THEME_LIST.map(theme => {
        return {
            cssClass: '',
            name: theme,
            description: `${theme} Theme`,
            callBack: () => installTheme(openmct, theme)
        };
    });
}
