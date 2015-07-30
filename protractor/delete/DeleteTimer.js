var right_click = require("../common/RightMenu.js");
var Create = require("../common/CreateItem")
describe('Delete Timer', function() {
    var clickClass = new right_click();
    var createClass = new Create();
    var ITEM_NAME = "Timer";
    var ITEM_TYPE = "timer";
    var ITEM_MENU_GLYPH = 'õ\nTimer';
    var ITEM_GRID_SELECT = 'P\nõ\nTimer';
    var ITEM_SIDE_SELECT = "õ\nTimer"
    beforeEach(require('../common/Launch'));
    it('should delete the Timer', function(){
        clickClass.delete(ITEM_SIDE_SELECT);
        browser.sleep(1000);
    });

});
