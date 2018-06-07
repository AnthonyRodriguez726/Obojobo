jest.mock('../../server/attempt-start', () => ({ startAttempt: jest.fn() }))
jest.mock('../../server/attempt-end', () => ({
	endAttempt: jest.fn().mockReturnValue(Promise.resolve('endAttemptResult'))
}))
jest.mock('../../server/assessment', () => ({
	getAttempt: jest.fn().mockReturnValue(Promise.resolve('attempt')),
	getAttempts: jest.fn().mockReturnValue(Promise.resolve('attempts'))
}))

jest.mock(
	'../../__mocks__/models/visit',
	() => ({
		fetchById: jest.fn().mockReturnValue({ is_preview: false })
	}),
	{ virtual: true }
)

describe('server/express', () => {
	const db = oboRequire('db')
	require('__mocks__/__mock_express')
	const mockUser = { id: 1 }
	const Assessment = require('../../server/assessment')
	// build the req info
	const req = {
		requireCurrentUser: jest.fn().mockReturnValue(Promise.resolve(mockUser)),
		params: {
			draftId: 3,
			attemptId: 5,
			assessmentId: 999
		},
		body: {
			draftId: 9,
			assessmentId: 777,
			visitId: 'mockVisitId'
		}
	}

	const res = {
		success: jest.fn(),
		unexpected: jest.fn(),
		notAuthorized: jest.fn()
	}

	const server = require('../../server/express')
	const lti = oboRequire('lti')
	const logger = oboRequire('logger')
	const oboEvents = oboRequire('obo_events')
	const startAttempt = require('../../server/attempt-start').startAttempt
	const endAttempt = require('../../server/attempt-end').endAttempt
	const Visit = oboRequire('models/visit')

	beforeAll(() => {})
	afterAll(() => {})
	beforeEach(() => {
		req.body.visitId = 'mockVisitId'
		req.requireCurrentUser.mockRestore()
		res.success.mockReset()
		res.unexpected.mockReset()
		res.notAuthorized.mockReset()
		lti.getLTIStatesByAssessmentIdForUserAndDraft.mockReset()
		lti.sendHighestAssessmentScore.mockReset()
		db.manyOrNone.mockReset()
		db.none.mockReset()
		Assessment.getAttempt.mockRestore()
		Assessment.getAttempts.mockRestore()
		logger.error.mockReset()
	})
	afterEach(() => {})

	test('registers the expected routes', () => {
		expect.assertions(10)

		expect(server.get).toHaveBeenCalledTimes(1)
		expect(server.post).toHaveBeenCalledTimes(4)
		expect(server.delete).toHaveBeenCalledTimes(0)
		expect(server.put).toHaveBeenCalledTimes(0)
		expect(server.post).toBeCalledWith('/api/lti/sendAssessmentScore', expect.anything())
		expect(server.post).toBeCalledWith('/api/assessments/attempt/start', expect.anything())
		expect(server.post).toBeCalledWith('/api/assessments/attempt/:attemptId/end', expect.anything())
		expect(server.post).toBeCalledWith('/api/assessments/clear-preview-scores', expect.anything())
		expect(server.get).toBeCalledWith('/api/lti/state/draft/:draftId', expect.anything())
		expect(oboEvents.on).toBeCalledWith('client:question:setResponse', expect.anything())
	})

	test('/api/lti/state/draft/:draftId calls getLTIStatesByAssessmentIdForUserAndDraft', () => {
		expect.assertions(5)
		// grab a ref to expected route & verify it's the route we want
		let draftStateRoute = server.get.mock.calls[0]
		expect(draftStateRoute[0]).toBe('/api/lti/state/draft/:draftId')

		// mock result
		lti.getLTIStatesByAssessmentIdForUserAndDraft.mockReturnValue('testresult')

		// execute
		return draftStateRoute[1](req, res, {}).then(() => {
			expect(req.requireCurrentUser).toHaveBeenCalled()
			// make sure the lti method is called
			expect(lti.getLTIStatesByAssessmentIdForUserAndDraft).toHaveBeenCalledWith(1, 3)
			// make sure the results are passed to res.success
			expect(res.success).toHaveBeenCalledTimes(1)
			expect(res.success).toHaveBeenCalledWith('testresult')
		})
	})

	test('/api/lti/sendAssessmentScore sends the highest assessment score and responds as expected', () => {
		expect.assertions(6)

		// grab a ref to expected route & verify it's the route we want
		let sendAssessmentScoreRoute = server.post.mock.calls[0]
		expect(sendAssessmentScoreRoute[0]).toBe('/api/lti/sendAssessmentScore')

		// mock result
		lti.sendHighestAssessmentScore.mockReturnValue({
			scoreSent: 1,
			status: 2,
			statusDetails: 3,
			dbStatus: 4,
			gradebookStatus: 5
		})

		// execute
		return sendAssessmentScoreRoute[1](req, res, {}).then(() => {
			expect(req.requireCurrentUser).toHaveBeenCalled()
			// make sure the lti method is called
			expect(lti.sendHighestAssessmentScore).toHaveBeenCalledWith(1, 9, 777)
			// make sure the results are passed to res.success
			expect(res.success).toHaveBeenCalledTimes(1)
			expect(res.success).toHaveBeenCalledWith({
				score: 1,
				status: 2,
				statusDetails: 3,
				dbStatus: 4,
				gradebookStatus: 5
			})
			// make sure it logs info
			expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('sendAssessmentScore'))
		})
	})

	test('start attempt route calls startAttempt', () => {
		expect.assertions(3)

		// grab a ref to expected route & verify it's the route we want
		let startAttemptRoute = server.post.mock.calls[1]
		expect(startAttemptRoute[0]).toBe('/api/assessments/attempt/start')

		// execute
		startAttemptRoute[1](req, res, {})
		expect(req.requireCurrentUser).toHaveBeenCalled()
		expect(startAttempt).toHaveBeenCalledWith(req, res)
	})

	test('end attempt route calls endAttempt', () => {
		expect.assertions(5)

		// grab a ref to expected route & verify it's the route we want
		let endAttemptRoute = server.post.mock.calls[2]
		expect(endAttemptRoute[0]).toBe('/api/assessments/attempt/:attemptId/end')

		// execute
		return endAttemptRoute[1](req, res, {}).then(() => {
			expect(req.requireCurrentUser).toHaveBeenCalled()
			expect(endAttempt).toHaveBeenCalledWith(req, res, mockUser, 5, false)
			expect(res.success).toHaveBeenCalledTimes(1)
			expect(res.success).toHaveBeenCalledWith('endAttemptResult')
		})
	})

	test('clear-preview-scores route runs queries to empty preview score data', () => {
		expect.assertions(11)

		// visit is preview visit
		req.body.visitId = 'mockPreviewVisitId'

		Visit.fetchById.mockReturnValueOnce({ is_preview: true })

		// grab a ref to expected route & verify it's the route we want
		let clearPreviewScoresRoute = server.post.mock.calls[3]
		expect(clearPreviewScoresRoute[0]).toBe('/api/assessments/clear-preview-scores')

		db.manyOrNone
			.mockReturnValueOnce(Promise.resolve([{ id: 13 }])) // assessmentScoreIdsResult
			.mockReturnValueOnce(Promise.resolve([14])) // attemptIdsResult

		// execute
		return clearPreviewScoresRoute[1](req, res, {}).then(() => {
			expect(req.requireCurrentUser).toHaveBeenCalled()
			expect(endAttempt).toHaveBeenCalledWith(req, res, mockUser, 5, false)
			expect(res.success).toHaveBeenCalledTimes(1)
			expect(res.success).toHaveBeenCalledWith()

			expect(db.manyOrNone).toHaveBeenCalledTimes(2)
			expect(db.none).toHaveBeenCalledTimes(4)
			expect(db.none).toHaveBeenCalledWith(
				expect.stringContaining('DELETE FROM attempts_question_responses'),
				expect.anything()
			)
			expect(db.none).toHaveBeenCalledWith(
				expect.stringContaining('DELETE FROM lti_assessment_scores'),
				expect.anything()
			)
			expect(db.none).toHaveBeenCalledWith(
				expect.stringContaining('DELETE FROM assessment_scores'),
				expect.anything()
			)
			expect(db.none).toHaveBeenCalledWith(
				expect.stringContaining('DELETE FROM attempts'),
				expect.anything()
			)
		})
	})

	// visit is not preview mode so can't
	test('clear-preview-scores tests previewing state', () => {
		expect.assertions(8)

		// grab a ref to expected route & verify it's the route we want
		let clearPreviewScoresRoute = server.post.mock.calls[3]
		expect(clearPreviewScoresRoute[0]).toBe('/api/assessments/clear-preview-scores')

		// execute
		return clearPreviewScoresRoute[1](req, res, {}).then(() => {
			expect(req.requireCurrentUser).toHaveBeenCalled()
			expect(res.success).toHaveBeenCalledTimes(0)
			expect(res.unexpected).toHaveBeenCalledTimes(0)
			expect(db.manyOrNone).toHaveBeenCalledTimes(0)
			expect(db.none).toHaveBeenCalledTimes(0)
			expect(res.notAuthorized).toHaveBeenCalledTimes(1)
			expect(res.notAuthorized).toHaveBeenCalledWith('Not in preview mode')
		})
	})

	test('client:question:setResponse halts execution if no attemptId', () => {
		expect.assertions(3)

		let setResponseCallBack = oboEvents.on.mock.calls[0]
		expect(setResponseCallBack[0]).toBe('client:question:setResponse')
		let event = {
			payload: {
				questionId: 3,
				response: 'what'
			}
		}

		return setResponseCallBack[1](event, req).then(() => {
			expect(db.none).not.toHaveBeenCalled()
			expect(logger.error).not.toHaveBeenCalled()
		})
	})

	test('client:question:setResponse expects questionId', () => {
		expect.assertions(3)

		let setResponseCallBack = oboEvents.on.mock.calls[0]
		expect(setResponseCallBack[0]).toBe('client:question:setResponse')
		let event = {
			payload: {
				attemptId: 4,
				response: 'what'
			}
		}

		return setResponseCallBack[1](event, req).then(() => {
			expect(db.none).not.toHaveBeenCalled()
			expect(logger.error.mock.calls[0][4]).toBe('Missing Question ID')
		})
	})

	test('client:question:setResponse expects response', () => {
		expect.assertions(3)

		let setResponseCallBack = oboEvents.on.mock.calls[0]
		expect(setResponseCallBack[0]).toBe('client:question:setResponse')
		let event = {
			payload: {
				attemptId: 4,
				questionId: 3
			}
		}

		return setResponseCallBack[1](event, req).then(() => {
			expect(db.none).not.toHaveBeenCalled()
			expect(logger.error.mock.calls[0][4]).toBe('Missing Response')
		})
	})

	test('client:question:setResponse inserts into attempts_question_responses', () => {
		expect.assertions(2)

		let setResponseCallBack = oboEvents.on.mock.calls[0]
		expect(setResponseCallBack[0]).toBe('client:question:setResponse')
		let event = {
			payload: {
				attemptId: 4,
				questionId: 3,
				response: 'what'
			}
		}

		return setResponseCallBack[1](event, req).then(() => {
			expect(db.none).toHaveBeenCalledWith(
				expect.stringContaining('INSERT INTO attempts_question_responses'),
				expect.anything()
			)
		})
	})
})
