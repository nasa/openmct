//TODO Add filter for duplications/
var itemCreate = require("./common/CreateItem");
var itemEdit = require("./common/EditItem");
var right_click = require("./common/RightMenu.js");
    
describe('Create Folder', function() {
    var clickClass = new right_click();
    var createClass = new itemCreate();
    var editItemClass = new itemEdit();
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
    it('should Create new Folder', function(){
        browser.sleep(5000);
        for(var i=0; i < 50; i++){
            browser.wait(function() {
               createClass.createButton().click(); 
               return true;    
            }).then(function (){
                var folder =  createClass.selectNewItem(ITEM_TYPE);
                expect(folder.getText()).toEqual([ ITEM_MENU_GLYPH ]);
                browser.sleep(1000);
                folder.click()  
            }).then(function() {
                browser.wait(function () {
                    return element.all(by.model('ngModel[field]')).isDisplayed();
                })
                createClass.fillFolderForum(ITEM_NAME, ITEM_TYPE).click();
                browser.sleep(1000);
            }).then(function (){
                browser.sleep(1000);
              //  if(i === 1){
                    clickClass.delete(ITEM_SIDE_SELECT, true);
                    element.all(by.css('.ui-symbol.view-control.ng-binding.ng-scope')).click();
               // }else{
                   browser.sleep(1000);
                   
                   // clickClass.delete(ITEM_SIDE_SELECT, false);
              //  }
            });
        }
        browser.pause();
                
    });
     
});
