var right_click = require("../common/RightMenu.js");
var Create = require("../common/CreateItem")
describe('Delete Clock', function() {
    var clickClass = new right_click();
    var createClass = new Create();
    var ITEM_NAME = "Clock";
    var ITEM_TYPE = "clock";
    var ITEM_MENU_GLYPH = 'C\nClock';
    var ITEM_GRID_SELECT = 'P\nC\nClock';
    var ITEM_SIDE_SELECT = "C\nClock";
    beforeEach(require('../common/Launch'));
    it('should delete the Clock', function(){
        clickClass.delete(ITEM_SIDE_SELECT);
        browser.sleep(1000);
    });

});
