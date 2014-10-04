// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2012-2014 GestiXi and contributors.
//            Portions ©2011 Jonathan Lewis.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

/*globals SC*/

/*
  Item view used by SC.TableHeaderView to render a column header view.
*/

SC.TableColumnHeaderView = SC.View.extend(SC.Control, {

  classNames: 'sc-table-column-header-view',
  
  isReusable: false,

  /*
    Set to an SC.SORT_DIRECTION_ enumeration as defined in core.js.
  */
  sortDirection: null,

  displayProperties: ['sortDirection'],
	
  /*
    Min width for resize dragging.
  */
  minWidth: 21,

  render: function(context) {
    var sortDirection = this.get('sortDirection'),
      classNames = this.getPath('content.classNames');

    context.setClass('sort-indicator', !SC.none(sortDirection));

    context = context.addClass('col-%@'.fmt(this.get('contentIndex')));
		
    if (classNames) {
      context = context.addClass(classNames);
    }

    context = context.begin('div').addClass('col-border').end();
    context = context.begin('div').addClass('col-name').text(this.getPath('content.label')).end();

    if (!SC.none(sortDirection) && this.getPath('content.canSort')) {
      context = context.begin('div').addClass(sortDirection).end();
    }
    
    if (this.getPath('content.canResize')) {
      context = context.begin('div').addClass('resize-handle').end();
    }
  },
  
});
