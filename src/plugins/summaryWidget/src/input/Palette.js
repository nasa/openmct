define([
    '../eventHelpers',
    '../../res/input/paletteTemplate.html',
    'EventEmitter',
    'zepto'
], function (
    eventHelpers,
    paletteTemplate,
    EventEmitter,
    $
) {
    /**
     * Instantiates a new Open MCT Color Palette input
     * @constructor
     * @param {string} cssClass The class name of the icon which should be applied
     *                          to this palette
     * @param {Element} container The view that contains this palette
     * @param {string[]} items A list of data items that will be associated with each
     *                         palette item in the view; how this data is represented is
     *                         up to the descendent class
     */
    function Palette(cssClass, container, items) {
        eventHelpers.extend(this);

        const self = this;

        this.cssClass = cssClass;
        this.items = items;
        this.container = container;

        this.domElement = $(paletteTemplate);
        this.itemElements = {
            nullOption: $('.c-palette__item-none .c-palette__item', this.domElement)
        };
        this.eventEmitter = new EventEmitter();
        this.supportedCallbacks = ['change'];
        this.value = this.items[0];
        this.nullOption = ' ';
        this.button = $('.js-button', this.domElement);
        this.menu = $('.c-menu', this.domElement);

        this.hideMenu = this.hideMenu.bind(this);

        self.button.addClass(this.cssClass);
        self.setNullOption(this.nullOption);

        self.items.forEach(function (item) {
            const itemElement = $('<div class = "c-palette__item ' + item + '"'
                                + ' data-item = ' + item + '></div>');
            $('.c-palette__items', self.domElement).append(itemElement);
            self.itemElements[item] = itemElement;
        });

        $('.c-menu', self.domElement).hide();

        this.listenTo($(document), 'click', this.hideMenu);
        this.listenTo($('.js-button', self.domElement), 'click', function (event) {
            event.stopPropagation();
            $('.c-menu', self.container).hide();
            $('.c-menu', self.domElement).show();
        });

        /**
         * Event handler for selection of an individual palette item. Sets the
         * currently selected element to be the one associated with that item's data
         * @param {Event} event the click event that initiated this callback
         * @private
         */
        function handleItemClick(event) {
            const elem = event.currentTarget;
            const item = elem.dataset.item;
            self.set(item);
            $('.c-menu', self.domElement).hide();
        }

        this.listenTo($('.c-palette__item', self.domElement), 'click', handleItemClick);
    }

    /**
     * Get the DOM element representing this palette in the view
     */
    Palette.prototype.getDOM = function () {
        return this.domElement;
    };

    /**
     * Clean up any event listeners registered to DOM elements external to the widget
     */
    Palette.prototype.destroy = function () {
        this.stopListening();
    };

    Palette.prototype.hideMenu = function () {
        $('.c-menu', this.domElement).hide();
    };

    /**
     * Register a callback with this palette: supported callback is change
     * @param {string} event The key for the event to listen to
     * @param {function} callback The function that this rule will envoke on this event
     * @param {Object} context A reference to a scope to use as the context for
     *                         context for the callback function
     */
    Palette.prototype.on = function (event, callback, context) {
        if (this.supportedCallbacks.includes(event)) {
            this.eventEmitter.on(event, callback, context || this);
        } else {
            throw new Error('Unsupported event type: ' + event);
        }
    };

    /**
     * Get the currently selected value of this palette
     * @return {string} The selected value
     */
    Palette.prototype.getCurrent = function () {
        return this.value;
    };

    /**
     * Set the selected value of this palette; if the item doesn't exist in the
     * palette's data model, the selected value will not change. Invokes any
     * change callbacks associated with this palette.
     * @param {string} item The key of the item to set as selected
     */
    Palette.prototype.set = function (item) {
        const self = this;
        if (this.items.includes(item) || item === this.nullOption) {
            this.value = item;
            if (item === this.nullOption) {
                this.updateSelected('nullOption');
            } else {
                this.updateSelected(item);
            }
        }

        this.eventEmitter.emit('change', self.value);
    };

    /**
     * Update the view assoicated with the currently selected item
     */
    Palette.prototype.updateSelected = function (item) {
        $('.c-palette__item', this.domElement).removeClass('is-selected');
        this.itemElements[item].addClass('is-selected');
        if (item === 'nullOption') {
            $('.t-swatch', this.domElement).addClass('no-selection');
        } else {
            $('.t-swatch', this.domElement).removeClass('no-selection');
        }
    };

    /**
     * set the property to be used for the 'no selection' item. If not set, this
     * defaults to a single space
     * @param {string} item The key to use as the 'no selection' item
     */
    Palette.prototype.setNullOption = function (item) {
        this.nullOption = item;
        this.itemElements.nullOption.data('item', item);
    };

    /**
     * Hides the 'no selection' option to be hidden in the view if it doesn't apply
     */
    Palette.prototype.toggleNullOption = function () {
        $('.c-palette__item-none', this.domElement).toggle();
    };

    return Palette;
});
