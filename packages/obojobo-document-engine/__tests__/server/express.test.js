jest.mock('../../server/attempt-start', () => ({ startAttempt: jest.fn() }))
jest.mock('../../server/attempt-end', () => ({
	endAttempt: jest.fn()
}))
jest.mock('../../server/assessment', () => ({
	getAttempt: jest.fn(),
	getAttempts: jest.fn()
}))
jest.mock('../../server/util')

const logAndRespondToUnexpected = require('../../server/util').logAndRespondToUnexpected

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
	const mockDocument = { draftId: 3, contentId: 12 }
	const Assessment = require('../../server/assessment')
	// build the req info
	let req
	let res

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
		req = {
			requireCurrentUser: jest.fn().mockResolvedValue(mockUser),
			requireCurrentDocument: jest.fn().mockResolvedValue(mockDocument),
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

		res = {
			success: jest.fn(),
			unexpected: jest.fn(),
			notAuthorized: jest.fn()
		}

		lti.getLTIStatesByAssessmentIdForUserAndDraft.mockReset()
		lti.sendHighestAssessmentScore.mockReset()
		db.manyOrNone.mockReset()
		db.none.mockReset()
		Assessment.getAttempt.mockRestore()
		Assessment.getAttempts.mockRestore()
		logger.error.mockReset()
		logAndRespondToUnexpected.mockReset()
	})
	afterEach(() => {})

	test('registers the expected routes', () => {
		expect.assertions(11)

		expect(server.get).toHaveBeenCalledTimes(4)
		expect(server.post).toHaveBeenCalledTimes(5)
		expect(server.delete).toHaveBeenCalledTimes(0)
		expect(server.put).toHaveBeenCalledTimes(0)
		expect(server.post).toBeCalledWith('/api/lti/sendAssessmentScore', expect.anything())
		expect(server.post).toBeCalledWith('/api/assessments/attempt/start', expect.anything())
		expect(server.post).toBeCalledWith(
			'/api/assessments/attempt/:attemptId/resume',
			expect.anything()
		)
		expect(server.post).toBeCalledWith('/api/assessments/attempt/:attemptId/end', expect.anything())
		expect(server.post).toBeCalledWith('/api/assessments/clear-preview-scores', expect.anything())
		expect(server.get).toBeCalledWith('/api/lti/state/draft/:draftId', expect.anything())
		expect(oboEvents.on).toBeCalledWith('client:question:setResponse', expect.anything())
	})

	test('/api/lti/state/draft/:draftId calls getLTIStatesByAssessmentIdForUserAndDraft', () => {
		expect.assertions(5)
		// grab a ref to expected route & verify it's the route we want
		const draftStateRoute = server.get.mock.calls[0]
		expect(draftStateRoute[0]).toBe('/api/lti/state/draft/:draftId')

		// mock result
		lti.getLTIStatesByAssessmentIdForUserAndDraft.mockReturnValueOnce('testresult')

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
		const sendAssessmentScoreRoute = server.post.mock.calls[0]
		expect(sendAssessmentScoreRoute[0]).toBe('/api/lti/sendAssessmentScore')

		// mock result
		lti.sendHighestAssessmentScore.mockReturnValueOnce({
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
			expect(lti.sendHighestAssessmentScore).toHaveBeenCalledWith(1, mockDocument, 777)
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

	test('/api/lti/sendAssessmentScore calls logAndRespondToUnexpected when error occurs', () => {
		expect.assertions(2)

		// grab a ref to expected route & verify it's the route we want
		const sendAssessmentScoreRoute = server.post.mock.calls[0]
		expect(sendAssessmentScoreRoute[0]).toBe('/api/lti/sendAssessmentScore')

		// mock result
		lti.sendHighestAssessmentScore.mockImplementationOnce(() => {
			throw new Error('mockUnexpectedError')
		})

		// execute
		return sendAssessmentScoreRoute[1](req, res, {}).then(() => {
			expect(logAndRespondToUnexpected).toHaveBeenCalledWith(
				'Unexpected error starting a new attempt',
				res,
				req,
				expect.any(Error)
			)
		})
	})

	test('/api/assessments/attempt/start calls startAttempt', () => {
		expect.assertions(2)

		// grab a ref to expected route & verify it's the route we want
		const startAttemptRoute = server.post.mock.calls[1]
		expect(startAttemptRoute[0]).toBe('/api/assessments/attempt/start')

		// execute
		startAttemptRoute[1](req, res, {})
		expect(startAttempt).toHaveBeenCalledWith(req, res)
	})

	test('/api/assessments/attempt/:attemptId/end calls endAttempt', () => {
		expect.assertions(5)

		// grab a ref to expected route & verify it's the route we want
		const endAttemptRoute = server.post.mock.calls[3]
		expect(endAttemptRoute[0]).toBe('/api/assessments/attempt/:attemptId/end')

		endAttempt.mockReturnValueOnce(Promise.resolve('endAttemptResult'))

		// execute
		return endAttemptRoute[1](req, res, {}).then(() => {
			expect(req.requireCurrentUser).toHaveBeenCalled()
			expect(endAttempt).toHaveBeenCalledWith(req, res, mockUser, mockDocument, 5, false)
			expect(res.success).toHaveBeenCalledTimes(1)
			expect(res.success).toHaveBeenCalledWith('endAttemptResult')
		})
	})

	test('/api/assessments/attempt/:attemptId/end calls logAndRespondToUnexpected when error occurs', () => {
		expect.assertions(2)

		// grab a ref to expected route & verify it's the route we want
		const endAttemptRoute = server.post.mock.calls[3]
		expect(endAttemptRoute[0]).toBe('/api/assessments/attempt/:attemptId/end')

		endAttempt.mockImplementationOnce(() => {
			throw new Error('mockUnexpectedError')
		})

		// execute
		return endAttemptRoute[1](req, res, {}).then(() => {
			expect(logAndRespondToUnexpected).toHaveBeenCalledWith(
				'Unexpected error completing your attempt',
				res,
				req,
				expect.any(Error)
			)
		})
	})

	test('/api/assessments/clear-preview-scores runs queries to empty preview score data', () => {
		expect.assertions(10)

		// visit is preview visit
		req.body.visitId = 'mockPreviewVisitId'

		Visit.fetchById.mockReturnValueOnce({ is_preview: true })

		// grab a ref to expected route & verify it's the route we want
		const clearPreviewScoresRoute = server.post.mock.calls[4]
		expect(clearPreviewScoresRoute[0]).toBe('/api/assessments/clear-preview-scores')

		db.manyOrNone
			.mockReturnValueOnce(Promise.resolve([{ id: 13 }])) // assessmentScoreIdsResult
			.mockReturnValueOnce(Promise.resolve([14])) // attemptIdsResult

		// execute
		return clearPreviewScoresRoute[1](req, res, {}).then(() => {
			expect(req.requireCurrentUser).toHaveBeenCalled()
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

	test('/api/assessments/clear-preview-scores runs nothing with no data', () => {
		expect.assertions(8)
		Visit.fetchById.mockReturnValueOnce({ is_preview: true })

		// grab a ref to expected route & verify it's the route we want
		const clearPreviewScoresRoute = server.post.mock.calls[4]
		expect(clearPreviewScoresRoute[0]).toBe('/api/assessments/clear-preview-scores')

		db.manyOrNone
			.mockReturnValueOnce(Promise.resolve([])) // assessmentScoreIdsResult
			.mockReturnValueOnce(Promise.resolve([])) // attemptIdsResult

		// execute
		return clearPreviewScoresRoute[1](req, res, {}).then(() => {
			expect(res.success).toHaveBeenCalledTimes(1)

			expect(db.manyOrNone).toHaveBeenCalledTimes(2)
			expect(db.none).toHaveBeenCalledTimes(2)
			expect(db.none).not.toHaveBeenCalledWith(
				expect.stringContaining('DELETE FROM attempts_question_responses'),
				expect.anything()
			)
			expect(db.none).not.toHaveBeenCalledWith(
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

	test('/api/assessments/clear-preview-scores tests previewing state', () => {
		// expect.assertions(8)

		// grab a ref to expected route & verify it's the route we want
		const clearPreviewScoresRoute = server.post.mock.calls[4]
		expect(clearPreviewScoresRoute[0]).toBe('/api/assessments/clear-preview-scores')

		// user that can't preview
		req.requireCurrentUser.mockResolvedValueOnce({ id: 1 })

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

	test('/api/assessments/clear-preview-scores calls logAndRespondToUnexpected when error occurs', () => {
		expect.assertions(2)
		Visit.fetchById.mockReturnValueOnce({ is_preview: true })

		// grab a ref to expected route & verify it's the route we want
		const clearPreviewScoresRoute = server.post.mock.calls[4]
		expect(clearPreviewScoresRoute[0]).toBe('/api/assessments/clear-preview-scores')

		db.manyOrNone.mockImplementationOnce(() => {
			throw new Error('mockUnexpectedError')
		})

		// execute
		return clearPreviewScoresRoute[1](req, res, {}).then(() => {
			expect(logAndRespondToUnexpected).toHaveBeenCalledWith(
				'Unexpected error clearing preview scores',
				res,
				req,
				expect.any(Error)
			)
		})
	})

	// end of useless

	test('/api/assessments/:draftId/:assessmentId/attempt/:attemptId calls getAttempt', () => {
		expect.assertions(5)

		// grab a ref to expected route & verify it's the route we want
		const getAttemptRoute = server.get.mock.calls[1]
		expect(getAttemptRoute[0]).toBe('/api/assessments/:draftId/:assessmentId/attempt/:attemptId')

		Assessment.getAttempt.mockResolvedValueOnce('attempt')

		// execute
		return getAttemptRoute[1](req, res, {}).then(() => {
			expect(req.requireCurrentUser).toHaveBeenCalled()
			expect(res.success).toHaveBeenCalledTimes(1)
			expect(res.success).toHaveBeenCalledWith('attempt')
			expect(Assessment.getAttempt).toHaveBeenCalledWith(1, 3, 999, 5)
		})
	})

	test('/api/assessments/:draftId/:assessmentId/attempt/:attemptId calls logAndRespondToUnexpected when error occurs', () => {
		expect.assertions(2)

		// grab a ref to expected route & verify it's the route we want
		const getAttemptRoute = server.get.mock.calls[1]
		expect(getAttemptRoute[0]).toBe('/api/assessments/:draftId/:assessmentId/attempt/:attemptId')

		Assessment.getAttempt.mockImplementationOnce(() => {
			throw new Error('mockUnexpectedError')
		})

		// execute
		return getAttemptRoute[1](req, res, {}).then(() => {
			expect(logAndRespondToUnexpected).toHaveBeenCalledWith(
				'Unexpected Error Loading attempt "${:attemptId}"',
				res,
				req,
				expect.any(Error)
			)
		})
	})

	test('/api/assessments/:draftId/attempts alls getAttempts', () => {
		expect.assertions(5)

		// grab a ref to expected route & verify it's the route we want
		const getAttemptsRoute = server.get.mock.calls[2]
		expect(getAttemptsRoute[0]).toBe('/api/assessments/:draftId/attempts')

		Assessment.getAttempts.mockResolvedValueOnce('attempts')

		// execute
		return getAttemptsRoute[1](req, res, {}).then(() => {
			expect(req.requireCurrentUser).toHaveBeenCalled()
			expect(res.success).toHaveBeenCalledTimes(1)
			expect(res.success).toHaveBeenCalledWith('attempts')
			expect(Assessment.getAttempts).toHaveBeenCalledWith(1, 3)
		})
	})

	test('/api/assessments/:draftId/attempts calls res.notAuthorized if not logged in', () => {
		expect.assertions(3)

		// grab a ref to expected route & verify it's the route we want
		const getAttemptsRoute = server.get.mock.calls[2]
		expect(getAttemptsRoute[0]).toBe('/api/assessments/:draftId/attempts')

		// No user found
		req.requireCurrentUser.mockRejectedValueOnce(new Error('Login Required'))

		// execute
		return getAttemptsRoute[1](req, res, {}).then(() => {
			expect(res.notAuthorized).toHaveBeenCalledTimes(1)
			expect(res.notAuthorized).toHaveBeenCalledWith('Login Required')
		})
	})

	test('/api/assessments/:draftId/attempts calls logAndRespondToUnexpected when an error occurs', () => {
		expect.assertions(2)

		// grab a ref to expected route & verify it's the route we want
		const getAttemptsRoute = server.get.mock.calls[2]
		expect(getAttemptsRoute[0]).toBe('/api/assessments/:draftId/attempts')

		Assessment.getAttempts.mockImplementationOnce(() => {
			throw new Error('mockUnexpectedError')
		})

		// execute
		return getAttemptsRoute[1](req, res, {}).then(() => {
			expect(logAndRespondToUnexpected).toHaveBeenCalledWith(
				'Unexpected error loading attempts',
				res,
				req,
				expect.any(Error)
			)
		})
	})

	test('/api/assessment/:draftId/:assessmentId/attempts for a given assessment returns attempts for that assessment', () => {
		expect.assertions(5)

		// grab a ref to expected route & verify it's the route we want
		const getAttemptsRoute = server.get.mock.calls[3]
		expect(getAttemptsRoute[0]).toBe('/api/assessment/:draftId/:assessmentId/attempts')

		Assessment.getAttempts.mockResolvedValueOnce('attempts')

		// execute
		return getAttemptsRoute[1](req, res, {}).then(() => {
			expect(req.requireCurrentUser).toHaveBeenCalled()
			expect(res.success).toHaveBeenCalledTimes(1)
			expect(res.success).toHaveBeenCalledWith('attempts')
			expect(Assessment.getAttempts).toHaveBeenCalledWith(1, 3, 999)
		})
	})

	test('/api/assessment/:draftId/:assessmentId/attempts calls res.notAuthorized if user not logged in', () => {
		expect.assertions(3)

		// grab a ref to expected route & verify it's the route we want
		const getAttemptsRoute = server.get.mock.calls[3]
		expect(getAttemptsRoute[0]).toBe('/api/assessment/:draftId/:assessmentId/attempts')

		// No user found
		req.requireCurrentUser.mockRejectedValueOnce(new Error('Login Required'))

		// execute
		return getAttemptsRoute[1](req, res, {}).then(() => {
			expect(res.notAuthorized).toHaveBeenCalledTimes(1)
			expect(res.notAuthorized).toHaveBeenCalledWith('Login Required')
		})
	})

	test('/api/assessment/:draftId/:assessmentId/attempts calls logAndRespondToUnexpected when an error occurs', () => {
		expect.assertions(2)

		// grab a ref to expected route & verify it's the route we want
		const getAttemptsRoute = server.get.mock.calls[3]
		expect(getAttemptsRoute[0]).toBe('/api/assessment/:draftId/:assessmentId/attempts')

		Assessment.getAttempts.mockImplementationOnce(() => {
			throw new Error('mockUnexpectedError')
		})

		// execute
		return getAttemptsRoute[1](req, res, {}).then(() => {
			expect(logAndRespondToUnexpected).toHaveBeenCalledWith(
				'Unexpected error loading attempts',
				res,
				req,
				expect.any(Error)
			)
		})
	})

	test('client:question:setResponse halts execution if no attemptId', () => {
		expect.assertions(3)

		const setResponseCallBack = oboEvents.on.mock.calls[0]
		expect(setResponseCallBack[0]).toBe('client:question:setResponse')
		const event = {
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

		const setResponseCallBack = oboEvents.on.mock.calls[0]
		expect(setResponseCallBack[0]).toBe('client:question:setResponse')
		const event = {
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

		const setResponseCallBack = oboEvents.on.mock.calls[0]
		expect(setResponseCallBack[0]).toBe('client:question:setResponse')
		const event = {
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

		const setResponseCallBack = oboEvents.on.mock.calls[0]
		expect(setResponseCallBack[0]).toBe('client:question:setResponse')
		const event = {
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
