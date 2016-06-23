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

  displayProperties: ['width'],

  /*
    @read-only
  */
  tableDelegate: function() {
    return this.getPath('displayDelegate.tableDelegate');
  }.property('displayDelegate').cacheable(),

  
  render: function(context) {
    var tableDelegate = this.get('tableDelegate'),
        left = 3,
        content = this.get('content'),
        contentIndex = this.contentIndex,
        columns = this.getDelegateProperty('columns', this.displayDelegate),
        contentCheckboxKey = this.contentCheckboxKey,
        columnsLength = columns.length,
        alternate = ((contentIndex % 2 === 0) ? 'even' : 'odd'),
        col, key, width;

    this.updateContentObservers(content, null);

    tableDelegate.willRenderTableRow(this, context);

    context.addClass(alternate);

    if (contentCheckboxKey) contentCheckboxKey = this.contentCheckboxKey = SC.makeArray(contentCheckboxKey);

    for (var index=0; index < columnsLength; index++) {
      col = columns[index];
      key = col.key;

      width = col.width || 0;
      context = context.push('<div class="cell col-'+index+'" style="left: '+left+'px; top: 0px; bottom: 0px; width: '+width+'px;">');

      if (contentCheckboxKey && contentCheckboxKey.contains(key)) {
        var value = SC.get(content, key) || false;
        this.renderCheckbox(context, value);
      }
      else {
        tableDelegate.renderTableCellContent(this, context, content, contentIndex, col, key);
      }

      context = context.push('</div>');

      left += width;
    }
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
        $cell.css({ width: width+'px', left: left+'px', });

        if (contentCheckboxKey && contentCheckboxKey.contains(key)) {
          var value = SC.get(content, key) || false;
          this.updateCheckbox($cell, value);
        }
        else {
          tableDelegate.updateTableCellContent(this, $cell, content, contentIndex, col, key);
        }

        left += width;
      }
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


  // ..........................................................
  // LABEL EDTITING
  //

  $label: function (evt) {
    var columns = this.getPath('displayDelegate.columns');

    if (evt) {
      this._$label = [];
      if (evt.clickCount === 2) {
        var label = this.$(evt.target),
            editableKeys = this.get('editableKeys');

        // take the parent, as it indicates the column we are in
        var match = null,
          parent = label,
          maxIteration = 10;

        while (!match && parent && maxIteration) {
          match = /col-([0-9])/.exec(parent.attr("class"));
          if (!match) parent = parent.parent();
          maxIteration--;
        }
        if (match) {
          // column number is in match[1]
          var colnr = parseInt(match[1], 10);
          var colname = columns[colnr].key;
          if (editableKeys.contains(colname)){
            this.contentValueKey = colname; // this will allow editing the right field
            this._$label = parent;
          }
        }
      }
    }

    return this._$label;
  },


  /** @private
    Returns true if a click is on the label text itself to enable editing.

    Note that if you override renderLabel(), you probably need to override
    this as well, or just $label() if you only want to control the element
    returned.

    @param evt {Event} the mouseUp event.
    @returns {Boolean} YES if the mouse was on the content element itself.
  */
  contentHitTest: function (evt) {
    // if not content value is returned, not much to do.
    var del = this.displayDelegate;
    var labelKeys = this.getDelegateProperty('editableKeys', del);
    if (!labelKeys) return NO;

    // get the element to check for.
    var el = this.$label(evt)[0];
    if (!el) return NO; // no label to check for.

    var cur = evt.target, layer = this.get('layer');
    while (cur && (cur !== layer) && (cur !== window)) {
      if (cur === el) return YES;
      cur = cur.parentNode;
    }

    return NO;
  },


  // ..........................................................
  // CHECKBOX EDTITING
  //

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




