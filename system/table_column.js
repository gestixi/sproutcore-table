// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2012-2014 GestiXi and contributors.
//            Portions ©2011 Jonathan Lewis.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================


/** @class

  An abstract object that manages the state of the columns behind a
  `SC.TableView`.
  
  @extends SC.Object
  @since SproutCore 1.10
*/

SC.TableColumn = SC.Object.extend({

  /**
    Walk like a duck

    @type Boolean
    @default true
  */
  isColumn: true,

  /*
    The name of the property on your row objects whose value should be
    shown in this column.
  */
  key: null,
  
  /*
    The display name of the column. Will appear in the table header for this
    column.
  */
  label: null,

  /*
    The key to use to sort this column if the key is a path
  */
  sort: null,

  /*
    The key to use to sort this column using the server.
  */
  sortServer: null,

  /*
    @optional
    The name of the property on your row objects whose value will provide an
    icon classname string for this column.  If null, will be ignored and no icon class
    will be added.
    
    If this property is non-null, then an additional icon div will be automatically pushed
    inside the cell's outer div with the CSS classes 'icon' and whatever other classname string
    the property referenced by 'iconKey' provides.  In addition, to help with styling, 
    the 'has-icon' class will also be added to the cell's outer div.
  */
  iconKey: null,

  /**
    Width of the column.
    
    @property
    @type Number
  */
  width: 100,
  
  /**
    How narrow the column will allow itself to be.
    
    @property
    @type Number
  */
  minWidth: 16,
  
  /**
    How wide the column will allow itself to be.
    
    @property
    @type Number
  */
  maxWidth: 700,

  /*
    Set to false to disallow resizing this column via dragging in the table view.
    However, manually setting the 'width' property above will always work, regardless
    of the setting here.
  */
  canResize: true,
  
  /**
    Whether the column can be drag-reordered.
    
    @property
    @type Boolean
  */
  isReorderable: true,
  
  /**
    Whether the column can be sorted.
    
    @property
    @type Boolean
  */
  isSortable: true,

  /*
    Whether or not this column can request to be sorted in response to a click on its header
    view in the table.  If true, then the SC.TableDelegate object will get the first
    option to handle the sort request, and if it declines or doesn't exist, then the
    TableView itself will attempt to sort the column.  Be sure to pay attention to how many
    rows you're trying to sort, as this can take quite some time for large tables and raise
    "unresponsive script" errors in the browser.
  */
  canSort: true,
  
  /*
    An array of additional CSS class names you would like to apply to this column's
    header view, if desired.
  */
  classNames: null,

  escapeHTML: false,


});



