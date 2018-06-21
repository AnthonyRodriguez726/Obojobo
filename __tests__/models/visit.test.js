jest.mock('../../db')
jest.mock('../../logger')

import Visit from '../../models/visit'

const db = oboRequire('db')

describe('Visit Model', () => {
	beforeEach(() => {
		jest.resetAllMocks()
	})

	test('constructor builds expected values', () => {
		let visit = new Visit({ mockKey: 'mockValue', mockSecond: 'mockVal' })

		expect(visit).toHaveProperty('mockKey', 'mockValue')
		expect(visit).toHaveProperty('mockSecond', 'mockVal')
	})

	test('fetchById calls database and returns visit', () => {
		db.one.mockResolvedValueOnce({
			is_active: true,
			is_preview: true,
			draft_content_id: 'mockContentId'
		})

		Visit.fetchById('mockVisitId').then(result => {
			expect(result).toEqual({
				is_active: true,
				is_preview: true,
				draft_content_id: 'mockContentId'
			})
		})
	})

	test('fetchById logs errors', () => {
		db.one.mockRejectedValueOnce(new Error('mockError'))

		Visit.fetchById('mockVisitId').then(result => {
			expect(logger.error).toHaveBeenCalledWith('Visit fetchById Error', 'mockError')
			expect(result).toEqual('mockError')
		})
	})

	test('createVisit updates and inserts visit with expected values', () => {
		expect.assertions(4)

		db.manyOrNone.mockResolvedValueOnce([{ id: 'deactivated-visit-id' }])
		db.one
			.mockResolvedValueOnce({ id: 'mocked-draft-content-id' })
			.mockResolvedValueOnce({ id: 'resulting-visit-id' })

		return Visit.createVisit('user-id', 'draft-id', 'resource-link-id', 'launch-id').then(
			result => {
				expect(db.manyOrNone.mock.calls[0][1]).toEqual({
					draftId: 'draft-id',
					userId: 'user-id'
				})
				expect(db.one.mock.calls[0][1]).toEqual({
					draftId: 'draft-id'
				})
				expect(db.one.mock.calls[1][1]).toEqual({
					draftId: 'draft-id',
					draftContentId: 'mocked-draft-content-id',
					userId: 'user-id',
					resourceLinkId: 'resource-link-id',
					launchId: 'launch-id',
					isPreview: false
				})
				expect(result).toEqual({
					visitId: 'resulting-visit-id',
					deactivatedVisitIds: ['deactivated-visit-id']
				})
			}
		)
	})

	test('createPreviewVisit updates and inserts with expected values', () => {
		expect.assertions(4)

		db.manyOrNone.mockResolvedValueOnce([
			{ id: 'deactivated-visit-id' },
			{ id: 'deactivated-visit-id2' }
		])
		db.one
			.mockResolvedValueOnce({ id: 'mocked-draft-content-id' })
			.mockResolvedValueOnce({ id: 'resulting-visit-id' })

		return Visit.createPreviewVisit('user-id', 'draft-id').then(result => {
			expect(db.manyOrNone.mock.calls[0][1]).toEqual({
				draftId: 'draft-id',
				userId: 'user-id'
			})
			expect(db.one.mock.calls[0][1]).toEqual({
				draftId: 'draft-id'
			})
			expect(db.one.mock.calls[1][1]).toEqual({
				draftId: 'draft-id',
				draftContentId: 'mocked-draft-content-id',
				userId: 'user-id',
				resourceLinkId: null,
				launchId: null,
				isPreview: true
			})
			expect(result).toEqual({
				visitId: 'resulting-visit-id',
				deactivatedVisitIds: ['deactivated-visit-id', 'deactivated-visit-id2']
			})
		})
	})

	test('createPreviewVisit activates with no previous visit', () => {
		expect.assertions(4)

		db.manyOrNone.mockResolvedValueOnce(null)
		db.one
			.mockResolvedValueOnce({ id: 'mocked-draft-content-id' })
			.mockResolvedValueOnce({ id: 'resulting-visit-id' })

		return Visit.createPreviewVisit('user-id', 'draft-id').then(result => {
			expect(db.manyOrNone.mock.calls[0][1]).toEqual({
				draftId: 'draft-id',
				userId: 'user-id'
			})
			expect(db.one.mock.calls[0][1]).toEqual({
				draftId: 'draft-id'
			})
			expect(db.one.mock.calls[1][1]).toEqual({
				draftId: 'draft-id',
				draftContentId: 'mocked-draft-content-id',
				userId: 'user-id',
				resourceLinkId: null,
				launchId: null,
				isPreview: true
			})
			expect(result).toEqual({
				visitId: 'resulting-visit-id',
				deactivatedVisitIds: null
			})
		})
	})
})
