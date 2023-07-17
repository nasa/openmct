import { MENU_PLACEMENT } from '../menu';
export default {
  methods: {
    /**
     * @private
     */
    _calculatePopupPosition(menuElement) {
      let menuDimensions = menuElement.getBoundingClientRect();

      if (!this.options.placement) {
        this.options.placement = MENU_PLACEMENT.BOTTOM_RIGHT;
      }

      const menuPosition = this._getMenuPositionBasedOnPlacement(menuDimensions);

      return this._preventMenuOverflow(menuPosition, menuDimensions);
    },
    /**
     * @private
     */
    _getMenuPositionBasedOnPlacement(menuDimensions) {
      let eventPosX = this.options.x;
      let eventPosY = this.options.y;

      // Adjust popup menu based on placement
      switch (this.options.placement) {
        case MENU_PLACEMENT.TOP:
          eventPosX = this.options.x - Math.floor(menuDimensions.width / 2);
          eventPosY = this.options.y - menuDimensions.height;
          break;
        case MENU_PLACEMENT.BOTTOM:
          eventPosX = this.options.x - Math.floor(menuDimensions.width / 2);
          break;
        case MENU_PLACEMENT.LEFT:
          eventPosX = this.options.x - menuDimensions.width;
          eventPosY = this.options.y - Math.floor(menuDimensions.height / 2);
          break;
        case MENU_PLACEMENT.RIGHT:
          eventPosY = this.options.y - Math.floor(menuDimensions.height / 2);
          break;
        case MENU_PLACEMENT.TOP_LEFT:
          eventPosX = this.options.x - menuDimensions.width;
          eventPosY = this.options.y - menuDimensions.height;
          break;
        case MENU_PLACEMENT.TOP_RIGHT:
          eventPosY = this.options.y - menuDimensions.height;
          break;
        case MENU_PLACEMENT.BOTTOM_LEFT:
          eventPosX = this.options.x - menuDimensions.width;
          break;
        case MENU_PLACEMENT.BOTTOM_RIGHT:
          break;
      }

      return {
        x: eventPosX,
        y: eventPosY
      };
    },
    /**
     * @private
     */
    _preventMenuOverflow(menuPosition, menuDimensions) {
      let { x: eventPosX, y: eventPosY } = menuPosition;
      let overflowX = eventPosX + menuDimensions.width - document.body.clientWidth;
      let overflowY = eventPosY + menuDimensions.height - document.body.clientHeight;

      if (overflowX > 0) {
        eventPosX = eventPosX - overflowX;
      }

      if (overflowY > 0) {
        eventPosY = eventPosY - overflowY;
      }

      if (eventPosX < 0) {
        eventPosX = 0;
      }

      if (eventPosY < 0) {
        eventPosY = 0;
      }

      return {
        x: eventPosX,
        y: eventPosY
      };
    }
  },
  mounted() {
    this.$nextTick(() => {
      const position = this._calculatePopupPosition(this.$el);
      this.top = position.y;
      this.left = position.x;
    });
  },
  data() {
    return {
      top: '0px',
      left: '0px'
    };
  },
  computed: {
    styleObject() {
      return {
        top: `${this.top}px`,
        left: `${this.left}px`
      };
    }
  }
};
