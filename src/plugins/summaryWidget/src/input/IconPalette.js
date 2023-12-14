define(['./Palette'], function (Palette) {
  //The icons that will be used to instantiate this palette if none are provided
  const DEFAULT_ICONS = [
    'icon-alert-rect',
    'icon-alert-triangle',
    'icon-arrow-down',
    'icon-arrow-left',
    'icon-arrow-right',
    'icon-arrow-double-up',
    'icon-arrow-tall-up',
    'icon-arrow-tall-down',
    'icon-arrow-double-down',
    'icon-arrow-up',
    'icon-asterisk',
    'icon-bell',
    'icon-check',
    'icon-eye-open',
    'icon-gear',
    'icon-hourglass',
    'icon-info',
    'icon-link',
    'icon-lock',
    'icon-people',
    'icon-person',
    'icon-plus',
    'icon-trash',
    'icon-x'
  ];

  /**
   * Instantiates a new Open MCT Icon Palette input
   * @constructor
   * @param {string} cssClass The class name of the icon which should be applied
   *                          to this palette
   * @param {Element} container The view that contains this palette
   * @param {string[]} icons (optional) A list of icons that should be used to instantiate this palette
   */
  function IconPalette(cssClass, container, icons) {
    this.icons = icons || DEFAULT_ICONS;
    this.palette = new Palette(cssClass, container, this.icons);

    this.palette.setNullOption('');
    this.oldIcon = this.palette.current || '';

    const domElement = this.palette.getDOM();
    const self = this;

    domElement.querySelector('.c-button--menu').classList.add('c-button--swatched');
    domElement.querySelector('.t-swatch').classList.add('icon-swatch');
    domElement.querySelector('.c-palette').classList.add('c-palette--icon');

    domElement.querySelectorAll('.c-palette-item').forEach((item) => {
      // eslint-disable-next-line no-invalid-this
      item.classList.add(item.dataset.item);
    });

    /**
     * Update this palette's current selection indicator with the style
     * of the currently selected item
     * @private
     */
    function updateSwatch() {
      if (self.oldIcon) {
        domElement.querySelector('.icon-swatch').classList.remove(self.oldIcon);
      }

      domElement.querySelector('.icon-swatch').classList.add(self.palette.getCurrent());
      self.oldIcon = self.palette.getCurrent();
    }

    this.palette.on('change', updateSwatch);

    return this.palette;
  }

  return IconPalette;
});
