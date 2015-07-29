var right_click = require("../common/RightMenu.js");
var Create = require("../common/CreateItem")
describe('Delete Display', function() {
    var clickClass = new right_click();
    var createClass = new Create();
    var ITEM_NAME = "Display";
    var ITEM_TYPE = "display";
    var ITEM_MENU_GLYPH = 'L\nDisplay Layout';
    var ITEM_GRID_SELECT = 'P\nL\nDisplay Layout';
    var ITEM_SIDE_SELECT = ">\nL\nDisplay"
    beforeEach(function() {
            browser.ignoreSynchronization = true;
            browser.get('http://localhost:1984/warp/');
            browser.sleep(2000);  // 20 seconds
    });
    it('should delete the Dispay', function(){
        clickClass.delete(ITEM_SIDE_SELECT);
        browser.sleep(1000);
    });
     
});