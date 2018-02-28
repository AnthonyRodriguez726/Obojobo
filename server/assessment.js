let DraftNode = oboRequire('models/draft_node')
let db = oboRequire('db')
let lti = oboRequire('lti')
let express = require('express')
let app = express()

class Assessment extends DraftNode {
	static getCompletedAssessmentAttemptHistory(
		userId,
		draftId,
		assessmentId,
		includePreviewAttempts
	) {
		let previewSql = includePreviewAttempts ? '' : 'AND preview = FALSE'

		return db.manyOrNone(
			`
				SELECT
					id AS "attemptId",
					created_at as "startTime",
					completed_at as "endTime",
					assessment_id as "assessmentId",
					state,
					result
				FROM attempts
				WHERE
					user_id = $[userId]
					AND draft_id = $[draftId]
					AND assessment_id = $[assessmentId]
					AND completed_at IS NOT NULL
					${previewSql}
				ORDER BY completed_at DESC`,
			{ userId: userId, draftId: draftId, assessmentId: assessmentId }
		)
	}

	static getNumberAttemptsTaken(userId, draftId, assessmentId) {
		return db
			.one(
				`
				SELECT
					COUNT(*)
				FROM attempts
				WHERE
					user_id = $[userId]
					AND draft_id = $[draftId]
					AND assessment_id = $[assessmentId]
					AND completed_at IS NOT NULL
					AND preview = false
			`,
				{ userId: userId, draftId: draftId, assessmentId: assessmentId }
			)
			.then(result => {
				return parseInt(result.count, 10)
			})
	}

	// @TODO: most things touching the db should end up in models. figure this out
	// @TODO: Remove this method (getAttempts should be used instead)
	// static getAttemptHistory(userId, draftId) {
	// 	return db.manyOrNone(
	// 		`
	// 			SELECT
	// 				id AS "attemptId",
	// 				created_at as "startTime",
	// 				completed_at as "endTime",
	// 				assessment_id as "assessmentId",
	// 				state,
	// 				result
	// 			FROM attempts
	// 			WHERE
	// 				user_id = $[userId]
	// 				AND draft_id = $[draftId]
	// 				AND preview = FALSE
	// 			ORDER BY completed_at DESC`,
	// 		{ userId: userId, draftId: draftId }
	// 	)
	// }

	static createAttemptResponse(userId, draftId, attempt) {
		return {
			userId: userId,
			draftId: draftId,
			attemptId: attempt.attempt_id,
			assessmentScoreId: attempt.assessment_score_id,
			attemptNumber: parseInt(attempt.attempt_number, 10),
			assessmentId: attempt.assessment_id,
			startTime: attempt.created_at,
			finishTime: attempt.completed_at,
			isFinished: attempt.completed_at !== null,
			state: attempt.state,
			questionScores: attempt.result ? attempt.result.questionScores : [],
			responses: {},
			attemptScore: attempt.result ? attempt.result.attemptScore : null,
			assessmentScore: parseInt(attempt.assessment_score, 10),
			assessmentScoreDetails: attempt.score_details //,
			// ltiState: {
			// 	score: attempt.score_sent,
			// 	status: attempt.status,
			// 	statusDetails: attempt.status_details
			// }
		}
	}

	static getAttempts(userId, draftId, optionalAssessmentId = null) {
		let assessments
		let assessmentsArr = []
		return db
			.manyOrNone(
				`
				SELECT
					ROW_NUMBER () OVER (
						PARTITION by ATT.assessment_id
						ORDER BY ATT.completed_at
					) AS "attempt_number",
					ATT.id AS "attempt_id",
					ATT.assessment_id,
					ATT.created_at,
					ATT.updated_at,
					ATT.completed_at,
					ATT.state,
					ATT.result,
					SCO.id AS "assessment_score_id",
					SCO.score AS "assessment_score",
					SCO.score_details AS "score_details"
				FROM attempts ATT
				LEFT JOIN assessment_scores SCO
				ON ATT.id = SCO.attempt_id
				WHERE
					ATT.user_id = $[userId]
					AND ATT.draft_id = $[draftId]
					${optionalAssessmentId !== null
						? "AND ATT.assessment_id = '" + optionalAssessmentId + "'"
						: ''}
				ORDER BY ATT.completed_at`,
				{
					userId,
					draftId
				}
			)
			.then(result => {
				assessments = {}

				result.forEach(attemptFromDb => {
					let attempt = Assessment.createAttemptResponse(userId, draftId, attemptFromDb)

					if (!assessments[attempt.assessmentId]) {
						assessments[attempt.assessmentId] = {
							assessmentId: attempt.assessmentId,
							attempts: []
						}
					}

					assessments[attempt.assessmentId].attempts.push(attempt)
				})

				return Assessment.getResponseHistory(userId, draftId)
			})
			.then(responseHistory => {
				for (let attemptId in responseHistory) {
					let responsesForAttempt = responseHistory[attemptId]

					responsesForAttempt.forEach(response => {
						let attemptForResponseIndex = assessments[response.assessment_id].attempts.findIndex(
							x => x.attemptId === response.attempt_id
						)
						assessments[response.assessment_id].attempts[attemptForResponseIndex].responses[
							response.question_id
						] =
							response.response
					})
				}

				for (let assessmentId in assessments) {
					assessmentsArr.push(assessments[assessmentId])
				}

				// if (optionalAssessmentId !== null) {
				// 	if (assessmentsArr.length > 0) {
				// 		return assessmentsArr[0]
				// 	} else {
				// 		return {
				// 			assessmentId: optionalAssessmentId,
				// 			attempts: []
				// 		}
				// 	}
				// }

				return assessmentsArr
			})
			.then(assessmentsArr => {
				return lti.getLTIStatesByAssessmentIdForUserAndDraft(userId, draftId, optionalAssessmentId)
			})
			.then(ltiStates => {
				assessmentsArr.forEach(assessmentItem => {
					let ltiState = ltiStates[assessmentItem.assessmentId]
					assessmentItem.ltiState = {
						scoreSent: ltiState.scoreSent,
						sentDate: ltiState.sentDate,
						status: ltiState.status,
						gradebookStatus: ltiState.gradebookStatus,
						statusDetails: ltiState.statusDetails
					}
				})

				if (optionalAssessmentId === null) {
					return assessmentsArr
				} else if (optionalAssessmentId !== null && assessmentsArr.length > 0) {
					return assessmentsArr[0]
				} else {
					return {
						assessmentId: optionalAssessmentId,
						attempts: [],
						ltiState: null
					}
				}
			})
	}

	static getAttemptIdsForUserForDraft(userId, draftId) {
		return db.manyOrNone(
			`
			SELECT
			ROW_NUMBER () OVER (
				PARTITION by assessment_id
			  ORDER BY completed_at
			) AS "attempt_number",
			id
			FROM attempts
			WHERE
				preview = FALSE
				AND user_id = $[userId]
			AND draft_id = $[draftId]
			ORDER BY completed_at
			`,
			{ userId, draftId }
		)
	}

	static getAttemptNumber(userId, draftId, attemptId) {
		console.log('GAN', userId, draftId, attemptId)
		return Assessment.getAttemptIdsForUserForDraft(userId, draftId).then(attempts => {
			console.log('GAN attempts', attempts)
			for (let attempt of attempts) {
				if (attempt.id === attemptId) return attempt.attempt_number
			}

			return null
		})
	}

	static getAttempt(attemptId) {
		return db.oneOrNone(
			`
			SELECT *
			FROM attempts
			WHERE id = $[attemptId]
			`,
			{ attemptId }
		)
	}

	static getResponseHistory(userId, draftId) {
		return db
			.manyOrNone(
				`
				SELECT *
				FROM attempts_question_responses
				WHERE attempt_id IN (
					SELECT attempt_id
					FROM attempts
					WHERE user_id = $[userId]
					AND draft_id = $[draftId]
				) ORDER BY updated_at`,
				{ userId: userId, draftId: draftId }
			)
			.then(result => {
				let history = {}

				result.forEach(row => {
					if (!history[row.attempt_id]) history[row.attempt_id] = []
					history[row.attempt_id].push(row)
				})

				return history
			})
	}

	static getResponsesForAttempt(attemptId) {
		return db.manyOrNone(
			`
				SELECT *
				FROM attempts_question_responses
				WHERE attempt_id = $[attemptId]
				ORDER BY updated_at`,
			{ attemptId }
		)
	}

	static insertNewAttempt(userId, draftId, assessmentId, state, isPreview) {
		return db.one(
			`
				INSERT INTO attempts (user_id, draft_id, assessment_id, state, preview)
				VALUES($[userId], $[draftId], $[assessmentId], $[state], $[isPreview])
				RETURNING
				id AS "attemptId",
				created_at as "startTime",
				completed_at as "endTime",
				assessment_id as "assessmentId",
				state,
				result
			`,
			{
				userId: userId,
				draftId: draftId,
				assessmentId: assessmentId,
				state: state,
				isPreview: isPreview
			}
		)
	}

	static insertAssessmentScore(userId, draftId, assessmentId, launchId, score, isPreview) {
		return db.one(
			`
				INSERT INTO assessment_scores (user_id, draft_id, assessment_id, launch_id, score preview)
				VALUES($[userId], $[draftId], $[assessmentId], $[launchId], $[score], $[isPreview])
				RETURNING id
			`,
			{
				userId,
				draftId,
				assessmentId,
				launchId,
				score,
				isPreview
			}
		)
	}

	// @TODO: most things touching the db should end up in models. figure this out

	// Finish an attempt and write a new assessment score record
	static completeAttempt(
		assessmentId,
		attemptId,
		userId,
		draftId,
		attemptScoreResult,
		assessmentScoreDetails,
		preview
	) {
		console.log('INS', attemptScoreResult)
		return db
			.tx(t => {
				const q1 = db.one(
					`
					UPDATE attempts
					SET
						completed_at = now(),
						result = $[result]
					WHERE id = $[attemptId]
					RETURNING
						id AS "attemptId",
						created_at as "startTime",
						completed_at as "endTime",
						assessment_id as "assessmentId",
						state,
						result as "scores"
				`,
					{ result: attemptScoreResult, attemptId: attemptId }
				)

				const q2 = db.one(
					`
					INSERT INTO assessment_scores (user_id, draft_id, assessment_id, attempt_id, score, score_details, preview)
					VALUES($[userId], $[draftId], $[assessmentId], $[attemptId], $[score], $[scoreDetails], $[preview])
					RETURNING id
				`,
					{
						userId,
						draftId,
						assessmentId,
						attemptId,
						score: assessmentScoreDetails.assessmentModdedScore,
						scoreDetails: assessmentScoreDetails,
						preview
					}
				)

				return t.batch([q1, q2])
			})
			.then(result => {
				return {
					attemptData: result[0],
					assessmentScoreId: result[1].id
				}
			})
	}

	static insertNewAssessmentScore(userId, draftId, assessmentId, score, preview) {
		return db
			.one(
				`
				INSERT INTO assessment_scores (user_id, draft_id, assessment_id, score, preview)
				VALUES($[userId], $[draftId], $[assessmentId], $[score], $[preview])
				RETURNING id
			`,
				{
					userId,
					draftId,
					assessmentId,
					score,
					preview
				}
			)
			.then(result => result.id)
	}

	// static getHighestLatestAssessmentScoreRecord(userId, draftId, assessmentId) {
	// 	return db.oneOrNone(
	// 		`
	// 			SELECT *
	// 			FROM assessment_scores
	// 			WHERE
	// 				user_id = $[userId]
	// 				AND draft_id = $[draftId]
	// 				AND assessment_id = $[assessmentId]
	// 			ORDER BY created_at DESC
	// 			LIMIT 1
	// 		`,
	// 		{
	// 			userId,
	// 			draftId,
	// 			assessmentId
	// 		}
	// 	)
	// }

	constructor(draftTree, node, initFn) {
		super(draftTree, node, initFn)
		this.registerEvents({
			'internal:sendToClient': this.onSendToClient,
			'internal:renderViewer': this.onRenderViewer
		})
	}

	onSendToClient(req, res) {
		return this.yell('ObojoboDraft.Sections.Assessment:sendToClient', req, res)
	}

	onRenderViewer(req, res, oboGlobals) {
		let attempts
		let userId

		return req
			.requireCurrentUser()
			.then(currentUser => {
				userId = currentUser.id

				return this.constructor.getAttempts(userId, req.params.draftId)
			})
			.then(attempts => {
				// 	attempts = attemptsResult

				// 	//@TODO attempts is a bad name, it's actually an array of objects that contain an 'attempts' array

				// 	return lti.getLTIStatesByAssessmentIdForUserAndDraft(userId, req.params.draftId)
				// })
				// .then(ltiStatesByAssessmentId => {
				// 	console.log('GOT BACKAH', ltiStatesByAssessmentId)
				// 	attempts.forEach(attempt => {
				// 		attempt.ltiState = ltiStatesByAssessmentId[attempt.assessmentId]
				// 			? ltiStatesByAssessmentId[attempt.assessmentId]
				// 			: {}
				// 	})

				oboGlobals.set('ObojoboDraft.Sections.Assessment:attempts', attempts)
				return Promise.resolve()
			})
			.catch(err => {
				return Promise.reject(err)
			})
	}
}

module.exports = Assessment
