import EventEmitter from 'EventEmitter';

const LOCAL_STORAGE_KEY = 'mct-saved-styles';
const LIMIT = 100;
const PERSIST_ERROR_MESSAGE = 'Problem encountered saving styles.';
const LIMIT_WARNING_MESSAGE = `Saved styles limit (${LIMIT}) reached. Please delete a saved style and try again.`;
const STYLE_PROPERTIES = [
    'backgroundColor', 'border', 'color', 'isStyleInvisible'
];
const DEFAULT_STYLE = {
    backgroundColor: '',
    border: '',
    color: ''
};

/**
 * @typedef {Object} Style
 * @property {*} property
 */
export default class StylesManager extends EventEmitter {
    constructor(openmct) {
        super();

        this.openmct = openmct;
    }

    load() {
        const rawStyles = window.localStorage.getItem(LOCAL_STORAGE_KEY);
        const styles = rawStyles ? JSON.parse(rawStyles) : [DEFAULT_STYLE];

        return styles;
    }

    save(style) {
        const styles = this.load();
        let persistSucceeded;

        if (styles.length < LIMIT) {
            // latest saved styles go to front of store (except default always first)
            styles.splice(1, 0, style);
            persistSucceeded = this.persist(styles);
        } else {
            this.openmct.notifications.warning(LIMIT_WARNING_MESSAGE);
        }

        if (persistSucceeded) {
            this.emit('stylesUpdated', styles);
        }
    }

    /**
     * @param {Array<Style>} styles saved styles for this browser
     * @private
     */
    persist(styles) {
        try {
            window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(styles));

            return true;
        } catch {
            this.openmct.notifications.error(PERSIST_ERROR_MESSAGE);
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

    isDefaultStyle(style) {
        return this.isEqual(style, DEFAULT_STYLE);
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
