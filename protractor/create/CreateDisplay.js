var itemCreate = require("../common/CreateItem");
var itemEdit = require("../common/EditItem");

describe('Create Display', function() {
    var createClass = new itemCreate();
    var editItemClass = new itemEdit();
    var ITEM_NAME = "Display";
    var ITEM_TYPE = "display";
    var ITEM_MENU_GLYPH = 'L\nDisplay Layout';
    var ITEM_GRID_SELECT = 'P\nL\nDisplay\n0 Items';
    
    beforeEach(function() {
            browser.ignoreSynchronization = true;
            browser.get('http://localhost:1984/warp/');
            browser.sleep(2000);  // 20 seconds
    });
    it('should Create new Display', function(){
        //button.click()
        browser.wait(function() {
           createClass.createButton().click(); 
           return true;    
        }).then(function (){
            var folder =  createClass.selectNewItem(ITEM_TYPE)
            expect(folder.getText()).toEqual([ ITEM_MENU_GLYPH ]);
            browser.sleep(1000);
               folder.click()  
        }).then(function() {
            browser.wait(function () {
                return element.all(by.model('ngModel[field]')).isDisplayed();
            })
            createClass.fillFolderForum(ITEM_NAME,ITEM_TYPE).click();
            browser.sleep(1000);
        }).then(function (){
            var item = editItemClass.SelectItem(ITEM_GRID_SELECT);
            expect(item.count()).toBe(1);
            browser.sleep(1000);
        });
            
    });
     
});
