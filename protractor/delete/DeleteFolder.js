var right_click = require("../common/RightMenu.js");
var Create = require("../common/CreateItem")
describe('Delete Folder', function() {
    var clickClass = new right_click();
    var createClass = new Create();
    var ITEM_NAME = "Folder";
    var ITEM_TYPE = "folder";
    var ITEM_MENU_GLYPH = 'F\nFolder';
    var ITEM_GRID_SELECT = 'P\nF\nFolder\n0 Items';
    var ITEM_SIDE_SELECT = ">\nF\nFolder"
    beforeEach(function() {
            browser.ignoreSynchronization = true;
            browser.get('http://localhost:1984/warp/');
            browser.sleep(2000);  // 20 seconds
    });
    it('should delete the folder', function(){
        clickClass.delete(ITEM_SIDE_SELECT);
        browser.sleep(1000);
    });
     
});