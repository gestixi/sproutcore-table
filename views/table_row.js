// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2012-2014 GestiXi and contributors.
//            Portions ©2011 Jonathan Lewis.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

/*globals SC*/

/*
  Item view used by SC.TableView to draw one row.  This view calls
  SC.TableDelegate.renderTableCellContent() to allow custom cell rendering.
*/

SC.TableRowView = SC.ListItemView.extend({

  isReusable: true,
  
  // PUBLIC PROPERTIES
  
  classNames: 'sc-table-row-view',


  contentCheckboxKey: null,

  contentValueKey: null,
  

  /*
    @read-only
  */
  tableDelegate: function() {
    return this.getPath('displayDelegate.tableDelegate');
  }.property('displayDelegate').cacheable(),
  

  
  // PUBLIC METHODS


  render: function(context) {
    var tableDelegate = this.get('tableDelegate'),
        left = 3, 
        content = this.get('content'),
        contentIndex = this.contentIndex,
        columns = this.getPath('displayDelegate.columns'),
        contentCheckboxKey = this.contentCheckboxKey,
        columnsLength = columns.length,
        alternate = ((contentIndex % 2 === 0) ? 'even' : 'odd'),
        col, key;

    this.updateContentObservers(content, null);

    tableDelegate.willRenderTableRow(this, context);

    context.addClass(alternate);

    if (contentCheckboxKey) contentCheckboxKey = this.contentCheckboxKey = SC.makeArray(contentCheckboxKey);

    for (var index=0; index < columnsLength; index++) {
      col = columns[index];
      key = col.key;

      width = col.width || 0;
      context = context.push('<div class="cell col-'+index+'" style="left: '+left+'px; top: 0px; bottom: 0px; width: '+width+'px;">');

      if (contentCheckboxKey && inArray(key, contentCheckboxKey)) {
        var value = content ? (content.get ? content.get(key) : content[key]) : false;
        this.renderCheckbox(context, value);
      }
      else {
        tableDelegate.renderTableCellContent(this, context, content, contentIndex, col, key);
      }
      
      context = context.push('</div>');

      left += width;
    };
  },


  update: function(jQuery) {
    var tableDelegate = this.get('tableDelegate'),
        columns = this.getPath('displayDelegate.columns'),
        left = 3, width,
        content = this.get('content'),
        lastContent = this._lastContent,
        columnsLength = columns.length,
        contentIndex = this.contentIndex,
        otherAlternate = ((contentIndex % 2 !== 0) ? 'even' : 'odd'),
        alternate = ((contentIndex % 2 === 0) ? 'even' : 'odd'),
        contentCheckboxKey = this.contentCheckboxKey,
        col, key, $cell; 

    this.updateContentObservers(content, lastContent);

    tableDelegate.willUpdateTableRow(this, jQuery);

    jQuery.removeClass(otherAlternate);
    jQuery.addClass(alternate);
    
    if (content && columns && columns.isEnumerable) {
      for (var index=0; index < columnsLength; index++) {
        col = columns[index];
        key = col.key;
        width = col.width || 0;

        $cell = jQuery.find('.cell.col-'+index);
        $cell.css({ width: width+'px', left: left+'px', })

        if (contentCheckboxKey && inArray(key, contentCheckboxKey)) {
          var value = content ? (content.get ? content.get(key) : content[key]) : false;
          this.updateCheckbox($cell, value);
        }
        else {
          tableDelegate.updateTableCellContent(this, $cell, content, contentIndex, col, key);
        }
        
        left += width;
      };
    }

    this._lastContent = content;
  },


  updateContentObservers: function(content, lastContent) {
    if (content === lastContent) return;

    if (lastContent) lastContent.removeObserver('*', this, 'displayDidChange'); 
    if (content) content.addObserver('*', this, 'displayDidChange'); 
  },


  willDestroyLayer: function() {
    var content = this.get('content');

    // There may be a memory leak in SC with _checkboxRenderSource
    if (this._checkboxRenderSource) {
      this._checkboxRenderSource.destroy();
      this._checkboxRenderSource = this._checkboxRenderDelegate = null;
    }

    this.updateContentObservers(null, content);
  },


  // LABEL EDTITING

  // TODO only one cell can currently be edited.
  $label: function (evt) {
    if (evt) {
      this._$label = [];
      if (evt.clickCount === 2) {
        var label = $(evt.target),
            contentValueKey = SC.makeArray(this.get('contentValueKey'));

        if (inArray(label.attr("class"), contentValueKey)) this._$label = label;
      }
    }

    return this._$label;
  },


  // CHECKBOX EDTITING

  updateCheckbox: function (jQuery, state) {
    var renderer = this.get('theme').checkboxRenderDelegate;

    var source = this._checkboxRenderSource;
    if (!source) {
      source = this._checkboxRenderSource =
      SC.Object.create({ renderState: {}, theme: this.get('theme') });
    }

    source
      .set('controlSize', SC.SMALL_CONTROL_SIZE)
      .set('isSelected', state && (state !== SC.MIXED_STATE))
      .set('isEnabled', this.get('isEnabled') && this.get('contentIsEditable'))
      .set('isActive', this._checkboxIsActive)
      .set('title', '');

    renderer.update(source, jQuery.find('.sc-checkbox-view'));

    this._checkboxRenderDelegate = renderer;
  },

});




