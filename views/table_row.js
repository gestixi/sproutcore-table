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
        this.renderCheckbox(context, value, key);
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
          this.updateCheckbox($cell, value, key);
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
    var sources = this._tr_cbSources;
    if (sources) {
      this.get('contentCheckboxKey').forEach(function(k) {
        sources[k].destroy();
      });
      this._tr_cbSources = this._checkboxRenderDelegate = null;
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

  /** @private
    Adds a checkbox with the appropriate state to the content.  This method
    will only be called if the list item view is supposed to have a
    checkbox.

    @param {SC.RenderContext} context the render context
    @param {Boolean} state YES, NO or SC.MIXED_STATE
    @returns {void}
  */
  renderCheckbox: function (context, state, key) {
    var renderer = this.get('theme').checkboxRenderDelegate;

    // note: checkbox-view is really not the best thing to do here; we should do
    // sc-list-item-checkbox; however, themes expect something different, unfortunately.
    context = context.begin('div')
      .addClass('sc-checkbox-view')
      .addClass('sc-checkbox-view-for-' + key)
      .addClass(this.get('theme').classNames)
      .addClass(renderer.get('className'));

    var sources = this._tr_cbSources;
    if (!sources) {
      sources = this._tr_cbSources = {};
    }

    var source = sources[key];
    if (!source) {
      source = sources[key] = SC.Object.create({
        renderState: {},
        theme: this.get('theme')
      });
    }


    source
      .set('controlSize', SC.SMALL_CONTROL_SIZE)
      .set('isSelected', state && (state !== SC.MIXED_STATE))
      .set('isEnabled', this.get('isEnabled') && this.get('contentIsEditable'))
      .set('isActive', this._checkboxIsActive)
      .set('title', '');

    renderer.render(source, context);
    context = context.end();

    this._checkboxRenderDelegate = renderer;
  },


  updateCheckbox: function (jQuery, state, key) {
    var renderer = this.get('theme').checkboxRenderDelegate;

    var sources = this._tr_cbSources;
    var source = sources[key];
    source
      .set('controlSize', SC.SMALL_CONTROL_SIZE)
      .set('isSelected', state && (state !== SC.MIXED_STATE))
      .set('isEnabled', this.get('isEnabled') && this.get('contentIsEditable'))
      .set('isActive', this._checkboxIsActive)
      .set('title', '');

    renderer.update(source, jQuery.find('.sc-checkbox-view-for-' + key));

    this._checkboxRenderDelegate = renderer;
  },

  _isInsideCheckbox: function (evt) {
    var del = this.displayDelegate;
    var checkboxKey = this.getDelegateProperty('contentCheckboxKey', del);
    // should be an array as it is set that way through render and update

    return checkboxKey && checkboxKey.find(function (k) {
      return this._isInsideElementWithClassName('sc-checkbox-view-for-' + k, evt);
    }, this);
  },

  _addCheckboxActiveState: function (key) {
    if (this.get('isEnabled')) {
      if (this._checkboxRenderDelegate) {
        var sources = this._tr_cbSources;
        var source = sources[key];

        source.set('isActive', YES);

        this._checkboxRenderDelegate.update(source, this.$('.sc-checkbox-view-for-' +  key));
      } else {
        // for backwards-compatibility.
        this.$('.sc-checkbox-view-for-' + key).addClass('active');
      }
    }
  },

  _removeCheckboxActiveState: function () {
    var key = this._isMouseDownOnCheckboxFor;
    if (this._checkboxRenderer) {
      var sources = this._tr_cbSources;
      var source = sources[key];

      source.set('isActive', NO);

      this._checkboxRenderDelegate.update(source, this.$('.sc-checkbox-view-for-' + key));
    } else {
      // for backwards-compatibility.
      this.$('.sc-checkbox-view-for-' + key).removeClass('active');
    }
  },


  /** @private
    mouseDown is handled only for clicks on the checkbox view or or action
    button.
  */
  mouseDown: function (evt) {
    // Fast path, reject secondary clicks.
    if (evt.which && evt.which !== 1) return false;

    // if content is not editable, then always let collection view handle the
    // event.
    if (!this.get('contentIsEditable')) return NO;

    // if occurred inside checkbox, item view should handle the event.
    var inCheckboxForKey = this._isInsideCheckbox(evt);
    if (inCheckboxForKey) {
      this._addCheckboxActiveState(inCheckboxForKey);
      this._isMouseDownOnCheckbox = YES;
      this._isMouseInsideCheckbox = YES;
      this._isMouseDownOnCheckboxFor = inCheckboxForKey;
      return YES; // listItem should handle this event
    } else if (this._isInsideDisclosure(evt)) {
      this._addDisclosureActiveState();
      this._isMouseDownOnDisclosure = YES;
      this._isMouseInsideDisclosure = YES;
      return YES;
    } else if (this._isInsideRightIcon(evt)) {
      this._addRightIconActiveState();
      this._isMouseDownOnRightIcon = YES;
      this._isMouseInsideRightIcon = YES;
      return YES;
    }
    this.displayDidChange();
    return NO; // let the collection view handle this event
  },

  /** @private */
  mouseUp: function (evt) {
    var ret = NO;

    // if mouse was down in checkbox -- then handle mouse up, otherwise
    // allow parent view to handle event.
    if (this._isMouseDownOnCheckbox) {
      // update only if mouse inside on mouse up...
      var inCheckboxForKey = this._isInsideCheckbox(evt);
      if (inCheckboxForKey && inCheckboxForKey === this._isMouseDownOnCheckboxFor) {
        this.toggleCheckbox(inCheckboxForKey);
      }

      this._removeCheckboxActiveState();
      ret = YES;

    // if mouse as down on disclosure -- handle mouse up.  otherwise pass on
    // to parent.
    } else if (this._isMouseDownOnDisclosure) {
      if (this._isInsideDisclosure(evt)) {
        this.toggleDisclosure();
      }

      this._removeDisclosureActiveState();
      ret = YES;
    // if mouse was down in right icon -- then handle mouse up, otherwise
    // allow parent view to handle event.
    } else if (this._isMouseDownOnRightIcon) {
      this._removeRightIconActiveState();
      ret = YES;
    }

    // clear cached info
    this._isMouseInsideCheckbox = this._isMouseDownOnCheckbox = NO;
    this._isMouseDownOnDisclosure = this._isMouseInsideDisclosure = NO;
    this._isMouseInsideRightIcon = this._isMouseDownOnRightIcon = NO;
    // this._isMouseDownOnCheckboxFor = null;

    return ret;
  },

  /** @private */
  mouseMoved: function (evt) {
    return NO;
  },

  toggleCheckbox: function (key) {
    var content = this.get('content');
        //del = this.displayDelegate;

    if (content && content.get) {
        var value = content.get(key);

      value = (value === SC.MIXED_STATE) ? YES : !value;
      content.set(key, value); // update content

      this.displayDidChange(); // repaint view...
    }

  }

});




