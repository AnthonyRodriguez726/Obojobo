Selection = require '../../dom/selection'

class OboSelectionRect
	constructor: ->
		@type   = OboSelectionRect.TYPE_NONE
		@top    = 0
		@right  = 0
		@bottom = 0
		@left   = 0
		@width  = 0
		@height = 0


Object.defineProperties OboSelectionRect.prototype,
	"valid":
		get: -> @type isnt OboSelectionRect.TYPE_NONE


OboSelectionRect.TYPE_NONE = 'none'
OboSelectionRect.TYPE_CARET = 'caret'
OboSelectionRect.TYPE_SELECTION = 'selection'
OboSelectionRect.TYPE_CHUNKS = 'chunks'

OboSelectionRect.createFromSelection = ->
	rect = new OboSelectionRect()
	sel = new Selection()

	selType = sel.getType()

	return rect if selType is "none"

	clientRects = sel.getClientRects()

	rect.type = if selType is 'caret' then OboSelectionRect.TYPE_CARET else OboSelectionRect.TYPE_SELECTION
	rect.top = Infinity
	rect.right = -Infinity
	rect.bottom = -Infinity
	rect.left = Infinity

	for clientRect in clientRects
		rect.top    = Math.min rect.top, clientRect.top
		rect.right  = Math.max rect.right, clientRect.right
		rect.bottom = Math.max rect.bottom, clientRect.bottom
		rect.left   = Math.min rect.left, clientRect.left

	rect.width  = rect.right - rect.left
	rect.height = rect.bottom - rect.top

	rect

OboSelectionRect.createFromChunks = (chunks) ->
	rect = new OboSelectionRect()
	rect.type = OboSelectionRect.TYPE_CHUNKS
	rect.top = Infinity
	rect.right = -Infinity
	rect.bottom = -Infinity
	rect.left = Infinity

	for chunk in chunks
		chunkRect = chunk.getDomEl().getBoundingClientRect()

		rect.top    = Math.min rect.top, chunkRect.top
		rect.right  = Math.max rect.right, chunkRect.right
		rect.bottom = Math.max rect.bottom, chunkRect.bottom
		rect.left   = Math.min rect.left, chunkRect.left

	rect.width  = rect.right - rect.left
	rect.height = rect.bottom - rect.top

	rect


module.exports = OboSelectionRect