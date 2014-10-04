// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2012-2014 GestiXi and contributors.
//            Portions ©2011 Jonathan Lewis.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

/*globals SC*/

/*
  Defines the TableView's delegate API.  By default the TableView is also its
  own delegate, but if you'd like to define your own delegate to override any of
  these functions, simply mix this into an object and point the TableView.delegate
  property at it.  That object will then start getting these requests.
*/

SC.TableDelegate = {

  /**
    Walk like a duck

    @type Boolean
    @default true
  */
  isTableDelegate: true,
  


	getSortKey: function(key) {
  	return key;
  },
  
  /*
    Called when someone clicks on a column header view after it has already been
    selected, indicating a request to sort.
    
    To allow the TableView to handle sorting itself, return false to indicate you did
    not handle it.
    
    To handle it yourself, override this method and return true to indicate that
    you're handling the request (i.e. inline, or with a server call, etc).
    When your sort is finished, set the TableView.sort property to update the view
    with the kind of sort that you performed.
  */
  tableDidRequestSort: function(tableView, content, column, columnIndex, direction) {
    return false; // return false if we did not handle it.  The TableView will then use its default sort.
  },

  willRenderTableRow: function(row, context) {
    
  },
  
  /*
    This method is called once per cell being rendered, to generate the content of the
    cell's outer div element.  Override it to add custom content.  By default it simply
    pushes an additional div containing the cell's value as text onto the render context.
    
    This method is called quite often, so keep it fast for the best table performance.
    If you're rendering user-saved data, make sure it's safe as well as this function
    pushes HTML code straight into the DOM.
    
    NOTE: Always return the render context, even if you do nothing with it.  This
    function is a subroutine in an existing render() call.
  */
  renderTableCellContent: function(view, context, content, contentIndex, column, key) {
    var text = this.textForTableCellContent(content, key);
    context.push('<div class="text">%@</div>'.fmt(text));
  },

  willUpdateTableRow: function(row, jQuery) {
    
  },

  updateTableCellContent: function(view, jQuery, content, contentIndex, column, key) {
    var html = this.textForTableCellContent(content, key);
    jQuery.find('.text').html(html);
  },

  textForTableCellContent: function(content, key) {
    if (!content) return '';
    var text = content.getPath(key);
    if (text == null) return '';
    if (SC.typeOf(text) === SC.T_STRING) text = SC.RenderContext.escapeHTML(text);

    return text;
  },

	rightClicOnHeadCell: function(tableView, headerView, headerItemView, evt) {},

  columnSizeDidChange: function(tableView, headerView, headerItemView, evt, newWidth) {},
	
	endColumnDrag: function(tableView) {},

};
