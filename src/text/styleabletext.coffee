ObjectAssign = require 'object-assign'

ChunkStyleList = require './chunkstylelist'
StyleRange = require './stylerange'

StyleType = require './styletype'


# ceiling Infinity end values to the length
trimStyleRange = (styleRange, maxLength) ->
	# if maxLength is 0
	# 	styleRange.start = -1
	# 	styleRange.end = -1
	# 	return styleRange

	styleRange.end = Math.min styleRange.end, maxLength
	styleRange


class StyleableText
	constructor: (text = '') ->
		@init()
		@insertText(0, text)

	init: ->
		@styleList = new ChunkStyleList
		@value = ''

	clone: ->
		clone = new StyleableText
		clone.value = @value
		clone.styleList = @styleList.clone()

		clone

	getExportedObject: ->
		value: @value
		styleList: @styleList.getExportedObject()

	replaceText: (from, to, text) ->
		return @deleteText(from, to) if not text? or text.length is 0

		# Goal: The replaced text should adopt the styles of where the range starts.
		# The following combination of commands achieves what we want
		@insertText from + 1, text
		@normalizeStyles()
		@deleteText from, from + 1
		@normalizeStyles()
		@deleteText from + text.length, to + text.length - 1
		@normalizeStyles()

	appendText: (text) ->
		@value += text #@TODO - does this handle styles ok?

	insertText: (atIndex, text) ->
		# console.log 'st.insertText', atIndex, text

		# console.log 'before'
		# @__debug_print()

		insertLength = text.length

		for range in @styleList.styles
			# console.log 'comparision=', range.compareToRange(atIndex)
			switch range.compareToRange atIndex
				when StyleRange.CONTAINS
					range.end += insertLength

				# when StyleRange.CONTAINS_EDGE
				# 	if allowStyleBleed
				# 		range.end += insertLength

				when StyleRange.AFTER
					range.start += insertLength
					range.end += insertLength

		# apply initial styles to new text
		# if @length is 0 and @initialStyles.length() > 0
		# 	for range in @initialStyles.styles
		# 		range.start = 0
		# 		range.end = insertLength
		# 		@styleList.add range

		@value = @value.substring(0, atIndex) + text + @value.substring(atIndex)

		@normalizeStyles()

		# console.log 'after'
		# @__debug_print()

	deleteText: (from, to) ->
		return if from > to

		from = Math.max 0, from
		to = Math.min to, @value.length

		deleteLength = to - from

		# if to is @value.length
		# 	lastCharStyles = @styleList.getStylesInRange @value.length - 1, @value.length

		# console.log 'delete text'
		for range in @styleList.styles
			# console.log 'looking at', range
			# console.log range.toString()
			# console.log range, range.compareToRange(from, to)
			switch range.compareToRange from, to
				when StyleRange.CONTAINS
					range.end -= deleteLength

				when StyleRange.INSIDE_LEFT
					range.end = from

				when StyleRange.ENSCAPSULATED_BY
					range.invalidate()

				when StyleRange.INSIDE_RIGHT
					range.start = from
					range.end -= deleteLength

				when StyleRange.AFTER
					range.start -= deleteLength
					range.end -= deleteLength

			# console.log 'after'
			# console.log range.toString()

		@value = @value.substring(0, from) + @value.substring(to)

		# if lastCharStyles
		# 	for style of lastCharStyles
		# 		@initialStyles.add new StyleRange(0, 0, style)

		@normalizeStyles()

	toggleStyleText: (from, to, styleType, styleData) ->
		styleRange = trimStyleRange new StyleRange(from, to, styleType, styleData), @value.length
		if @styleList.rangeHasStyle from, Math.min(to, @value.length), styleType
			@styleList.remove styleRange
		else
			@styleList.add styleRange

		@normalizeStyles()

	styleText: (from, to, styleType, styleData) ->
		# console.log 'styleText', from, to, styleType, styleData
		# console.log 'styleText before'
		# @__debug_print()

		range = new StyleRange(from, to, styleType, styleData)

		# console.log range

		styleRange = trimStyleRange range, @value.length

		# console.log styleRange
		@styleList.add styleRange

		# console.log 'style text middle'
		# @__debug_print()

		@normalizeStyles()

		# console.log 'style text after'
		# @__debug_print()

	unstyleText: (from, to, styleType, styleData) ->
		# console.log 'unstyleText'
		# console.log 'before'
		# @__debug_print()

		styleRange = trimStyleRange new StyleRange(from, to, styleType, styleData), @value.length
		@styleList.remove styleRange
		@normalizeStyles()

		# console.log 'afTER'
		# @__debug_print()

	getStyles: (from, to) ->
		@styleList.getStylesInRange(from, to)

	split: (atIndex) ->
		# console.log 'ST.split', atIndex
		return null if isNaN(atIndex)

		splitAtEnd = atIndex is @value.length

		sibling = @clone()

		@deleteText atIndex, @value.length

		# console.log 'before'
		# sibling.__debug_print()

		sibling.deleteText 0, atIndex

		# special case - if splitting at the end of a line
		# we want to shove the last character styles as
		# initial styles into the new sibling.
		if splitAtEnd
			lastCharStyles = @styleList.getStylesInRange @value.length - 1, @value.length
			for style of lastCharStyles
				sibling.styleText 0, 0, style #@TODO - what about data?

		# console.log 'after'
		# sibling.__debug_print()

		# sibling.styleList.normalize()

		# console.log 'after2'
		# sibling.__debug_print()

		sibling

	normalizeStyles: ->
		# console.log 'normalizeStyles', @length, @initialStyles.length()
		# if @length isnt 0 and @initialStyles.length() > 0
		# 	@initialStyles.clear()

		# if @length is 0 and @styleList.length() > 0
		# 	@styleList.clear()
		# else
		@styleList.normalize()

	# mergeOld: (otherText, atIndex = null) ->
	# 	if prependText
	# 		textLength = otherText.length
	# 		@value = otherText.value + @value

	# 		for range in @styleList.styles
	# 			range.start += textLength
	# 			range.end   += textLength

	# 		for range in otherText.styleList.styles
	# 			@styleList.add range.clone()
	# 	else
	# 		textLength = @value.length
	# 		@value += otherText.value

	# 		for range in otherText.styleList.styles
	# 			curStyle = range.clone()
	# 			curStyle.start += textLength
	# 			curStyle.end   += textLength

	# 			@styleList.add curStyle

	# 	@styleList.normalize()

	merge: (otherText, atIndex = null) ->
		# console.clear()
		# console.log 'merge', @, otherText, atIndex
		# @__debug_print()

		atIndex ?= @value.length

		# @insertText atIndex, otherText.value
		insertLength = otherText.value.length

		for range in @styleList.styles
			switch range.compareToRange atIndex
				when StyleRange.AFTER
					range.start += insertLength
					range.end += insertLength

		@value = @value.substring(0, atIndex) + otherText.value + @value.substring(atIndex)

		@styleList.normalize()

		# @__debug_print()

		for range in otherText.styleList.styles
			curRange = range.clone()
			curRange.start += atIndex
			curRange.end   += atIndex

			@styleList.add curRange

		@styleList.normalize()

		# @__debug_print()

	__debug_print: ->
		console.log '   |          |' + @value + ' |'
		fill = ''
		for i in [0..@value.length + 10]
			fill += ' '

		j = 0
		for style in @styleList.styles
			s1 = (style.type + '          ').substr(0, 10) + '|'
			s2 = ''
			for i in [0...style.start]
				s2 += '·'
			s2 += '<'
			for i in [style.start+1...style.end]
				s2 += '='
			s2 += '>'
			for i in [style.end+1...fill.length]
				s2 += '·'
			console.log (j + '   ').substr(0, 3) + '|' + (s1 + s2 + fill).substr(0, fill.length + 1) + '|' + style.start + ',' + style.end + '|' + JSON.stringify(style.data) # + '|' + style.__debug
			j++


Object.defineProperties StyleableText.prototype,
	"length":
		get: -> @value.length


StyleableText.createFromObject = (o) ->
	st = new StyleableText
	st.styleList = ChunkStyleList.createFromObject o.styleList
	# st.initialStyles = ChunkStyleList.createFromObject o.initialStyles
	st.value = o.value

	st

StyleableText.getStylesOfElement = (el) ->
	console.warn 'MOVE THIS SOMEWHERE ELSE!!!!'

	return [] if el.nodeType isnt Node.ELEMENT_NODE

	styles = []

	computedStyle = window.getComputedStyle el

	#console.log '___________', el, computedStyle, computedStyle.getPropertyValue('font-weight')

	switch computedStyle.getPropertyValue 'font-weight'
		when "bold", "bolder", "700", "800", "900" then styles.push { type:StyleType.BOLD }

	switch computedStyle.getPropertyValue 'text-decoration'
		when "line-through" then styles.push { type:StyleType.STRIKETHROUGH }

	switch computedStyle.getPropertyValue 'font-style'
		when "italic" then styles.push { type:StyleType.ITALIC }

	switch computedStyle.getPropertyValue('font-family').toLowerCase()
		when "monospace" then styles.push { type:StyleType.MONOSPACE }

	# switch computedStyle.getPropertyValue('vertical-align') + "|" + computedStyle.getPropertyValue('font-size')
	# 	when "super|smaller" then styles.push { type:StyleType.SUPERSCRIPT }
	# 	when "sub|smaller"   then styles.push { type:StyleType.SUBSCRIPT }

	switch el.tagName.toLowerCase()
		#when 'b'               then styles.push { type:StyleType.BOLD }
		when 'a'               then styles.push { type:StyleType.LINK, data:el.getAttribute('href') }
		when 'q'               then styles.push { type:StyleType.QUOTE, data:el.getAttribute('cite') }
		#@TODO:
		# when 'abbr', 'acronym' then styles.push { type:StyleType.COMMENT, data:el.getAttribute('title') }
		when 'sup'             then styles.push { type:StyleType.SUPERSCRIPT, data:1 }
		when 'sub'             then styles.push { type:StyleType.SUPERSCRIPT, data:-1 }
		# @TODO:
		# when 'span'
		# 	if el.classList.contains('comment') and el.hasAttribute('data-additional')
		# 		styles.push { type:StyleType.COMMENT, data:el.getAttribute('data-additional') }

	styles

StyleableText.createFromElement = (node) ->
	console.warn '@TODO - MOVE THIS method somewhere else!'
	# console.log 'ST.CFE', arguments
	#console.log 'StyleableText.createFromElement', node.outerHTML

	#if node.nodeType is Node.ELEMENT_NODE then node.setAttribute('data-read', '1');

	if not arguments[1]?
		st = new StyleableText
		StyleableText.createFromElement node, st

		#console.log 'complete:'
		#st.__debug_print()
		st.styleList.normalize()
		#console.log 'post normalize:'
		#st.__debug_print()
		return st

	st = arguments[1]
	switch node.nodeType
		when Node.TEXT_NODE
			# console.log 'text node', node.nodeValue
			st.value += node.nodeValue
		when Node.ELEMENT_NODE
			if node.tagName.toLowerCase() is 'br'
				st.value += "\n"
			else
				styles = StyleableText.getStylesOfElement node
				ranges = []
				for style in styles
					#console.log '  creating a new range for', node.outerHTML, style
					styleRange = new StyleRange st.value.length, Infinity, style.type, style.data
					#styleRange.__debug = node.outerHTML
					ranges.push styleRange

				for childNode in node.childNodes
					StyleableText.createFromElement childNode, st

				for range in ranges
					range.end = st.value.length
					st.styleList.add range

# StyleableText.createFromElementOld = (node) ->
# 	if not arguments[1]?
# 		st = new StyleableText
# 		StyleableText.createFromElement node, st
# 		st.styleList.normalize()
# 		return st

# 	st = arguments[1]
# 	switch node.nodeType
# 		when Node.TEXT_NODE
# 			st.value += node.nodeValue
# 		when Node.ELEMENT_NODE
# 			if node.tagName.toLowerCase() is 'br'
# 				st.value += "\n"
# 			else
# 				styleData = StyleRenderer.getStyleDataOfElement node
# 				if styleData?
# 					styleRange = new StyleRange st.value.length, Infinity, styleData.type, styleData.data

# 				for childNode in node.childNodes
# 					StyleableText.createFromElement childNode, st

# 				if styleRange?
# 					styleRange.end = st.value.length
# 					st.styleList.add styleRange


window.st = StyleableText.createFromObject {
	"value": "fHeyggItalhgeyAfggfsNffD BOLDasdHey this is boldHey this is fasfdf",
	"styleList": [
		{
			"type": "b",
			"start": 1,
			"end": 4,
			"data": {}
		},
		{
			"type": "b",
			"start": 10,
			"end": 29,
			"data": {}
		},
		{
			"type": "b",
			"start": 31,
			"end": 60,
			"data": {}
		},
		{
			"type": "i",
			"start": 6,
			"end": 10,
			"data": {}
		},
		{
			"type": "i",
			"start": 14,
			"end": 22,
			"data": {}
		}
	]
}


module.exports = StyleableText