define([
  '../res/ruleImageTemplate.html',
  'EventEmitter',
  '../../../utils/template/templateHelpers'
], function (ruleImageTemplate, EventEmitter, templateHelpers) {
  /**
   * Manages the Sortable List interface for reordering rules by drag and drop
   * @param {Element} container The DOM element that contains this Summary Widget's view
   * @param {string[]} ruleOrder An array of rule IDs representing the current rule order
   * @param {Object} rulesById An object mapping rule IDs to rule configurations
   */
  function WidgetDnD(container, ruleOrder, rulesById) {
    this.container = container;
    this.ruleOrder = ruleOrder;
    this.rulesById = rulesById;

    this.imageContainer = templateHelpers.convertTemplateToHTML(ruleImageTemplate)[0];
    this.image = this.imageContainer.querySelector('.t-drag-rule-image');
    this.draggingId = '';
    this.draggingRulePrevious = '';
    this.eventEmitter = new EventEmitter();
    this.supportedCallbacks = ['drop'];

    this.drag = this.drag.bind(this);
    this.drop = this.drop.bind(this);

    this.container.addEventListener('mousemove', this.drag);
    document.addEventListener('mouseup', this.drop);
    this.container.parentNode.insertBefore(this.imageContainer, this.container);
    this.imageContainer.style.display = 'none';
  }

  /**
   * Remove event listeners registered to elements external to the widget
   */
  WidgetDnD.prototype.destroy = function () {
    this.container.removeEventListener('mousemove', this.drag);
    document.removeEventListener('mouseup', this.drop);
  };

  /**
   * Register a callback with this WidgetDnD: supported callback is drop
   * @param {string} event The key for the event to listen to
   * @param {function} callback The function that this rule will envoke on this event
   * @param {Object} context A reference to a scope to use as the context for
   *                         context for the callback function
   */
  WidgetDnD.prototype.on = function (event, callback, context) {
    if (this.supportedCallbacks.includes(event)) {
      this.eventEmitter.on(event, callback, context || this);
    }
  };

  /**
   * Sets the image for the dragged element to the given DOM element
   * @param {Element} image The HTML element to set as the drap image
   */
  WidgetDnD.prototype.setDragImage = function (image) {
    this.image.html(image);
  };

  /**
     * Calculate where this rule has been dragged relative to the other rules
     * @param {Event} event The mousemove or mouseup event that triggered this
                            event handler
     * @return {string} The ID of the rule whose drag indicator should be displayed
     */
  WidgetDnD.prototype.getDropLocation = function (event) {
    const ruleOrder = this.ruleOrder;
    const rulesById = this.rulesById;
    const draggingId = this.draggingId;
    let offset;
    let y;
    let height;
    const dropY = event.pageY;
    let target = '';

    ruleOrder.forEach(function (ruleId, index) {
      const ruleDOM = rulesById[ruleId].getDOM();
      offset = window.innerWidth - (ruleDOM.offsetLeft + ruleDOM.offsetWidth);
      y = offset.top;
      height = offset.height;
      if (index === 0) {
        if (dropY < y + (7 * height) / 3) {
          target = ruleId;
        }
      } else if (index === ruleOrder.length - 1 && ruleId !== draggingId) {
        if (y + height / 3 < dropY) {
          target = ruleId;
        }
      } else {
        if (y + height / 3 < dropY && dropY < y + (7 * height) / 3) {
          target = ruleId;
        }
      }
    });

    return target;
  };

  /**
   * Called by a {Rule} instance that initiates a drag gesture
   * @param {string} ruleId The identifier of the rule which is being dragged
   */
  WidgetDnD.prototype.dragStart = function (ruleId) {
    const ruleOrder = this.ruleOrder;
    this.draggingId = ruleId;
    this.draggingRulePrevious = ruleOrder[ruleOrder.indexOf(ruleId) - 1];
    this.rulesById[this.draggingRulePrevious].showDragIndicator();
    this.imageContainer.show();
    this.imageContainer.offset({
      top: event.pageY - this.image.height() / 2,
      left: event.pageX - this.image.querySelector('.t-grippy').style.width
    });
  };

  /**
   * An event handler for a mousemove event, once a rule has begun a drag gesture
   * @param {Event} event The mousemove event that triggered this callback
   */
  WidgetDnD.prototype.drag = function (event) {
    let dragTarget;
    if (this.draggingId && this.draggingId !== '') {
      event.preventDefault();
      dragTarget = this.getDropLocation(event);
      this.imageContainer.offset({
        top: event.pageY - this.image.height() / 2,
        left: event.pageX - this.image.querySelector('.t-grippy').style.width
      });
      if (this.rulesById[dragTarget]) {
        this.rulesById[dragTarget].showDragIndicator();
      } else {
        this.rulesById[this.draggingRulePrevious].showDragIndicator();
      }
    }
  };

  /**
   * Handles the mouseup event that corresponds to the user dropping the rule
   * in its final location. Invokes any registered drop callbacks with the dragged
   * rule's ID and the ID of the target rule that the dragged rule should be
   * inserted after
   * @param {Event} event The mouseup event that triggered this callback
   */
  WidgetDnD.prototype.drop = function (event) {
    let dropTarget = this.getDropLocation(event);
    const draggingId = this.draggingId;

    if (this.draggingId && this.draggingId !== '') {
      if (!this.rulesById[dropTarget]) {
        dropTarget = this.draggingId;
      }

      this.eventEmitter.emit('drop', {
        draggingId: draggingId,
        dropTarget: dropTarget
      });
      this.draggingId = '';
      this.draggingRulePrevious = '';
      this.imageContainer.hide();
    }
  };

  return WidgetDnD;
});
