import EventEmitter from 'EventEmitter';

const LOCAL_STORAGE_KEY = 'mct-saved-styles';
const LIMIT = 20;

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

      if (this.persist(styles)) {
        this.emit('stylesUpdated', styles);
      }
    }
  }

  delete(index) {
    const styles = this.load();
    styles.splice(index, 1);

    if (this.persist(styles)) {
      this.emit('stylesUpdated', styles);
    }
  }

  select(style) {
    this.emit('styleSelected', style);
  }

  /**
   * @private
   */
  normalizeStyle(style) {
    const normalizedStyle = this.getBaseStyleObject();

    Object.keys(normalizedStyle).forEach((property) => {
      const value = style[property];
      if (value !== undefined) {
        normalizedStyle[property] = value;
      }
    });

    return normalizedStyle;
  }

  /**
   * @private
   */
  getBaseStyleObject() {
    return {
      backgroundColor: '',
      border: '',
      color: '',
      fontSize: 'default',
      font: 'default'
    };
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
    return styles.some((existingStyle) => this.isEqual(style, existingStyle));
  }

  /**
   * @private
   */
  persist(styles) {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(styles));

      return true;
    } catch (e) {
      this.emit('persistError');
    }

    return false;
  }

  /**
   * @private
   */
  isEqual(style1, style2) {
    const keys = Object.keys(Object.assign({}, style1, style2));
    const different = keys.some(
      (key) =>
        (!style1[key] && style2[key]) ||
        (style1[key] && !style2[key]) ||
        style1[key] !== style2[key]
    );

    return !different;
  }
}

const stylesManager = new StylesManager();
// breaks on adding listener later
// Object.freeze(stylesManager);

export default stylesManager;
