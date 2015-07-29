var itemCreate = require("../common/CreateItem");
var itemEdit = require("../common/EditItem");

describe('Create Timeline', function() {
    var createItemClass = new itemCreate();
    var editItemClass = new itemEdit();
    var ITEM_NAME = "Timeline";
    var ITEM_TYPE = "timeline";
    var ITEM_MENU_GLYPH = 'S\nTimeline';
    var ITEM_GRID_SELECT = 'P\nS\nTimeline\n0 Items';
    beforeEach(function() {
            browser.ignoreSynchronization = true;
            browser.get('http://localhost:1984/warp/');
            browser.sleep(2000);  // 20 seconds
    });
    it('should Create Timeline', function(){
        //button.click()
        browser.wait(function() {
           createItemClass.createButton().click(); 
           return true;    
        }).then(function (){
            var folder =  createItemClass.selectNewItem(ITEM_TYPE)
            expect(folder.getText()).toEqual([ ITEM_MENU_GLYPH ]);
            folder.click()  
        }).then(function() {
            browser.wait(function () {
                return element.all(by.model('ngModel[field]')).isDisplayed();
            })
            createItemClass.fillFolderForum(ITEM_NAME, ITEM_TYPE).click();
            browser.sleep(1000);
        }).then(function (){
            var fo= element.all(by.css('.item.grid-item.ng-scope')).filter(function (arg){ 
                return arg.getText().then(function (text) {
                    expect(text).toEqual("fh");
                    return text == ITEM_GRID_SELECT;
                });
            });
            var item = editItemClass.SelectItem(ITEM_GRID_SELECT);
            expect(item.count()).toBe(1);
            
        });
    });
    it('should Create Timeline Activity', function(){
        var item = editItemClass.SelectItem(ITEM_GRID_SELECT);
        expect(item.count()).toBe(1);
        item.click();    
        browser.sleep(1000);
        expect(browser.getTitle()).toEqual(ITEM_NAME);
        browser.sleep(1000);
        var edit = editItemClass.EditButton();
        expect(edit.count()).toBe(1);
        edit.click();
        browser.sleep(1000);
        editItemClass.CreateActivity();
        var ok = createItemClass.fillFolderForum("Activity", "activity");
        browser.sleep(1000);
        ok.click();
        browser.sleep(1000);
        editItemClass.saveButton();
        //save.click();
        browser.sleep(5000);
    });
     
});
