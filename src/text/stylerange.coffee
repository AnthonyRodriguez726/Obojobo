StyleType = require './styletype'

class StyleRange
	constructor: (@start = 0, @end = 0, @type = '', @data = {}) ->

	clone: ->
		#@TODO - assumes 'data' is not an object (otherwise we should clone it)
		new StyleRange @start, @end, @type, @data

	getExportedObject: ->
		type:  @type
		start: @start
		end:   @end
		data:  @data

	toString: ->
		@type + ":" + @start + "," + @end + "(" + @data + ")"

	# Instead of deleting a range it might be more useful
	# to invalidate it now and delete it later
	invalidate: ->
		@start = @end = -1

	compareToRange: (from, to) ->
		to ?= from

		console.log 'compareToRange', from, to, @start, @end

		return StyleRange.AFTER            if to <= @start
		return StyleRange.BEFORE           if @end < from
		return StyleRange.CONTAINS         if @start <= from and to <= @end
		#return StyleRange.CONTAINS         if @start < from and to < @end
		#return StyleRange.CONTAINS_EDGE    if @start <= from and to <= @end
		return StyleRange.ENSCAPSULATED_BY if from <= @start and @end <= to
		return StyleRange.INSIDE_LEFT      if @start <= from
		return StyleRange.INSIDE_RIGHT

	length: ->
		@end - @start

	isMergeable: (otherType, otherData) ->
		return false if @type isnt otherType

		#return false if @type is StyleType.SUPERSCRIPT or @type is StyleType.SUBSCRIPT

		if @data instanceof Object
			for k, v of @data
				return false if not otherData[k]? or otherData[k] isnt v
		else
			return false if @data isnt otherData

		true



StyleRange.BEFORE           = 'before'
StyleRange.AFTER            = 'after'
StyleRange.INSIDE_LEFT      = 'left'
StyleRange.INSIDE_RIGHT     = 'right'
StyleRange.CONTAINS         = 'contains'
StyleRange.ENSCAPSULATED_BY = 'enscapsulatedBy'

StyleRange.createFromObject = (o) ->
	new StyleRange o.start, o.end, o.type, o.data


module.exports = StyleRange