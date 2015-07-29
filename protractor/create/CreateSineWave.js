var itemCreate = require("../common/CreateItem");

describe('Create Sine Wave Generator', function() {
    var createClass = new itemCreate();
    var ITEM_NAME = "Sine Wave G";
    var ITEM_TYPE = "sinewave";
    var ITEM_MENU_GLYPH = 'T\nSine Wave Generator'
    beforeEach(function() {
            browser.ignoreSynchronization = true;
            browser.get('http://localhost:1984/warp/');
            browser.sleep(2000);  // 20 seconds
    });
    it('should Create new Sin Wave Generator' , function(){
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
            var ok = createClass.fillFolderForum(ITEM_NAME, ITEM_TYPE);
            browser.sleep(1000);
            ok.click();
        }).then(function (){
            var checkfolder = element.all(by.css('.title.ng-binding')).filter(function (ele) {
                return ele.getTagName('div').then(function (tag){
                    return tag == 'div';
                });
            })
            expect(checkfolder.getText()).toEqual([ '', 'Sine Wave G' ]);

        });
            
    });
     
});
