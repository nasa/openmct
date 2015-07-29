var fullScreenFile = require("../common/Buttons");
var createClassFile = require("../common/CreateItem")
var itemEdit = require("../common/EditItem");
var rightMenu = require("../common/RightMenu.js");

describe('Test New Window', function() {
    var fullScreenClass = new fullScreenFile();
    var createClass = new createClassFile();
    var editItemClass = new itemEdit();
    var rightMenuClass = new rightMenu();
    
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
    it('should create an object and open it in new window', function(){
        function replaceString(string){
            //used to remove timestamp on the output so files can be compared
            return string.replace(new RegExp("([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]","g"),"z");
        }
        browser.wait(function() {
           return createClass.createButton().click(); 
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
            //open file in new page
            var before = browser.driver.getPageSource();
            before = browser.executeScript(replaceString, before)
    
            var item = editItemClass.SelectItem(ITEM_GRID_SELECT);        
            expect(item.count()).toBe(1);
            browser.sleep(1000); 
            fullScreenClass.newWidnow().click();
             
            var after = browser.driver.getPageSource();
            after = browser.executeScript(replaceString, after)
            
            browser.getAllWindowHandles().then(function (handles) {
                browser.driver.switchTo().window(handles[1]);
                browser.sleep(1000); 
                expect(before).toEqual(after);
                browser.sleep(1000); 
                browser.driver.close();
                browser.driver.switchTo().window(handles[0]);
            });
        });
    });
    it('should delete the object in the new window', function(){
        browser.wait(function() {
            return element.all(by.css('.ui-symbol.view-control.ng-binding.ng-scope')).isDisplayed();
        });
        rightMenuClass.delete(ITEM_SIDE_SELECT);
        browser.sleep(1000);
    });
    
});