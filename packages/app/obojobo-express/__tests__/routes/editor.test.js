jest.mock('../../db')
jest.unmock('fs') // need fs working for view rendering
jest.unmock('express') // we'll use supertest + express for this

// override requireCurrentUser for tests to provide our own user
let mockCurrentUser

// override requireCurrentDocument for tests to provide our own document
let mockCurrentDocument

jest.mock('../../express_current_user', () => (req, res, next) => {
	req.requireCurrentUser = () => {
		req.currentUser = mockCurrentUser
		return Promise.resolve(mockCurrentUser)
	}
	req.getCurrentUser = () => {
		req.currentUser = mockCurrentUser
		return Promise.resolve(mockCurrentUser)
	}
	next()
})

const mockDbDraft = (id, name) => ({
	draftId: id,
	xml: `xml-${name}`,
	createdAt: new Date(2018, 11, 24, 10, 33, 30, 0),
	content: {
		content: {
			title: `${name}-mock-title`
		}
	}
})

jest.mock('../../express_current_document', () => (req, res, next) => {
	req.requireCurrentDocument = () => {
		req.currentDocument = mockCurrentDocument
		return Promise.resolve(mockCurrentDocument)
	}
	next()
})

// setup express server
const db = oboRequire('db')
const request = require('supertest')
const express = require('express')
const app = express()
app.set('view engine', 'ejs')
app.set('views', __dirname + '/../../views/')
app.use(oboRequire('express_current_user'))
app.use(oboRequire('express_current_document'))
app.use('/', oboRequire('express_response_decorator'))
app.use('/', oboRequire('routes/editor'))

describe('editor route', () => {
	beforeEach(() => {
		db.any.mockReset()
		mockCurrentUser = { id: 99, canViewEditor: true } // should meet auth requirements
		mockCurrentDocument = {}
	})

	test('get editor_picker rejects users without canViewEditor permission', () => {
		expect.assertions(3)

		// mock the list of drafts
		db.any.mockResolvedValueOnce([])
		mockCurrentUser.canViewEditor = false

		return request(app)
			.get('/')
			.then(response => {
				expect(response.header['content-type']).toContain('text/html')
				expect(response.statusCode).toBe(401)
				expect(response.text).toContain('Not Authorized')
			})
	})

	test('get editor_picker returns the expected response', () => {
		expect.assertions(3)

		// mock the list of drafts
		db.any.mockResolvedValueOnce([])

		return request(app)
			.get('/')
			.then(response => {
				expect(response.header['content-type']).toContain('text/html')
				expect(response.statusCode).toBe(200)
				expect(response.text).toContain('Obojobo Editor')
			})
	})

	test('get editor/draftId returns the expected response', () => {
		expect.assertions(3)
		mockCurrentUser.isGuest = () => false

		// mock the list of drafts
		db.any.mockResolvedValueOnce([])

		return request(app)
			.get('/draft/mockId')
			.then(response => {
				expect(response.header['content-type']).toContain('text/html')
				expect(response.statusCode).toBe(200)
				expect(response.text).toContain('Obojobo Visual Editor')
			})
	})

	test('get editor/draftId rejects users without canViewEditor permission', () => {
		expect.assertions(3)
		mockCurrentUser = { id: 99, canViewEditor: false } // shouldn't meet auth requirements
		mockCurrentUser.isGuest = () => false
		return request(app)
			.get('/draft/mockId')
			.then(response => {
				expect(response.statusCode).toBe(401)
				expect(response.header['content-type']).toContain('text/html')
				expect(response.text).toBe('Not Authorized')
			})
	})

	test('post editor/draftId returns the expected response', () => {
		expect.assertions(3)
		mockCurrentUser.isGuest = () => false

		// mock the list of drafts
		db.any.mockResolvedValueOnce([])

		return request(app)
			.post('/draft/mockId')
			.then(response => {
				expect(response.header['content-type']).toContain('text/html')
				expect(response.statusCode).toBe(200)
				expect(response.text).toContain('Obojobo Visual Editor')
			})
	})
})
