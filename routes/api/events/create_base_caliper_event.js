let { ACTOR_USER, ACTOR_VIEWER_CLIENT, ACTOR_SERVER_APP } = require('./caliper_constants')
let { getNewGeneratedId } = require('./caliper_utils')

let createEvent = (
	classRef,
	actorObject,
	IRI,
	{ isPreviewMode = false, sessionId = null, launchId = null }
) => {
	let caliperEvent = new classRef()

	// Set @context manually to comply with Caliper 1.1 standard
	caliperEvent['@context'] = 'http://purl.imsglobal.org/ctx/caliper/v1p1'
	caliperEvent.id = getNewGeneratedId()
	caliperEvent.setEdApp(IRI.getEdAppIRI())
	caliperEvent.setEventTime(new Date().toISOString())

	if (!caliperEvent['@type']) {
		caliperEvent.setType('Event')
	}

	switch (actorObject.type) {
		case ACTOR_USER:
			caliperEvent.setActor(IRI.getUserIRI(actorObject.id))
			break

		case ACTOR_VIEWER_CLIENT:
			caliperEvent.setActor(IRI.getViewerClientIRI())
			break

		case ACTOR_SERVER_APP:
			caliperEvent.setActor(IRI.getAppServerIRI())
			break

		default:
			throw new Error(
				`createEvent actor must be one of "${ACTOR_USER}", "${ACTOR_VIEWER_CLIENT}" or "${ACTOR_SERVER_APP}"`
			)
	}

	if (sessionId) caliperEvent.session = IRI.getSessionIRI(sessionId)
	if (launchId) caliperEvent.setFederatedSession(IRI.getFederatedSessionIRI(launchId))

	caliperEvent.extensions = {
		previewMode: isPreviewMode
	}

	return caliperEvent
}

module.exports = createEvent
