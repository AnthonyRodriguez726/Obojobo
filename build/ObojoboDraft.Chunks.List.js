/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "build/";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ({

/***/ 0:
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(120);


/***/ },

/***/ 60:
/***/ function(module, exports) {

	'use strict';

	var ListStyle, ListStyles, getDefaultBulletStyle, getStyleWithDefaults, orderedDefaultBulletStyles, unorderedDefaultBulletStyles;

	getDefaultBulletStyle = function getDefaultBulletStyle(indent, type) {
	  var defaults;
	  defaults = type === 'ordered' ? orderedDefaultBulletStyles : unorderedDefaultBulletStyles;
	  return defaults[indent % defaults.length];
	};

	getStyleWithDefaults = function getStyleWithDefaults(indent, defaultType, style) {
	  var styleWithDefaults;
	  if (style == null) {
	    style = null;
	  }
	  styleWithDefaults = new ListStyle();
	  styleWithDefaults.type = (style != null ? style.type : void 0) ? style.type : defaultType;
	  styleWithDefaults.start = (style != null ? style.start : void 0) ? style.start : 1;
	  styleWithDefaults.bulletStyle = (style != null ? style.bulletStyle : void 0) ? style.bulletStyle : getDefaultBulletStyle(indent, styleWithDefaults.type);
	  return styleWithDefaults;
	};

	ListStyle = function () {
	  function ListStyle(opts) {
	    if (opts == null) {
	      opts = {};
	    }
	    this.type = opts.type || null;
	    this.start = opts.start || null;
	    this.bulletStyle = opts.bulletStyle || null;
	  }

	  ListStyle.prototype.toDescriptor = function () {
	    return {
	      type: this.type || null,
	      start: this.start || null,
	      bulletStyle: this.bulletStyle || null
	    };
	  };

	  ListStyle.prototype.clone = function () {
	    return new ListStyle(this);
	  };

	  return ListStyle;
	}();

	ListStyles = function () {
	  function ListStyles(type) {
	    this.type = type;
	    this.styles = {};
	  }

	  ListStyles.prototype.init = function () {
	    this.type = ListStyles.TYPE_UNORDERED;
	    return this.styles = {};
	  };

	  ListStyles.prototype.set = function (indent, opts) {
	    return this.styles[indent] = new ListStyle(opts);
	  };

	  ListStyles.prototype.get = function (indent) {
	    return getStyleWithDefaults(indent, this.type, this.styles[indent]);
	  };

	  ListStyles.prototype.getSetStyles = function (indent) {
	    var style;
	    style = this.styles[indent];
	    if (!style) {
	      return new ListStyle();
	    }
	    return style;
	  };

	  ListStyles.prototype.toDescriptor = function () {
	    var desc, indent, ref, style;
	    desc = {
	      type: this.type,
	      indents: {}
	    };
	    ref = this.styles;
	    for (indent in ref) {
	      style = ref[indent];
	      desc.indents[indent] = style.toDescriptor();
	    }
	    return desc;
	  };

	  ListStyles.prototype.clone = function () {
	    var clone, indent, ref, style;
	    clone = new ListStyles(this.type);
	    ref = this.styles;
	    for (indent in ref) {
	      style = ref[indent];
	      clone.styles[indent] = style.clone();
	    }
	    return clone;
	  };

	  ListStyles.prototype.map = function (fn) {
	    var indent, ref, results, style;
	    ref = this.styles;
	    results = [];
	    for (indent in ref) {
	      style = ref[indent];
	      results.push(fn(style, indent));
	    }
	    return results;
	  };

	  return ListStyles;
	}();

	ListStyles.fromDescriptor = function (descriptor) {
	  var indent, ref, style, styles;
	  styles = new ListStyles(descriptor.type);
	  ref = descriptor.indents;
	  for (indent in ref) {
	    style = ref[indent];
	    styles.set(indent, style);
	  }
	  return styles;
	};

	ListStyles.TYPE_ORDERED = 'ordered';

	ListStyles.TYPE_UNORDERED = 'unordered';

	ListStyles.STYLE_FILLED_CIRCLE = 'disc';

	ListStyles.STYLE_HOLLOW_CIRCLE = 'circle';

	ListStyles.STYLE_SQUARE = 'square';

	ListStyles.STYLE_NUMERIC = 'decimal';

	ListStyles.STYLE_LEAD_ZERO_NUMERIC = 'decimal-leading-zero';

	ListStyles.STYLE_LOWERCASE_LETTER = 'lower-alpha';

	ListStyles.STYLE_UPPERCASE_LETTER = 'upper-alpha';

	ListStyles.STYLE_LOWERCASE_ROMAN = 'lower-roman';

	ListStyles.STYLE_UPPERCASE_ROMAN = 'upper-roman';

	unorderedDefaultBulletStyles = [ListStyles.STYLE_FILLED_CIRCLE, ListStyles.STYLE_HOLLOW_CIRCLE, ListStyles.STYLE_SQUARE];

	orderedDefaultBulletStyles = [ListStyles.STYLE_NUMERIC, ListStyles.STYLE_UPPERCASE_LETTER, ListStyles.STYLE_UPPERCASE_ROMAN, ListStyles.STYLE_LOWERCASE_LETTER, ListStyles.STYLE_LOWERCASE_ROMAN];

	module.exports = ListStyles;

/***/ },

/***/ 118:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Adapter, Common, ListStyles, TextGroup, TextGroupAdapter;

	ListStyles = __webpack_require__(60);

	Common = window.ObojoboDraft.Common;

	TextGroup = Common.textGroup.TextGroup;

	TextGroupAdapter = Common.chunk.textChunk.TextGroupAdapter;

	Adapter = {
	  construct: function construct(model, attrs) {
	    var ref;
	    TextGroupAdapter.construct(model, attrs);
	    if ((attrs != null ? (ref = attrs.content) != null ? ref.listStyles : void 0 : void 0) != null) {
	      return model.modelState.listStyles = ListStyles.fromDescriptor(attrs.content.listStyles);
	    } else {
	      return model.modelState.listStyles = new ListStyles('unordered');
	    }
	  },
	  clone: function clone(model, _clone) {
	    TextGroupAdapter.clone(model, _clone);
	    return _clone.modelState.listStyles = model.modelState.listStyles.clone();
	  },
	  toJSON: function toJSON(model, json) {
	    TextGroupAdapter.toJSON(model, json);
	    return json.content.listStyles = model.modelState.listStyles.toDescriptor();
	  },
	  toText: function toText(model) {
	    var i, len, ref, text, textItem;
	    console.log('@TODO - List toText method');
	    text = '';
	    ref = model.modelState.textGroup.items;
	    for (i = 0, len = ref.length; i < len; i++) {
	      textItem = ref[i];
	      text += '  * ' + textItem.text.value + "\n";
	    }
	    return text;
	  }
	};

	module.exports = Adapter;

/***/ },

/***/ 119:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Chunk, Common, List, ListStyles, MockElement, MockTextNode, OboComponent, SelectionHandler, TextChunk, TextGroup, TextGroupEl, selectionHandler;

	__webpack_require__(204);

	ListStyles = __webpack_require__(60);

	Common = window.ObojoboDraft.Common;

	TextGroup = Common.textGroup.TextGroup;

	TextGroupEl = Common.chunk.textChunk.TextGroupEl;

	Chunk = Common.models.Chunk;

	MockElement = Common.mockDOM.MockElement;

	MockTextNode = Common.mockDOM.MockTextNode;

	TextChunk = Common.chunk.TextChunk;

	SelectionHandler = Common.chunk.textChunk.TextGroupSelectionHandler;

	OboComponent = Common.components.OboComponent;

	selectionHandler = new SelectionHandler();

	List = React.createClass({
	  displayName: 'List',

	  createMockListElement: function createMockListElement(data, indentLevel) {
	    var el, style, tag;
	    style = data.listStyles.get(indentLevel);
	    tag = style.type === 'unordered' ? 'ul' : 'ol';
	    el = new MockElement(tag);
	    el.start = style.start;
	    el._listStyleType = style.bulletStyle;
	    return el;
	  },
	  addItemToList: function addItemToList(ul, li, lis) {
	    ul.addChild(li);
	    li.listStyleType = ul._listStyleType;
	    return lis.push(li);
	  },
	  render: function render() {
	    var curIndentLevel, curIndex, curUl, data, i, item, itemIndex, j, len, len1, li, lis, newLi, newUl, ref, ref1, ref2, ref3, ref4, ref5, ref6, rootUl, text, texts;
	    window.yeOldListHandler = List.commandHandler;
	    window.yeOldListChunk = this.props.model;
	    data = this.props.model.modelState;
	    texts = data.textGroup;
	    curIndentLevel = 0;
	    curIndex = 0;
	    rootUl = curUl = this.createMockListElement(data, curIndentLevel);
	    lis = [];
	    li = new MockElement('li');
	    this.addItemToList(curUl, li, lis);
	    ref = texts.items;
	    for (itemIndex = i = 0, len = ref.length; i < len; itemIndex = ++i) {
	      item = ref[itemIndex];
	      if (item.data.indent < curIndentLevel) {
	        while (curIndentLevel > item.data.indent) {
	          curUl = curUl.parent.parent;
	          curIndentLevel--;
	        }
	      } else if (item.data.indent > curIndentLevel) {
	        while (curIndentLevel < item.data.indent) {
	          curIndentLevel++;
	          if (((ref1 = curUl.lastChild.lastChild) != null ? ref1.type : void 0) !== 'ul' && ((ref2 = curUl.lastChild.lastChild) != null ? ref2.type : void 0) !== 'ol') {
	            newUl = this.createMockListElement(data, curIndentLevel);
	            newLi = new MockElement('li');
	            this.addItemToList(newUl, newLi, lis);
	            curUl.lastChild.addChild(newUl);
	            curUl = newUl;
	          } else {
	            curUl = curUl.lastChild.lastChild;
	          }
	        }
	      }
	      if (!(((ref3 = curUl.lastChild) != null ? ref3.type : void 0) === 'li') || ((ref4 = curUl.lastChild) != null ? ref4.lastChild : void 0) != null) {
	        li = new MockElement('li');
	        this.addItemToList(curUl, li, lis);
	      }
	      text = new MockTextNode(item.text);
	      text.index = curIndex;
	      curIndex++;
	      curUl.lastChild.addChild(text);
	    }
	    for (j = 0, len1 = lis.length; j < len1; j++) {
	      li = lis[j];
	      if (((ref5 = li.children) != null ? (ref6 = ref5[0]) != null ? ref6.nodeType : void 0 : void 0) !== 'text') {
	        li.listStyleType = 'none';
	      }
	    }
	    return React.createElement(
	      OboComponent,
	      { model: this.props.model, moduleData: this.props.moduleData },
	      React.createElement(
	        TextChunk,
	        { className: 'obojobo-draft--chunks--list pad' },
	        React.createElement(
	          'div',
	          { 'data-indent': data.indent },
	          this.renderEl(rootUl, 0, 0)
	        )
	      )
	    );
	  },
	  renderEl: function renderEl(node, index, indent) {
	    var key;
	    key = this.props.model.cid + '-' + indent + '-' + index;
	    switch (node.nodeType) {
	      case 'text':
	        return React.createElement(TextGroupEl, { text: node.text, key: key, groupIndex: node.index });
	      case 'element':
	        return React.createElement(node.type, {
	          key: key,
	          start: node.start,
	          style: {
	            listStyleType: node.listStyleType
	          }
	        }, this.renderChildren(node.children, indent + 1));
	    }
	  },
	  renderChildren: function renderChildren(children, indent) {
	    var child, els, i, index, len;
	    els = [];
	    for (index = i = 0, len = children.length; i < len; index = ++i) {
	      child = children[index];
	      els.push(this.renderEl(child, index, indent));
	    }
	    return els;
	  }
	});

	module.exports = List;

/***/ },

/***/ 120:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var ObojoboDraft;

	ObojoboDraft = window.ObojoboDraft;

	OBO.register('ObojoboDraft.Chunks.List', {
	  type: 'chunk',
	  adapter: __webpack_require__(118),
	  componentClass: __webpack_require__(119),
	  selectionHandler: new ObojoboDraft.Common.chunk.textChunk.TextGroupSelectionHandler()
	});

/***/ },

/***/ 204:
/***/ function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ }

/******/ });