// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2012-2014 GestiXi and contributors.
//            Portions ©2011 Jonathan Lewis.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

/*globals SC*/


/*
  Extends SC.CollectionView to render the table's header.
*/

SC.TableHeaderView = SC.CollectionView.extend({

  // PUBLIC PROPERTIES

  classNames: 'sc-table-header-view',

  /*
    Mirrors the SC.TableView.sort property.  See table.js for documentation.
  */
  sort: null,

  /*
    Pointer to the TableView that owns this header.
  */
  ownerTableView: null,

  ghostActsLikeCursor: true,



  /*
    View class definition for showing the insertion point for reorder dragging.
  */
  insertionPointView: SC.View.extend({
    backgroundColor: '#57647F',
    layout: { left: 0, top: 0, bottom: 0, width: 2 },
    render: function(context, firstTime) {
      if (firstTime) {
        context.push('<div class=\"anchor\"></div>');
      }
    }
  }),

  // PUBLIC METHODS

  layoutForContentIndex: function(contentIndex) {
    var content = this.get('content');
    var left = 0, width, ret;
    
    // TODO: Set up an internal lookup table of some sort to avoid the brute force looping search here.
    if (content && content.isEnumerable) {
      content.forEach(function(col, index) {
        if (index < contentIndex) {
          left += col.get('width');
        }
        else if (index === contentIndex) {
          width = col.get('width');
        }
      });
      
      ret = {
        left: left,
        width: width
      };
    }

    return ret;
  },

  /*
    Overriding from SC.CollectionView to apply sort info to each item view prior
    to creation.
  */
  createItemView: function(exampleClass, idx, attrs) {
    var sort = this.get('sort');
    var key = sort ? sort.key : null;
        
    if (attrs.content && (attrs.content.get('key') === key)) {
      attrs.sortDirection = sort ? sort.direction : null;
    }
    else {
      delete attrs.sortDirection; // attrs is reused, so clean it up
    }

    return exampleClass.create(attrs);
  },

	
	invokeDelegateMethod: function(methodName) {
		var delegate = this.get('tableDelegate'),
				method = delegate[methodName],
    		args = SC.A(arguments),
				tableView = this.parentView.parentView.parentView;

    args = args.slice(1, args.length);
		args.unshift(tableView);
    return method.apply(delegate, args);
  },



  collectionViewDragViewFor: function(view, dragContent) {
		 dragContent.forEach(function(i) { itemView = this.itemViewForContentIndex(i); }, this);
	
		if (itemView) {
			return SC.LabelView.create({ 
						layout: { width: itemView.layout.width, height: 22 }, 
						classNames: 'sc-table-header-ghost', 
						value: itemView.getPath('content.label'),
					}); 
    }
  },

  insertionIndexForLocation: function(loc, dropOperation) {
    var childViews = this.get('childViews'),
      len = childViews.length,
      i, frame,
      ret = -1;

    if (childViews) {
      // TODO: Set up an internal lookup table of some sort to avoid the brute force looping search here.
      for (i = 0; i < len; i++) {
        frame = childViews[i].get('frame');
        
        if ((loc.x >= frame.x) && (loc.x <= (frame.x + frame.width))) {
          ret = [i, SC.DROP_AFTER];
          if ((loc.x - frame.x) < ((frame.x + frame.width) - loc.x)) ret[1] = SC.DROP_BEFORE;
          break;
        }
      }
    }

    return ret === -1 ? len-1 : ret;
  },
  
  showInsertionPoint: function(itemView, dropOperation) {
    // It can happen when dragging a view outside on the right
    if (!itemView) return;

    var view = this._insertionPointView;
    var frame = itemView.get('frame');
    var left = frame.x;
    
    if (!view) {
      view = this._insertionPointView = this.get('insertionPointView').create();
      this.appendChild(view);
    }
    
    if (dropOperation & SC.DROP_AFTER) {
      if (itemView.get('contentIndex') === (this.get('length') - 1)) left = frame.x + frame.width - view.get('frame').width;
      else left = frame.x + frame.width;
    }
    
    view.adjust({ left: left });
  },
  
  hideInsertionPoint: function() {
    if (this._insertionPointView) {
      this._insertionPointView.removeFromParent().destroy();
      this._insertionPointView = null;

      this.invokeDelegateMethod('endColumnDrag');
    }
  },


	mouseDown: function(evt) {
    var itemView = this.itemViewForEvent(evt);

		if(evt.which == 3) {
			this.invokeDelegateMethod('rightClicOnHeadCell', this, itemView, evt);
      return false;
    }

    // If there is no header, we do not go futher
    if (!itemView) return false;

    if (evt.target.className === 'resize-handle') {
      this._itemViewWidth = itemView.get('frame').width;
    }

		return sc_super();
  },

  // Is not used and throw an error when dragging and realese an header at 
  // the extrem rigth where there is no more header
  mouseMoved: function (ev) {
    return YES;
  },


  mouseDragged: function(evt) {
    var itemViewWidth = this._itemViewWidth,
        info = this.mouseDownInfo,
        event = info.event;
        
    if (itemViewWidth) { 
      var itemView = info.itemView,
          content = itemView.get('content');

      var newWidth = Math.max(itemViewWidth + evt.pageX - event.pageX, itemView.get('minWidth'));
      
      itemView.setPathIfChanged('content.width', newWidth);

      this.invokeDelegateMethod('columnSizeDidChange', this, itemView, evt, newWidth);

      this.ownerTableView.columnsDidChange();

      return true;
    }
    
    return sc_super();
  },

  mouseUp: function(evt) {
    if (this._itemViewWidth) { 
      this._itemViewWidth = null;

      return true;
    }
    
    return sc_super();
  },
	
  
  // PRIVATE METHODS
  
  _sortDidChange: function() {
    this.invokeOnce('_updateSortView');
  }.observes('sort'),
  
  _updateSortView: function() {
    var childViews = this.get('childViews'), i, col;
    var sort = this.get('sort');
    var key = sort ? sort.key : null;
    var dir = sort ? sort.direction : null;
    
    //console.log('%@._updateSortView()'.fmt(this));

    if (childViews) {
      for (i = 0; i < childViews.length; i++) {
        col = childViews[i].get('content');
        
        if (col) {
          if (col.get('key') === key) childViews[i].set('sortDirection', dir);
          else childViews[i].set('sortDirection', null);
        }
      }
    }
  },
  
  
  // PRIVATE PROPERTIES
  
  _insertionPointView: null

});
