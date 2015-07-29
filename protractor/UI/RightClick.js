var right_click = require("../common/RightMenu.js");
var Create = require("../common/CreateItem")
describe('Right Click Interations', function() {
    var clickClass = new right_click();
    var createClass = new Create();
    var ITEM_NAME = "Folder";
    var ITEM_TYPE = "folder";
    var ITEM_MENU_GLYPH = 'F\nFolder';
    
    beforeEach(function() {
            browser.ignoreSynchronization = true;
            browser.get('http://localhost:1984/warp/');
            browser.sleep(2000);  // 20 seconds
    });
    it('should delete the specified object', function(){
        createClass.createButton().click(); 
        var folder =  createClass.selectNewItem(ITEM_TYPE);
        expect(folder.getText()).toEqual([ ITEM_MENU_GLYPH ]);
        browser.sleep(1000);
        folder.click()  
        browser.sleep(1000);
        browser.wait(function () {
            return element.all(by.model('ngModel[field]')).isDisplayed();
        })
        createClass.fillFolderForum(ITEM_NAME, ITEM_TYPE).click();
        clickClass.delete(ITEM_NAME);
        browser.sleep(1000);
    });
     
});