#Overview

This is a table view for [Sproutcore](http://www.github.com/sproutcore/sproutcore).

##How to Use
    
    MyApp.arrayController.columns = [  
      SC.TableColumn.create({ key: "key1", label: _("Label 1"), width: 100 }),
      SC.TableColumn.create({ key: "key2", label: _("Label 2"), width: 200 }),
    ];


    SC.TableView.extend({
      contentBinding: 'MyApp.arrayController.arrangedObjects',
      selectionBinding: 'MyApp.arrayController.selection',  
      columnsBinding: 'MyApp.arrayController.columns',
    })

##TODO:

  * Improve documentation
  * Allow cell editing for more than one cell per row
  * Add unit tests
