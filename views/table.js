// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2012-2014 GestiXi and contributors.
//            Portions ©2011 Jonathan Lewis.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

/*globals SC*/

sc_require('views/table_row');
sc_require('views/table_head');
sc_require('mixins/table_delegate');

/*
  A TableView for viewing tabular data using Sproutcore.
  
  Connect an array of row objects to the 'content' property.
  Define your column set by connecting an array of objects mixin in
  SC.Column to the 'columns' property.  Each of which may be a binding
  to an array controller if you wish.

*/

SC.TableView = SC.View.extend(SC.TableDelegate, {

  classNames: 'sc-table-view',

  isTableView: true,

	// ................................................................................................
  // ROWS
  //

  /*
    Array of row content.  May be bound to an array controller if desired.
  */
  content: null,

  /*
    SC.SelectionSet
    The selected row(s).
  */
  selection: null,

  /*
    Row height in pixels.
  */
  rowHeight: 20,
	
  showAlternatingRows: true,
	
	canReorderContent: false,
	
	canDeleteContent: false,
	
  /*
    Target for action fired when double-clicking on a row
  */
  target: null,

  /*
    Action to be fired when double-clicking on a row
  */
  action: null,

  /*
    Array of properties that will be displayed as checkbox
  */
  contentCheckboxKey: null,

  /*
    Array of properties that will be éditable
  */
  contentValueKey: null,

  /*
    @read-only
  */
  isVerticalScrollerVisible: true,

	// ................................................................................................
  // COLUMNS
  //

	/*
    Array of column objects (each should mix in SC.Column).  May be bound
    to an array controller if desired.
  */
  columns: [],

  /*
    true if columns can be reordered by dragging.
  */
  canReorderColumns: true,

  /*
    Set this to show which column is being sorted in which direction.
    
    ** This property is for view purposes only -- it does not actually cause any sorting
    to take place.  You have to sort your data yourself, then set this property to show
    what you did. **
    
    Should be a hash of the form:
    
      {
        key: '(property name on which to sort)',
        direction: SC.SORT_DIRECTION_ enumeration (see core.js for available definitions)
      }
      
    Note that the inner properties of this hash are not observed, so to change them,
    you should set the entire hash to a new object.
  */
  sort: null,

  /*
    Height of the header view in pixels.
  */
  headerHeight: 22,


  // ................................................................................................
  // DISPLAY
  //

  /*
    Optional -- set to an object mixing in SC.TableDelegate to override
    certain table functionality, such as sorting and table cell rendering.
  */
  delegate: null,
  
  /*
    @read-only
    For internal use.  The various components of the table view query this
    property for a delegate object mixing in SC.TableDelegate.  This property
    tries several possibilities in this order:
    
      1. The 'delegate' property above
      2. The 'content' property above (this would usually be via a content-providing array controller having the mixin)
      3. This TableView itself, which always has the mixin as a last resort.
  */
  tableDelegate: function() {
    var del = this.get('delegate'), 
        content = this.get('content');

    // @if (debug)
    if (del && !del.isTableDelegate) {
      console.error("A delegate is defined but it doesn't implement SC.TableDelegate.");
    }
    if (!del && content && !content.isTableDelegate) {
      console.error("content is defined but it doesn't implement SC.TableDelegate.", content);
    }
    // @endif

    // defaults to 'this' if neither 'del' or 'content' have the SC.TableDelegate mixin
    return this.delegateFor('isTableDelegate', del, content); 
  }.property('delegate', 'content').cacheable(),

  /*
    @read-only
    The sum of the column widths.
  */
  tableWidth: function() {
    var columns = this.get('columns'),
        ret = 0;

    if (columns) {
      columns.forEach(function(col) {
        ret += (col.get('width') || 0);
      }, this);
    }

    return ret;
  }.property().cacheable(),

  
  createChildViews: function() {
    sc_super();
    
    var headerScrollView, bodyScrollView,
        headerHeight = this.get('headerHeight'),
        tableWidth = this.get('tableWidth');

    bodyScrollView = this.createChildView(SC.ScrollView, {
      classNames: 'sc-table-body-scroll-view',
      layout: { left: 0, right: 0, top: headerHeight, bottom: 0 },
      contentView: SC.ListView.extend({
        layout: { right: 0, minWidth: tableWidth },
        ownerTableView: this,
        contentBinding: SC.Binding.from('content', this),
        columnsBinding: SC.Binding.from('columns', this).oneWay(),
        selectionBinding: SC.Binding.from('selection', this),
        
        rowHeight: this.get('rowHeight'),

        exampleView: SC.TableRowView.design({
          contentCheckboxKey: this.get('contentCheckboxKey'),
          contentValueKey: this.get('contentValueKey'),
        }),

        tableDelegateBinding: SC.Binding.from('tableDelegate', this).oneWay(),
        delegateBinding: SC.Binding.from('delegate', this).oneWay(),

        showAlternatingRowsBinding: SC.Binding.from('showAlternatingRows', this).oneWay(),
        targetBinding: SC.Binding.from('target', this).oneWay(),
        actionBinding: SC.Binding.from('action', this).oneWay(),
        canReorderContentBinding: SC.Binding.from('canReorderContent', this).oneWay(),
				canDeleteContentBinding: SC.Binding.from('canDeleteContent', this).oneWay(),
        canEditContent: !!this.get('contentValueKey'),
      }),

      isVerticalScrollerVisibleBinding: SC.Binding.from('isVerticalScrollerVisible', this)
    });
    this._bodyScrollView = bodyScrollView;
    this._bodyView = bodyScrollView.get('contentView');
		
		// Afin que le background soit visible sur toute la largeur du header, meme au dessus de la scroll bar car celui-ci est
		// ajusté par la suite pour éviter qu'il se décale lors d'un scroll vers la droite
		headerBackGroundView = this.createChildView(SC.View, { 
			layout: { left: 0, right: 0, top: 0, height: headerHeight },
			classNames: 'sc-table-header-background-view', 
		});
			
    headerScrollView = this.createChildView(SC.ScrollView, {
      classNames: 'sc-table-header-scroll-view',
      layout: { left: 0, right: 0, top: 0, height: headerHeight },
      contentView: SC.TableHeaderView.extend({
        layout: { right: 0, minWidth: tableWidth },
        contentBinding: SC.Binding.from('columns', this),
        exampleView: SC.TableColumnHeaderView,
        sortBinding: SC.Binding.from('sort', this),
        tableDelegateBinding: SC.Binding.from('tableDelegate', this).oneWay(),
        ownerTableView: this,
        allowDeselectAll: true,
        canReorderContentBinding: SC.Binding.from('canReorderColumns', this),
        target: this,
        action: '_onColumnAction',
        actOnSelect: true,
      }),
			
      hasVerticalScroller: false, // header never scrolls vertically
      
      // We have to keep a horizontal scroller, but we never want to see it in the header,
      // so make its thickness 0.
      horizontalScrollerView: SC.ScrollerView.extend({ scrollbarThickness: 0 }),
      horizontalTouchScrollerView: SC.TouchScrollerView.extend({ scrollbarThickness: 0 }),

      // Bind the horizontal scroll position to the body scroll view's position, so they
      // move in tandem.
      horizontalScrollOffsetBinding: SC.Binding.from('horizontalScrollOffset', bodyScrollView)
    });

    this._headerScrollView = headerScrollView;
    this._headerView = headerScrollView.get('contentView');

    var childViews = this.get('childViews') || [];
    childViews.pushObjects([bodyScrollView, headerBackGroundView, headerScrollView]);

    this.set('childViews', childViews);
  },
  
  /*
    Force a reload of both header and body collection views.
  */
  reload: function() {
    //console.log('%@.reload()'.fmt(this));

    if (this._headerView) {
      this._headerView.reload();
    }
    
    if (this._bodyView) {
      this._bodyView.reload();
    }
  },

  /*
    Try to hand off the sort request to the delegate, otherwise try to do it ourselves.
  */
  tableColumnDidRequestSort: function(col, colIndex, direction) {
    //console.log('%@.tableColumnDidRequestSort(col: %@, colIndex: %@, direction: %@)'.fmt(this, col, colIndex, direction));
    if (!col.get('canSort')) return;

    var del = this.get('tableDelegate'),
      content = this.get('content'),
      dir = direction ? direction : SC.SORT_DIRECTION_NONE,
      didSort = false, key;
		
    //console.log('%@._sortContent()'.fmt(this));
    
    if (del && del.tableDidRequestSort && !del.tableDidRequestSort(this, content, col, colIndex, dir)) {
    	key = col.get('key');
    	
      if (SC.kindOf(content, SC.ArrayController)) {
        if (dir === SC.SORT_DIRECTION_ASCENDING) content.set('orderBy', '%@ ASC'.fmt(key));
        else if (dir === SC.SORT_DIRECTION_DESCENDING) content.set('orderBy', '%@ DESC'.fmt(key));
        else content.set('orderBy', null);
        didSort = true;
      }
      else if (SC.typeOf(content) === SC.T_ARRAY) {
				content.sortProperty(key);
        if (dir === SC.SORT_DIRECTION_ASCENDING) content.reverse();
        if (content.isEnumerable) content.enumerableContentDidChange();
        didSort = true;
      }
      else {
        console.warn('Error in TableView(%@)._sortContent(): Content type is not recognized as sortable.'.fmt(this));
      }
      
      // Update the view to show how we're sorting over now.
      if (didSort) {
        this.set('sort', { key: key, direction: dir });
      }
    }
  },

  /*
    If the body view gets or loses a vertical scroll bar, we have to adjust the header
    layout so the scrolling of the two views stays identical.
  */
  _isVerticalScrollerVisibleDidChange: function() {
    this.invokeOnce('_updateTableLayout');
  }.observes('isVerticalScrollerVisible'),

  /*_tableDelegateDidChange: function() {
    //console.log('%@._tableDelegateDidChange(%@)'.fmt(this, this.get('tableDelegate')));
    this.invokeOnce('reload');
  }.observes('tableDelegate'),*/

  /*
    Since this is an observer, don't do any actual work, but invalidate the
    appropriate things that should be recalculated next runloop.
  */
  columnsDidChange: function() {
    this.notifyPropertyChange('tableWidth');
    this.invokeOnce('reload');
  }.observes('*columns.[]'),

  _tableWidthDidChange: function() {
    this.invokeOnce('_updateTableLayout');
  }.observes('tableWidth'),
  
  _tv_frameDidChange: function() {
    this.invokeOnce('_updateTableLayout'); // forces scroll bars to update
  }.observes('frame'),
  
  _updateTableLayout: function() {
    var tableWidth = this.get('tableWidth');
    var visibleWidth = this._bodyScrollView.getPath('containerView.frame').width;
    var newWidth = Math.max(tableWidth, visibleWidth);

    //console.log('%@._updateTableLayout(width: %@)'.fmt(this, newWidth));

    this.beginPropertyChanges();
		

    if (this._headerScrollView) {
    	this._headerScrollView.adjust({ right: this._bodyScrollView.get('frame').width - visibleWidth });
    }
		

    if (this._headerView) {
      this._headerView.adjust({ minWidth: newWidth });
      this._headerView.set('calculatedWidth', newWidth);
    }
    
    if (this._bodyView) {
      this._bodyView.adjust({ minWidth: newWidth });
      this._bodyView.set('calculatedWidth', newWidth);
    }

    this.endPropertyChanges();
  },

  
  /*
    Handles clicks on column headers.
  */
  _onColumnAction: function(sender) {
    var del = this.get('tableDelegate'),
    		selection = sender ? sender.get('selection') : null;
    var col, sort, dir = SC.SORT_DIRECTION_ASCENDING, key;

    if (selection && (selection.get('length') === 1)) {
      col = selection.get('firstObject');
      sort = this.get('sort');
      
      key = col.get('key');

			// Le premier clic tri ASC - Le deuxieme clic tri DEC - Le troisième annule le tri
      if (sort && (sort.key === key)) {
      	if (sort.direction === SC.SORT_DIRECTION_ASCENDING)  dir = SC.SORT_DIRECTION_DESCENDING;
				else if (sort.direction === SC.SORT_DIRECTION_DESCENDING) {
						// Si le content est vient d'un arrayController, alors, on permet l'annulation de tri au bout de trois clic
						// On ne peut pas annuler le tri si c'est au array normal car le tri initial n'est pas mémorisé
      		 if (SC.kindOf(this.get('content'), SC.ArrayController)) dir = null; 
      		 else dir = SC.SORT_DIRECTION_ASCENDING;
      	}
			}
      
      this.tableColumnDidRequestSort(col, this.get('columns').indexOf(col), dir);
    }

    this._lastColumnSelection = selection;
  },
  
  // PRIVATE PROPERTIES
  
  _headerScrollView: null,
  _headerView: null,
  _bodyScrollView: null,
  _bodyView: null,
  _columnIndex: null,
  _lastColumnSelection: null

});
