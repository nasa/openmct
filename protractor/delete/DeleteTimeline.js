var right_click = require("../common/RightMenu.js");
var Create = require("../common/CreateItem")
describe('Delete Timeline', function() {
    var clickClass = new right_click();
    var createClass = new Create();
    var ITEM_NAME = "Timeline";
    var ITEM_TYPE = "timeline";
    var ITEM_MENU_GLYPH = 'S\nTimeline';
    var ITEM_GRID_SELECT = 'P\nS\nTimeline\n0 Items';
    var ITEM_SIDE_SELECT = ">\nS\nTimeline"
    beforeEach(function() {
            browser.ignoreSynchronization = true;
            browser.get('http://localhost:1984/warp/');
            browser.sleep(2000);  // 20 seconds
    });
    it('should delete the specified object', function(){
        clickClass.delete(ITEM_SIDE_SELECT);
        browser.sleep(1000);
    });
     
});