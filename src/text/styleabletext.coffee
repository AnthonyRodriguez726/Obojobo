ChunkStyleList = require './chunkstylelist'
StyleRange = require './stylerange'

StyleType = require './styletype'


# ceiling Infinity end values to the length
trimStyleRange = (styleRange, maxLength) ->
	styleRange.end = Math.min styleRange.end, maxLength
	styleRange

class StyleableText
	constructor: (text = '') ->
		@setText text

	init: ->
		@styleList = new ChunkStyleList
		@value = ''

	clone: ->
		clone = new StyleableText
		clone.value = @value
		clone.styleList = @styleList.clone()

		clone

	# getSlice: (start, end) ->
	# 	clone = @clone()
	# 	clone.deleteText end, clone.length
	# 	clone.deleteText 0, start

	# 	clone

	getExportedObject: ->
		value: @value
		styleList: @styleList.getExportedObject()

	setText: (text) ->
		@init()
		@insertText(0, text)

	replaceText: (from, to, text) ->
		return @deleteText(from, to) if not text? or text.length is 0

		# Goal: The replaced text should adopt the styles of where the range starts.
		# The following combination of commands achieves what we want
		@insertText from + 1, text
		@styleList.normalize()
		@deleteText from, from + 1
		@styleList.normalize()
		@deleteText from + text.length, to + text.length - 1
		@styleList.normalize()

	appendText: (text) ->
		@value += text #@TODO - does this handle styles ok?

	insertText: (atIndex, text) ->
		console.log 'st.insertText', atIndex, text

		insertLength = text.length

		for range in @styleList.styles
			console.log 'comparision=', range.compareToRange(atIndex)
			switch range.compareToRange atIndex
				when StyleRange.CONTAINS
					range.end += insertLength

				# when StyleRange.CONTAINS_EDGE
				# 	if allowStyleBleed
				# 		range.end += insertLength

				when StyleRange.AFTER
					range.start += insertLength
					range.end += insertLength

		@value = @value.substring(0, atIndex) + text + @value.substring(atIndex)

		@styleList.normalize()

	deleteText: (from, to) ->
		return if from > to

		from = Math.max 0, from
		to = Math.min to, @value.length

		deleteLength = to - from

		for range in @styleList.styles
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

		@value = @value.substring(0, from) + @value.substring(to)

		@styleList.normalize()

	toggleStyleText: (from, to, styleType, styleData) ->
		styleRange = trimStyleRange new StyleRange(from, to, styleType, styleData), @value.length
		if @styleList.rangeHasStyle from, Math.min(to, @value.length), styleType
			@styleList.remove styleRange
		else
			@styleList.add styleRange

		@styleList.normalize()

	styleText: (from, to, styleType, styleData) ->
		styleRange = trimStyleRange new StyleRange(from, to, styleType, styleData), @value.length
		@styleList.add styleRange
		@styleList.normalize()

	unstyleText: (from, to, styleType, styleData) ->
		styleRange = trimStyleRange new StyleRange(from, to, styleType, styleData), @value.length
		@styleList.remove styleRange
		@styleList.normalize()

	getStyles: (from, to) ->
		@styleList.getStylesInRange from, to

	split: (atIndex) ->
		return null if isNaN(atIndex)

		sibling = @clone()

		@deleteText atIndex, @value.length

		sibling.deleteText 0, atIndex

		sibling

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
		console.log 'merge', @, otherText, atIndex
		@__debug_print()

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

		@__debug_print()

		for range in otherText.styleList.styles
			curRange = range.clone()
			curRange.start += atIndex
			curRange.end   += atIndex

			@styleList.add curRange

		@styleList.normalize()

		@__debug_print()

	__debug_print: ->
		console.log '   |          |' + @value + '|'
		fill = ''
		for i in [0..@value.length + 10]
			fill += ' '

		j = 0
		for style in @styleList.styles
			s1 = (style.type + '          ').substr(0, 10) + '|'
			s2 = ''
			for i in [0...style.start]
				s2 += '·'
			for i in [style.start...style.end]
				s2 += '='
			for i in [style.end...fill.length]
				s2 += '·'
			console.log (j + '   ').substr(0, 3) + '|' + (s1 + s2 + fill).substr(0, fill.length) + '|' + JSON.stringify(style.data) # + '|' + style.__debug
			j++


Object.defineProperties StyleableText.prototype,
	"length":
		get: -> @value.length


StyleableText.createFromObject = (o) ->
	st = new StyleableText
	st.styleList = ChunkStyleList.createFromObject o.styleList
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


module.exports = StyleableText