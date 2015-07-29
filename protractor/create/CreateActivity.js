var itemCreate = require("../common/CreateItem");
var itemEdit = require("../common/EditItem");

describe('Create Activity', function() {
    var createClass = new itemCreate();
    var editItemClass = new itemEdit();
    var ITEM_NAME = "Activity";
    var ITEM_TYPE = "activity";
    var ITEM_MENU_GLYPH = 'a\nActivity';
    var ITEM_GRID_SELECT = 'P\na\nActivity\n0 Items';
    beforeEach(function() {
            browser.ignoreSynchronization = true;
            browser.get('http://localhost:1984/warp/');
            browser.sleep(2000);  // 2 seconds
    });
    it('should Create new Activity', function(){
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
            var ok = createClass.fillFolderForum(ITEM_NAME, ITEM_TYPE).click();
            browser.sleep(1000);
            //ok.click();
        }).then(function (){
            var item = editItemClass.SelectItem(ITEM_GRID_SELECT);
            expect(item.count()).toBe(1);
        });
            
    });
     
});
