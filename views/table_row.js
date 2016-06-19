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

  exampleEditor: SC.InlineTextFieldView.extend({

    positionOverTargetView: function(target, exampleFrame, elem, _oldExampleFrame, _oldElem) {
      var targetLayout = target.get('layout'),
          layout = {};

      // Deprecates isCollection and pane arguments by fixing them up if they appear.
      if (!SC.none(_oldExampleFrame)) {
        exampleFrame = _oldExampleFrame;
        elem = _oldElem;

        // @if(debug)
        SC.warn("Developer Warning: the isCollection and pane arguments have been deprecated and can be removed.  The inline text field will now position itself within the same parent element as the target, thus removing the necessity to calculate the position of the target relative to the pane.");
        // @endif
      }

      // In case where the label is part of an SC.ListItemView, in the table...
      if (exampleFrame && elem) {
        var frame = SC.offset(elem, 'parent');
        layout.top = targetLayout.top + frame.y - exampleFrame.height/2;
        layout.left = targetLayout.left + frame.x + exampleFrame.x;
        layout.height = exampleFrame.height;
        layout.width = exampleFrame.width;
      } else {
        layout = SC.copy(targetLayout);
      }

      this.set('layout', layout);
    }
  }),

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


  // LABEL EDTITING

  // TODO only one cell can currently be edited.
  $label: function (evt) {
    var columns = this.getPath('displayDelegate.columns');
    if (evt) {

      this._$label = [];
      if (evt.clickCount === 2) {
        var label = this.$(evt.target),
            //contentValueKey = SC.makeArray(this.get('contentValueKey'));
            editableKeys = this.get('editableKeys');

        // var l = label.attr("class");
        // take the parent, as it indicates the column we are in
        var p = label.parent().attr("class");
        var match = /col-([0-9])/.exec(p);
        if (match) {
          // column number is in match[1]
          var colnr = parseInt(match[1], 10);
          var colname = columns[colnr].key;
          if (editableKeys.contains(colname)){
            this.contentValueKey = colname; // this will allow editing the right field
            this._$label = label;
          }
        }
      }
    }

    return this._$label;
  },


  /*
    Configures the editor to overlay the label properly.
  */
  inlineEditorWillBeginEditing: function (editor, editable, value) {
    var content   = this.get('content'),
        del       = this.get('displayDelegate'),
        labelKey  = this.getDelegateProperty('contentValueKey', del),
        el        = this.$label(),
        columns   = del.get('columns'),
        validator = this.get('validator'),
        f, v, offset, fontSize, top, lineHeight, escapeHTML,
        lineHeightShift, targetLineHeight;

    v = (labelKey && content) ? (content.get ? content.get(labelKey) : content[labelKey]) : content;

    f = this.computeFrameWithParentFrame(null);

    // if the label has a large line height, try to adjust it to something
    // more reasonable so that it looks right when we show the popup editor.
    lineHeight = this._oldLineHeight = el.css('lineHeight');
    fontSize = el.css('fontSize');
    top = this.$().css('top');

    if (top) top = parseInt(top.substring(0, top.length - 2), 0);
    else top = 0;

    lineHeightShift = 0;

    if (fontSize && lineHeight) {
      targetLineHeight = fontSize * 1.5;
      if (targetLineHeight < lineHeight) {
        el.css({ lineHeight: '1.5' });
        lineHeightShift = (lineHeight - targetLineHeight) / 2;
      } else this._oldLineHeight = null;
    }

    // find cell offset. can perhaps be done quicker in a normal for loop.
    var cellOffset = 0;
    columns.find(function (c) {
      if (c.get('key') === labelKey) return c;
      else {
        cellOffset += c.get('width');
      }
    });
    el = el[0];
    offset = SC.offset(el);
    f.x = cellOffset; // difference with list item view, set the x to be the cell offset
    f.y = offset.y + top + lineHeightShift;
    f.height = el.offsetHeight;
    f.width = el.offsetWidth;

    escapeHTML = this.get('escapeHTML');

    editor.set({
      value: v,
      exampleFrame: f,
      exampleElement: el,
      multiline: NO,
      validator: validator,
      escapeHTML: escapeHTML
    });
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




