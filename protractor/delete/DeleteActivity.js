var right_click = require("../common/RightMenu.js");
var Create = require("../common/CreateItem")
describe('Delete Activity', function() {
    var clickClass = new right_click();
    var createClass = new Create();
    var ITEM_NAME = "Activity";
    var ITEM_TYPE = "activity";
    var ITEM_MENU_GLYPH = 'a\nActivity';
    //var ITEM_GRID_SELECT = 'P\nS\nTimeline\n0 Items';
    var ITEM_SIDE_SELECT = ">\na\nActivity"
    beforeEach(require('../common/Launch'));
    it('should delete the Activity', function(){
        clickClass.delete(ITEM_SIDE_SELECT);
        browser.sleep(1000);
    });

});
