import Tooltip from './ToolTip';

/**
 * The TooltipAPI is responsible for adding custom tooltips to
 * the desired elements on the screen
 *
 * @memberof api/tooltips
 * @constructor
 */

class TooltipAPI {
  constructor() {
    this.activeToolTips = [];
  }

  /**
   * private
   */
  showTooltip(tooltip) {
    for (let i = this.activeToolTips.length - 1; i > -1; i--) {
      this.activeToolTips[i].destroy();
      this.activeToolTips.splice(i, 1);
    }
    this.activeToolTips.push(tooltip);

    tooltip.show();
  }

  /**
   * A description of option properties that can be passed into the overlay
   * @typedef options
   * @property {string} tooltipText text to show in the tooltip
   * @property {string} tooltipLocation location to show the tooltip relative to the parentElement
   *  (above, below, right, left, center)
   * @property {HTMLElement} parentElement reference to the DOM node we're adding the tooltip to
   */
  tooltip(options) {
    let tooltip = new Tooltip(options);

    this.showTooltip(tooltip);

    return tooltip;
  }
}

export default TooltipAPI;
