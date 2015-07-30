var right_click = require("../common/RightMenu.js");
var Create = require("../common/CreateItem")
describe('Delete Webpage', function() {
    var clickClass = new right_click();
    var createClass = new Create();
    var ITEM_NAME = "Webpage";
    var ITEM_TYPE = "webpage";
    var ITEM_MENU_GLYPH = 'ê\nWeb Page';
    var ITEM_SIDE_SELECT = "ê\nWebpage"
    beforeEach(require('../common/Launch'));
    it('should delete the Webpage', function(){
        clickClass.delete(ITEM_SIDE_SELECT);
        browser.sleep(1000);
    });

});
