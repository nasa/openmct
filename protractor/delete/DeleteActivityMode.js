var right_click = require("../common/RightMenu.js");
var Create = require("../common/CreateItem")
describe('Delete Activity Mode', function() {
    var clickClass = new right_click();
    var createClass = new Create();
    var ITEM_NAME = "Activity Mode";
    var ITEM_TYPE = "activity-mode";
    var ITEM_MENU_GLYPH = 'A\nActivity Mode';
    var ITEM_GRID_SELECT = 'P\nA\nActivity Mode';
    var ITEM_SIDE_SELECT = "A\nActivity Mode"
    beforeEach(require('../common/Launch'));
    it('should delete the Activty Mode', function(){
        clickClass.delete(ITEM_SIDE_SELECT);
        browser.sleep(1000);
    });

});
