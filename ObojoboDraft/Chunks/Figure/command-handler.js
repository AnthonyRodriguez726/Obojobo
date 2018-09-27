const { Editor } = window
import Common from 'Common'

const { TextGroupCommandHandler } = Editor.chunk.textChunk

let { TextGroupSelection } = Common.textGroup
let { Chunk } = Common.models

const _selectionInAnchor = function(selection, chunk) {
	const tgs = new TextGroupSelection(chunk, selection.virtual)
	const isInStart = tgs.start && tgs.start.groupIndex && tgs.start.groupIndex === 'anchor:main'
	const isInEnd = tgs.end && tgs.end.groupIndex && tgs.end.groupIndex === 'anchor:main'

	return isInStart || isInEnd
}

export default class CommandHandler extends TextGroupCommandHandler {
	_revert(chunk) {
		const newChunk = Chunk.create()
		chunk.addChildAfter(newChunk)
		newChunk.absorb(chunk)
		return newChunk
	}

	getCaretEdge(selection, chunk) {
		if (_selectionInAnchor(selection, chunk)) {
			return 'start'
		}
		return super.getCaretEdge(selection, chunk)
	}

	deleteText(selection, chunk, deleteForwards) {
		let tgs = new TextGroupSelection(chunk, selection.virtual)
		let s = tgs.start

		if (s.groupIndex === 'anchor:main') {
			chunk = this._revert(chunk)
			chunk.selectStart()

			if (chunk.prevSibling() && !deleteForwards) {
				chunk.prevSibling().selectEnd()
			}

			return true
		}

		if (!deleteForwards && s.isGroupStart) {
			chunk = this._revert(chunk)
			chunk.selectStart()
			return true
		}

		if (deleteForwards && s.isGroupEnd) {
			return false
		}

		return super.deleteText(selection, chunk, deleteForwards)
	}

	styleSelection(selection, chunk, styleType, styleData) {
		if (_selectionInAnchor(selection, chunk)) {
			return
		}
		return super.styleSelection(selection, chunk, styleType, styleData)
	}

	unstyleSelection(selection, chunk, styleType, styleData) {
		if (_selectionInAnchor(selection, chunk)) {
			return
		}
		return super.unstyleSelection(selection, chunk, styleType, styleData)
	}

	getSelectionStyles(selection, chunk) {
		if (_selectionInAnchor(selection, chunk)) {
			return
		}
		return super.getSelectionStyles(selection, chunk)
	}

	onEnter(selection, chunk, shiftKey) {
		if (_selectionInAnchor(selection, chunk)) {
			TextGroupSelection.setCaretToTextStart(chunk, 0, selection.virtual)
			chunk.splitText()
			chunk.selectEnd()
			return
		}

		return super.onEnter(selection, chunk, shiftKey)
	}

	split(selection, chunk) {
		if (_selectionInAnchor(selection, chunk)) {
			TextGroupSelection.setCaretToTextStart(chunk, 0, selection.virtual)
			chunk.splitText()
			chunk.selectAll()
			return
		}

		return super.split(selection, chunk)
	}

	splitText(selection, chunk) {
		if (_selectionInAnchor(selection, chunk)) {
			return
		}

		chunk.markDirty()

		let tgs = new TextGroupSelection(chunk, selection.virtual)

		let newText = tgs.start.text.split(tgs.start.offset)

		let newNode = Chunk.create() //@TODO - assumes it has a textGroup
		newNode.modelState.textGroup.first.text = newText
		chunk.addChildAfter(newNode)

		return newNode.selectStart()
	}

	paste(selection, chunk, text, html, chunks) {
		if (_selectionInAnchor(selection, chunk)) {
			chunk = this._revert(chunk)
			let pasteIntoChunk = Chunk.create()
			chunk.addChildBefore(pasteIntoChunk)
			pasteIntoChunk.selectAll()

			return pasteIntoChunk.paste(text, html, chunks)
		}

		return this.insertText(selection, chunk, text)
	}

	canMergeWith(selection, chunk, otherChunk) {
		return super.canMergeWith(selection, chunk, otherChunk) && chunk.nextSibling() === otherChunk
	}

	canRemoveSibling() {
		return false
	}

	onSelectAll(selection, chunk) {
		TextGroupSelection.selectText(chunk, 0, selection.virtual)
		return true
	}
}
