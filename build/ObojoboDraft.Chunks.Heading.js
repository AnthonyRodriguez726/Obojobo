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

	module.exports = __webpack_require__(113);


/***/ },

/***/ 111:
/***/ function(module, exports) {

	"use strict";

	var Adapter, Common, TextGroupAdapter;

	Common = window.ObojoboDraft.Common;

	TextGroupAdapter = Common.chunk.textChunk.TextGroupAdapter;

	Adapter = {
	  construct: function construct(model, attrs) {
	    var ref;
	    TextGroupAdapter.construct(model, attrs);
	    model.modelState.textGroup.maxItems = 1;
	    if (attrs != null ? (ref = attrs.content) != null ? ref.headingLevel : void 0 : void 0) {
	      return model.modelState.headingLevel = attrs.content.headingLevel;
	    } else {
	      return model.modelState.headingLevel = 1;
	    }
	  },
	  clone: function clone(model, _clone) {
	    TextGroupAdapter.clone(model, _clone);
	    return _clone.modelState.headingLevel = model.modelState.headingLevel;
	  },
	  toJSON: function toJSON(model, json) {
	    TextGroupAdapter.toJSON(model, json);
	    return json.content.headingLevel = model.modelState.headingLevel;
	  }
	};

	module.exports = Adapter;

/***/ },

/***/ 112:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Common, Heading, OboComponent, TextChunk, TextGroupEl;

	__webpack_require__(200);

	Common = window.ObojoboDraft.Common;

	OboComponent = Common.components.OboComponent;

	TextGroupEl = Common.chunk.textChunk.TextGroupEl;

	TextChunk = Common.chunk.TextChunk;

	Heading = React.createClass({
	  displayName: 'Heading',

	  render: function render() {
	    var data, inner;
	    data = this.props.model.modelState;
	    inner = React.createElement('h' + data.headingLevel, null, React.createElement(TextGroupEl, { text: data.textGroup.first.text, indent: data.textGroup.first.data.indent, groupIndex: '0' }));
	    return React.createElement(
	      OboComponent,
	      { model: this.props.model, moduleData: this.props.moduleData },
	      React.createElement(
	        TextChunk,
	        { className: 'obojobo-draft--chunks--heading pad' },
	        inner
	      )
	    );
	  }
	});

	module.exports = Heading;

/***/ },

/***/ 113:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var ObojoboDraft;

	ObojoboDraft = window.ObojoboDraft;

	OBO.register('ObojoboDraft.Chunks.Heading', {
	  type: 'chunk',
	  adapter: __webpack_require__(111),
	  componentClass: __webpack_require__(112),
	  selectionHandler: new ObojoboDraft.Common.chunk.textChunk.TextGroupSelectionHandler(),
	  getNavItem: function getNavItem(model) {
	    switch (model.modelState.headingLevel) {
	      case 2:
	        return {
	          type: 'sub-link',
	          label: model.modelState.textGroup.first.text.value,
	          path: [model.modelState.textGroup.first.text.value.toLowerCase().replace(/ /g, '-')],
	          showChildren: false
	        };
	      default:
	        return null;
	    }
	  }
	});

/***/ },

/***/ 200:
/***/ function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ }

/******/ });