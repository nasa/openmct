import EventEmitter from 'EventEmitter';

const LOCAL_STORAGE_KEY = 'mct-saved-styles';
const LIMIT = 20;
const STYLE_PROPERTIES = [
    'backgroundColor', 'border', 'color'
];

/**
 * @typedef {Object} Style
 * @property {*} property
 */
class StylesManager extends EventEmitter {
    load() {
        let styles = window.localStorage.getItem(LOCAL_STORAGE_KEY);
        styles = styles ? JSON.parse(styles) : [];

        return styles;
    }

    save(style) {
        const normalizedStyle = this.normalizeStyle(style);
        const styles = this.load();

        if (!this.isSaveLimitReached(styles)) {
            styles.unshift(normalizedStyle);
            const persistSucceeded = this.persist(styles);

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
            this.emit('limitReached');

            return true;
        }

        return false;
    }

    /**
     * @private
     */
    isExistingStyle(style, styles) {
        return styles.some(existingStyle => this.isEqual(style, existingStyle));
    }

    /**
     * @private
     */
    persist(styles) {
        try {
            window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(styles));

            return true;
        } catch {
            this.emit('persistError');
        }

        return false;
    }

    isEqual(style1, style2) {
        const keys = Object.keys(Object.assign({}, style1, style2));
        const different = keys.some(key => (!style1[key] && style2[key])
            || (style1[key] && !style2[key])
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

const stylesManager = new StylesManager();
// breaks on adding listener later
// Object.freeze(stylesManager);

export default stylesManager;
