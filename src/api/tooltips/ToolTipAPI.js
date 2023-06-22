import Tooltip from './ToolTip';

/**
 * The TooltipAPI is responsible for pre-pending templates to
 * the body of the document, which is useful for displaying templates
 * which need to block the full screen.
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
   * @property {object} element DOMElement that is to be inserted/shown on the overlay
   * @property {string} size preferred size of the overlay (large, small, fit)
   * @property {array} buttons optional button objects with label and callback properties
   * @property {function} onDestroy callback to be called when overlay is destroyed
   * @property {boolean} dismissable allow user to dismiss overlay by using esc, and clicking away
   * from overlay. Unless set to false, all overlays will be dismissable by default.
   */
  tooltip(options) {
    let tooltip = new Tooltip(options);

    this.showTooltip(tooltip);

    return tooltip;
  }
}

export default TooltipAPI;
