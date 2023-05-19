define(['./Palette'], function (Palette) {
  //The colors that will be used to instantiate this palette if none are provided
  const DEFAULT_COLORS = [
    '#000000',
    '#434343',
    '#666666',
    '#999999',
    '#b7b7b7',
    '#cccccc',
    '#d9d9d9',
    '#efefef',
    '#f3f3f3',
    '#ffffff',
    '#980000',
    '#ff0000',
    '#ff9900',
    '#ffff00',
    '#00ff00',
    '#00ffff',
    '#4a86e8',
    '#0000ff',
    '#9900ff',
    '#ff00ff',
    '#e6b8af',
    '#f4cccc',
    '#fce5cd',
    '#fff2cc',
    '#d9ead3',
    '#d0e0e3',
    '#c9daf8',
    '#cfe2f3',
    '#d9d2e9',
    '#ead1dc',
    '#dd7e6b',
    '#dd7e6b',
    '#f9cb9c',
    '#ffe599',
    '#b6d7a8',
    '#a2c4c9',
    '#a4c2f4',
    '#9fc5e8',
    '#b4a7d6',
    '#d5a6bd',
    '#cc4125',
    '#e06666',
    '#f6b26b',
    '#ffd966',
    '#93c47d',
    '#76a5af',
    '#6d9eeb',
    '#6fa8dc',
    '#8e7cc3',
    '#c27ba0',
    '#a61c00',
    '#cc0000',
    '#e69138',
    '#f1c232',
    '#6aa84f',
    '#45818e',
    '#3c78d8',
    '#3d85c6',
    '#674ea7',
    '#a64d79',
    '#85200c',
    '#990000',
    '#b45f06',
    '#bf9000',
    '#38761d',
    '#134f5c',
    '#1155cc',
    '#0b5394',
    '#351c75',
    '#741b47',
    '#5b0f00',
    '#660000',
    '#783f04',
    '#7f6000',
    '#274e13',
    '#0c343d',
    '#1c4587',
    '#073763',
    '#20124d',
    '#4c1130'
  ];

  /**
   * Instantiates a new Open MCT Color Palette input
   * @constructor
   * @param {string} cssClass The class name of the icon which should be applied
   *                          to this palette
   * @param {Element} container The view that contains this palette
   * @param {string[]} colors (optional) A list of colors that should be used to instantiate this palette
   */
  function ColorPalette(cssClass, container, colors) {
    this.colors = colors || DEFAULT_COLORS;
    this.palette = new Palette(cssClass, container, this.colors);

    this.palette.setNullOption('rgba(0,0,0,0)');

    const domElement = this.palette.getDOM();
    const self = this;

    domElement.querySelector('.c-button--menu').classList.add('c-button--swatched');
    domElement.querySelector('.t-swatch').classList.add('color-swatch');
    domElement.querySelector('.c-palette').classList.add('c-palette--color');

    domElement.querySelectorAll('.c-palette__item').forEach((item) => {
      // eslint-disable-next-line no-invalid-this
      item.style.backgroundColor = item.dataset.item;
    });

    /**
     * Update this palette's current selection indicator with the style
     * of the currently selected item
     * @private
     */
    function updateSwatch() {
      const color = self.palette.getCurrent();
      domElement.querySelector('.color-swatch').style.backgroundColor = color;
    }

    this.palette.on('change', updateSwatch);

    return this.palette;
  }

  return ColorPalette;
});
