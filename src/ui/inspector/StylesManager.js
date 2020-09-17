import EventEmitter from 'EventEmitter';

const LOCAL_STORAGE_KEY = 'mct-saved-styles';
const LIMIT = 100;
const STYLE_PROPERTIES = [
    'backgroundColor', 'border', 'color'
];

/**
 * @typedef {Object} Style
 * @property {*} property
 */
export default class StylesManager extends EventEmitter {
    constructor(openmct) {
        super();

        if (!StylesManager.instance) {
            StylesManager.instance = this;
        }

        this.openmct = openmct;

        // eslint-disable-next-line
        return StylesManager.instance;
    }

    load() {
        let styles = window.localStorage.getItem(LOCAL_STORAGE_KEY);
        styles = styles ? JSON.parse(styles) : [];

        return styles;
    }

    save(style) {
        const normalizedStyle = this.normalizeStyle(style);
        const styles = this.load();
        let allowSave;
        let persistSucceeded;

        allowSave = !this.isSaveLimitReached(styles);
        allowSave = !this.isExistingStyle(normalizedStyle, styles);

        if (allowSave) {
            styles.unshift(normalizedStyle);
            persistSucceeded = this.persist(styles);

            if (persistSucceeded) {
                this.emit('stylesUpdated', styles);
            }
        }
    }

    /**
     * @private
     */
    normalizeStyle(style) {
        const normalizedStyle = style;

        // strip border styling down to border color only
        style.border = style.border.substring(style.border.lastIndexOf('#'));

        return normalizedStyle;
    }

    /**
     * @private
     */
    isSaveLimitReached(styles) {
        if (styles.length >= LIMIT) {
            this.openmct.notifications.alert(
                `Saved styles limit (${LIMIT}) reached. Please delete a saved style and try again.`
            );

            return true;
        }

        return false;
    }

    /**
     * @private
     */
    isExistingStyle(style, styles) {
        const match = styles.findIndex(existingStyle => this.isEqual(style, existingStyle));

        if (match > -1) {
            this.openmct.notifications.alert(
                `This style is already saved at position ${match + 1}.`
            );

            return true;
        }

        return false;
    }

    /**
     * @private
     */
    persist(styles) {
        try {
            window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(styles));

            return true;
        } catch {
            this.openmct.notifications.error('Problem encountered saving styles.');
        }

        return false;
    }

    isEqual(style1, style2) {
        const keys = Object.keys(Object.assign({}, style1, style2));
        const different = keys.some(key => (style1[key] !== undefined && style2[key] === undefined)
            || (style1[key] === undefined && style2[key] !== undefined)
            || (style1[key] !== style2[key])
        );

        return !different;
    }

    select(style) {
        this.emit('styleSelected', style);
    }

    delete(style) {
        const styles = this.load();
        const remainingStyles = styles.filter(keep => !this.isEqual(keep, style));

        const persistSuccess = this.persist(remainingStyles);
        if (persistSuccess) {
            this.emit('stylesUpdated', remainingStyles);
        }
    }
}
