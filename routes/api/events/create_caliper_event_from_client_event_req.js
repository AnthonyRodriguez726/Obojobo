//@TODO
//Need a way to generate a Response from an assessment:setResponse but I don't know the ID of the insert on attempts_question_responses
//don't like the fact that there's question:setResponse and assessment:setResponse
//the setting of the actor seems very haphazard
//should all of these be in one file?

let { ACTOR_USER, ACTOR_VIEWER_CLIENT, ACTOR_SERVER_APP } = require('./caliper_constants')
let { getSessionIds } = require('./caliper_utils')

module.exports = req => {
	let caliperEvents = require('./create_caliper_event')(req, null, true)
	let currentUser = req.currentUser || { id: null }
	let clientEvent = req.body.event
	let isPreviewMode = currentUser.canViewEditor
	let sessionId, launchId

	let actorUser = { type: ACTOR_USER, id: currentUser.id }
	let sessionIds = getSessionIds(req.session)

	switch (clientEvent.action) {
		case 'nav:goto':
		case 'nav:gotoPath':
		case 'nav:prev':
		case 'nav:next':
			return caliperEvents.createNavigationEvent({
				actor: actorUser,
				draftId: clientEvent.draft_id,
				from: clientEvent.payload.from,
				to: clientEvent.payload.to,
				isPreviewMode,
				sessionIds,
				extensions: {
					navType: clientEvent.action.split(':')[1],
					internalName: clientEvent.action
				}
			})

		case 'question:view':
			return caliperEvents.createViewEvent({
				actor: actorUser,
				draftId: clientEvent.draft_id,
				itemId: clientEvent.payload.questionId,
				isPreviewMode,
				sessionIds
			})

		case 'question:hide':
			return caliperEvents.createHideEvent({
				actor: actorUser,
				draftId: clientEvent.draft_id,
				questionId: clientEvent.payload.questionId,
				isPreviewMode,
				sessionIds
			})

		case 'question:checkAnswer':
			return caliperEvents.createPracticeQuestionSubmittedEvent({
				actor: actorUser,
				draftId: clientEvent.draft_id,
				questionId: clientEvent.payload.questionId,
				isPreviewMode,
				sessionIds
			})

		case 'question:showExplanation':
			return caliperEvents.createViewEvent({
				actor: actorUser,
				draftId: clientEvent.draft_id,
				itemId: clientEvent.payload.questionId,
				frameName: 'explanation',
				isPreviewMode,
				sessionIds
			})

		case 'question:hideExplanation':
			return caliperEvents.createHideEvent({
				actor: actorUser, //@TODO
				draftId: clientEvent.draft_id,
				questionId: clientEvent.payload.questionId,
				frameName: 'explanation',
				isPreviewMode,
				sessionIds
			})

		case 'question:setResponse':
		case 'assessment:setResponse':
			return caliperEvents.createAssessmentItemEvent({
				actor: actorUser,
				draftId: clientEvent.draft_id,
				questionId: clientEvent.payload.questionId,
				assessmentId: clientEvent.payload.assessmentId,
				attemptId: clientEvent.payload.attemptId,
				response: clientEvent.payload.response,
				targetId: clientEvent.payload.targetId,
				isPreviewMode,
				sessionIds
			})

		case 'score:set':
			return caliperEvents.createPracticeGradeEvent({
				actor: { type: ACTOR_VIEWER_CLIENT },
				draftId: clientEvent.draft_id,
				questionId: clientEvent.payload.itemId,
				scoreId: clientEvent.payload.id,
				score: clientEvent.payload.score,
				isPreviewMode,
				sessionIds
			})

		case 'score:clear':
			return caliperEvents.createPracticeUngradeEvent({
				actor: { type: ACTOR_SERVER_APP },
				draftId: clientEvent.draft_id,
				questionId: clientEvent.payload.itemId,
				scoreId: clientEvent.payload.id,
				isPreviewMode,
				sessionIds
			})

		case 'question:retry':
			return caliperEvents.createPracticeQuestionResetEvent({
				actor: actorUser,
				draftId: clientEvent.draft_id,
				questionId: clientEvent.payload.questionId,
				isPreviewMode,
				sessionIds
			})

		case 'viewer:inactive':
			return caliperEvents.createViewerAbandonedEvent({
				actor: actorUser,
				draftId: clientEvent.draft_id,
				isPreviewMode,
				sessionIds,
				extensions: {
					type: 'inactive',
					lastActiveTime: clientEvent.payload.lastActiveTime,
					inactiveDuration: clientEvent.payload.inactiveDuration
				}
			})

		case 'viewer:returnFromInactive':
			return caliperEvents.createViewerResumedEvent({
				actor: actorUser,
				draftId: clientEvent.draft_id,
				isPreviewMode,
				sessionIds,
				extensions: {
					type: 'returnFromInactive',
					lastActiveTime: clientEvent.payload.lastActiveTime,
					inactiveDuration: clientEvent.payload.inactiveDuration,
					relatedEventId: clientEvent.payload.relatedEventId
				}
			})

		case 'viewer:close':
			return caliperEvents.createViewerSessionLoggedOutEvent({
				actor: actorUser,
				draftId: clientEvent.draft_id,
				isPreviewMode,
				sessionIds
			})

		case 'viewer:leave':
			return caliperEvents.createViewerAbandonedEvent({
				actor: actorUser,
				draftId: clientEvent.draft_id,
				isPreviewMode,
				sessionIds,
				extensions: {
					type: 'leave'
				}
			})

		case 'viewer:return':
			return caliperEvents.createViewerResumedEvent({
				actor: actorUser,
				draftId: clientEvent.draft_id,
				isPreviewMode,
				sessionIds,
				extensions: {
					type: 'return',
					relatedEventId: clientEvent.payload.relatedEventId
				}
			})
	}
	return null
}
