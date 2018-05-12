let db = require('../db')
let draftNodeStore = oboRequire('draft_node_store')
let logger = require('../logger.js')

class Draft {
	constructor(rawDraft) {
		this.nodesById = new Map()
		this.nodesByType = new Map()
		this.root = this.processRawNode(rawDraft)
	}

	yell() {
		return Promise.all(this.root.yell.apply(this.root, arguments)).then(() => {
			return this
		})
	}

	processRawNode(rawNode) {
		let initFn = () => {}

		let draftClass = draftNodeStore.get(rawNode.type)

		let draftNode = new draftClass(this, rawNode, initFn)

		draftNode.init()

		this.nodesById.set(draftNode.node.id, draftNode)

		let nodesByType = this.nodesByType.get(rawNode.type)
		if (!nodesByType) nodesByType = []
		nodesByType.push(draftNode)
		this.nodesByType.set(rawNode.type, nodesByType)

		for (let i in rawNode.children) {
			let childNode = this.processRawNode(rawNode.children[i])
			draftNode.children.push(childNode)
		}

		return draftNode
	}

	static fetchById(id) {
		return db
			.one(
				`
			SELECT
				drafts.id AS id,
				drafts_content.id AS version,
				drafts.created_at AS draft_created_at,
				drafts_content.created_at AS content_created_at,
				drafts_content.content AS content
			FROM drafts
			JOIN drafts_content
				ON drafts.id = drafts_content.draft_id
			WHERE drafts.id = $[id]
				AND deleted = FALSE
			ORDER BY version DESC
			LIMIT 1
			`,
				{ id: id }
			)
			.then(result => {
				result.content.draftId = result.id
				result.content._rev = result.version
				return new Draft(result.content)
			})
			.catch(error => {
				logger.error('fetchById Error', error.message)
				return Promise.reject(error)
			})
	}

	static updateContent(draftId, jsonContent, xmlContent) {
		return db
			.one(
				`
				INSERT INTO drafts_content(
					draft_id,
					content,
					xml
				)
				VALUES(
					$[draftId],
					$[jsonContent],
					$[xmlContent]
				)
				RETURNING id
			`,
				{
					draftId,
					jsonContent,
					xmlContent
				}
			)
			.then(result => result.id)
	}

	get document() {
		return this.root.toObject()
	}

	getChildNodeById(id) {
		return this.nodesById.get(id)
	}

	getChildNodesByType(type) {
		return this.nodesByType.get(type)
	}
}

module.exports = Draft
