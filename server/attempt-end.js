let DraftModel = oboRequire('models/draft')
let Assessment = require('./assessment')
let AssessmentRubric = require('./assessment-rubric')
let createCaliperEvent = oboRequire('routes/api/events/create_caliper_event') //@TODO
let insertEvent = oboRequire('insert_event')
let lti = oboRequire('lti')
let logger = oboRequire('logger')
let attemptStart = require('./attempt-start')
const QUESTION_NODE_TYPE = 'ObojoboDraft.Chunks.Question'

let endAttempt = (req, res, user, attemptId, isPreviewing) => {
	let attempt
	let attemptHistory
	let calculatedScores
	let assessmentScoreId
	let tree

	logger.info(`End attempt "${attemptId}" begin for user "${user.id}" (Preview="${isPreviewing}")`)

	return getAttempt(attemptId, isPreviewing)
		.then(attemptResult => {
			logger.info(`End attempt "${attemptId}" - getAttempt success`)

			attempt = attemptResult
			return DraftModel.fetchById(attempt.draftId)
		})
		.then(draftTree => {
			tree = draftTree
			return Assessment.getCompletedAssessmentAttemptHistory(
				user.id,
				attempt.draftId,
				attempt.assessmentId,
				isPreviewing
			)
		})
		.then(attemptHistoryResult => {
			logger.info(`End attempt "${attemptId}" - getAttemptHistory success`)

			attemptHistory = attemptHistoryResult
			return getResponsesForAttempt(attemptId)
		})
		.then(responsesForAttemptResult => {
			logger.info(`End attempt "${attemptId}" - getResponsesForAttempt success`)

			return getCalculatedScores(
				req,
				res,
				attempt.assessmentModel,
				attempt.attemptState,
				attemptHistory,
				responsesForAttemptResult
			)
		})
		.then(calculatedScoresResult => {
			//
			// Update attempt and send event
			//
			logger.info(`End attempt "${attemptId}" - getCalculatedScores success`)

			calculatedScores = calculatedScoresResult

			return completeAttempt(
				attempt.assessmentId,
				attemptId,
				user.id,
				attempt.draftId,
				calculatedScores,
				isPreviewing
			)
		})
		.then(completeAttemptResult => {
			logger.info(`End attempt "${attemptId}" - completeAttempt success`)

			assessmentScoreId = completeAttemptResult.assessmentScoreId

			return reloadAttemptStateIfReviewing(
				attemptId,
				attempt.draftId,
				attempt,
				tree,
				user,
				isPreviewing,
				attemptHistory
			)
		})
		.then(() => {
			return insertAttemptEndEvents(
				user,
				attempt.draftId,
				attempt.assessmentId,
				attemptId,
				attempt.number,
				isPreviewing,
				req.hostname,
				req.connection.remoteAddress
			)
		})
		.then(() => {
			//
			// Send LTI score and send event
			//
			logger.info(`End attempt "${attemptId}" - insertAttemptEndEvent success`)

			return lti.sendHighestAssessmentScore(user.id, attempt.draftId, attempt.assessmentId)
		})
		.then(ltiRequestResult => {
			logger.info(`End attempt "${attemptId}" - sendLTIScore was executed`)

			insertAttemptScoredEvents(
				user,
				attempt.draftId,
				attempt.assessmentId,
				assessmentScoreId,
				attemptId,
				attempt.number,
				calculatedScores.attempt.attemptScore,
				calculatedScores.assessmentScoreDetails.assessmentModdedScore,
				isPreviewing,
				ltiRequestResult.scoreSent,
				ltiRequestResult.status,
				ltiRequestResult.statusDetails,
				ltiRequestResult.gradebookStatus,
				ltiRequestResult.ltiAssessmentScoreId,
				req.hostname,
				req.connection.remoteAddress,
				calculatedScores.assessmentScoreDetails
			)
		})
		.then(() =>
			Assessment.getAttempts(user.id, attempt.draftId, isPreviewing, attempt.assessmentId)
		)
}

let getAttempt = (attemptId, isPreviewing) => {
	let result

	return Assessment.getAttempt(attemptId)
		.then(selectResult => {
			result = selectResult
			return Assessment.getAttemptNumber(result.user_id, result.draft_id, attemptId, isPreviewing)
		})
		.then(attemptNumber => {
			result.attemptNumber = attemptNumber
			return DraftModel.fetchById(result.draft_id)
		})
		.then(draftModel => ({
			assessmentId: result.assessment_id,
			number: result.attemptNumber,
			attemptState: result.state,
			draftId: result.draft_id,
			model: draftModel,
			assessmentModel: draftModel.getChildNodeById(result.assessment_id)
		}))
}

let getResponsesForAttempt = (userId, draftId) => Assessment.getResponsesForAttempt(userId, draftId)

let getCalculatedScores = (
	req,
	res,
	assessmentModel,
	attemptState,
	attemptHistory,
	responseHistory
) => {
	let scoreInfo = {
		scores: [0],
		questions: attemptState.questions,
		scoresByQuestionId: {}
	}

	let promises = assessmentModel.yell(
		'ObojoboDraft.Sections.Assessment:attemptEnd',
		req,
		res,
		assessmentModel,
		responseHistory,
		{
			getQuestions: () => scoreInfo.questions,
			addScore: (questionId, score) => {
				scoreInfo.scores.push(score)
				scoreInfo.scoresByQuestionId[questionId] = score
			}
		}
	)

	return Promise.all(promises).then(() =>
		calculateScores(assessmentModel, attemptHistory, scoreInfo)
	)
}

let calculateScores = (assessmentModel, attemptHistory, scoreInfo) => {
	let questionScores = scoreInfo.questions.map(question => ({
		id: question.id,
		score: scoreInfo.scoresByQuestionId[question.id] || 0
	}))

	let attemptScore = scoreInfo.scores.reduce((a, b) => a + b) / scoreInfo.questions.length

	let allScores = attemptHistory
		.map(attempt => parseFloat(attempt.result.attemptScore))
		.concat(attemptScore)

	let numAttempts =
		typeof assessmentModel.node.content.attempts === 'undefined' ||
		assessmentModel.node.content.attempts === 'unlimited'
			? Infinity
			: parseInt(assessmentModel.node.content.attempts, 10)

	let rubric = new AssessmentRubric(assessmentModel.node.content.rubric)
	let assessmentScoreDetails = rubric.getAssessmentScoreInfoForAttempt(numAttempts, allScores)

	return {
		attempt: {
			attemptScore,
			questionScores
		},
		assessmentScoreDetails
	}
}

let completeAttempt = (assessmentId, attemptId, userId, draftId, calculatedScores, preview) =>
	Assessment.completeAttempt(
		assessmentId,
		attemptId,
		userId,
		draftId,
		calculatedScores.attempt,
		calculatedScores.assessmentScoreDetails,
		preview
	)

let insertAttemptEndEvents = (
	user,
	draftId,
	assessmentId,
	attemptId,
	attemptNumber,
	isPreviewing,
	hostname,
	remoteAddress
) => {
	let { createAssessmentAttemptSubmittedEvent } = createCaliperEvent(null, hostname)
	return insertEvent({
		action: 'assessment:attemptEnd',
		actorTime: new Date().toISOString(),
		payload: {
			attemptId,
			attemptCount: attemptNumber
		},
		userId: user.id,
		ip: remoteAddress,
		metadata: {},
		draftId: draftId,
		eventVersion: '1.1.0',
		caliperPayload: createAssessmentAttemptSubmittedEvent({
			actor: { type: 'user', id: user.id },
			draftId,
			assessmentId,
			attemptId
		})
	})
}

let insertAttemptScoredEvents = (
	user,
	draftId,
	assessmentId,
	assessmentScoreId,
	attemptId,
	attemptNumber,
	attemptScore,
	assessmentScore,
	isPreviewing,
	ltiScoreSent,
	ltiScoreStatus,
	ltiStatusDetails,
	ltiGradeBookStatus,
	ltiAssessmentScoreId,
	hostname,
	remoteAddress,
	scoreDetails
) => {
	let { createAssessmentAttemptScoredEvent } = createCaliperEvent(null, hostname)

	return lti
		.getLatestHighestAssessmentScoreRecord(user.id, draftId, assessmentId)
		.then(highestAssessmentScoreRecord => {
			return insertEvent({
				action: 'assessment:attemptScored',
				actorTime: new Date().toISOString(),
				payload: {
					attemptId,
					attemptCount: attemptNumber,
					attemptScore,
					assessmentScore,
					highestAssessmentScore: highestAssessmentScoreRecord.score,
					ltiScoreSent,
					ltiScoreStatus,
					ltiStatusDetails,
					ltiGradeBookStatus,
					assessmentScoreId,
					ltiAssessmentScoreId,
					scoreDetails
				},
				userId: user.id,
				ip: remoteAddress,
				metadata: {},
				draftId: draftId,
				eventVersion: '2.0.0',
				caliperPayload: createAssessmentAttemptScoredEvent({
					actor: { type: 'serverApp' },
					draftId,
					assessmentId,
					attemptId,
					attemptScore,
					extensions: {
						attemptCount: attemptNumber,
						attemptScore,
						assessmentScore,
						highestAssessmentScore: highestAssessmentScoreRecord.score,
						ltiScoreSent
					}
				})
			})
		})
}

let reloadAttemptStateIfReviewing = (
	attemptId,
	draftId,
	attempt,
	tree,
	user,
	isPreviewing,
	attemptHistory
) => {
	let assessmentNode = attempt.assessmentModel

	// Do not reload the state if reviews are never allowed
	if (assessmentNode.node.content.review == 'never') {
		return null
	}

	let isLastAttempt = attempt.number == assessmentNode.node.content.attempts

	// Do not reload the state if reviews are only allowed after the last
	// attempt and this is not the last attempt
	if (assessmentNode.node.content.review == 'no-attempts-remaining' && !isLastAttempt) {
		return null
	}

	let assessmentProperties = loadAssessmentProperties(
		tree,
		attempt,
		user,
		isPreviewing,
		attemptHistory
	)

	let state = attemptStart.getState(assessmentProperties)
	// Not ideal, but attempt-start needs this as a recursive structure to send
	// client promises
	state.questions = state.questions.map(q => q.toObject())

	// If reviews are always allowed, reload the state for this attempt
	// Each attempt's state will be reloaded as it finishes
	if (assessmentNode.node.content.review == 'always') {
		return Assessment.updateAttemptState(attemptId, state)
	}

	// If reviews are allowed after last attempt and this is the last attempt,
	// reload the states for all attempts
	if (assessmentNode.node.content.review == 'no-attempts-remaining' && isLastAttempt) {
		// Reload state for all previous attempts
		return Assessment.getAttempts(
			assessmentProperties.user.id,
			draftId,
			isPreviewing,
			assessmentProperties.id
		).then(result => {
			result.attempts.map(attempt => {
				attempt.state.qb = recreateChosenQuestionTree(
					attempt.state.qb,
					assessmentProperties.draftTree
				)

				let newQuestions = []
				logger.info('inside')

				attempt.state.questions.map(question => {
					newQuestions.push(getNodeQuestion(question.id, assessmentProperties.draftTree))
				})

				attempt.state.questions = newQuestions

				Assessment.updateAttemptState(attempt.attemptId, attempt.state)
			})
		})
	}

	logger.info(`Error: Reached exceptional state while reloading state for ${attemptId}`)
	return null
}

let recreateChosenQuestionTree = (node, assessmentNode) => {
	if (node.type === QUESTION_NODE_TYPE) {
		return getNodeQuestion(node.id, assessmentNode)
	}

	let newChildren = []

	for (let child of node.children) {
		newChildren.push(recreateChosenQuestionTree(child, assessmentNode))
	}

	node.children = newChildren
	return node
}
// Pulls down a single question from the draft
let getNodeQuestion = (nodeId, assessmentNode) => {
	return assessmentNode.getChildNodeById(nodeId).toObject()
}

// Pulls assessment properties out of the promise flow
let loadAssessmentProperties = (draftTree, attempt, user, isPreviewing, attemptHistory) => {
	const assessmentNode = draftTree.getChildNodeById(attempt.assessmentId)

	return {
		user,
		isPreviewing,
		draftTree,
		id: attempt.assessmentId,
		oboNode: assessmentNode,
		nodeChildrenIds: assessmentNode.children[1].childrenSet,
		assessmentQBTree: assessmentNode.children[1].toObject(),
		attemptHistory,
		numAttemptsTaken: null,
		childrenMap: null
	}
}

module.exports = {
	endAttempt,
	getAttempt,
	getResponsesForAttempt,
	getCalculatedScores,
	calculateScores,
	completeAttempt,
	insertAttemptEndEvents,
	sendLTIHighestAssessmentScore: lti.sendHighestAssessmentScore,
	insertAttemptScoredEvents,
	reloadAttemptStateIfReviewing,
	recreateChosenQuestionTree,
	getNodeQuestion,
	loadAssessmentProperties
}
