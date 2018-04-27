/*
 OBOJOBO Express Middleware

 Install into your own express app using:
 app.use(require('obo_express'))
 Your parent express app will need:
   * a session handler
   * a body parser (if using 'body-parser', make sure json options is set to 1mb or higher)
   * a view engine that parses .pug
*/

global.oboRequire = name => {
	return require(`${__dirname}/${name}`)
}
let express = require('express')
let app = express()
let apiResponseDecorator = oboRequire('api_response_decorator')
let loadBalancerHelperMiddleware = oboRequire('express_load_balancer_helper')
let currentUserMiddleware = oboRequire('express_current_user')
let ltiLaunch = oboRequire('express_lti_launch')
let registerChunks = oboRequire('express_register_chunks')
let oboLtiMiddleware = oboRequire('obo_ims_lti')
let viewerMiddleware = oboRequire('viewer_events')

// when the parent app is mounted
app.on('mount', app => {
	// =========== MIDDLEWARE ===========
	app.use(loadBalancerHelperMiddleware)
	app.use(currentUserMiddleware)
	app.use(oboLtiMiddleware)
	app.use('/view/:draftId*', ltiLaunch.assignment)
	app.use('/lti/canvas/editor_button', ltiLaunch.assignmentSelection)
	app.use('/lti/canvas/course_navigation', ltiLaunch.courseNavlaunch)
	app.use('/lti/canvas/resource_selection', ltiLaunch.assignmentSelection)
	app.use('/api', apiResponseDecorator)

	// =========== REGISTER OBOJOBO DRAFT CHUNKS ===========
	registerChunks(app)

	// =========== ROUTING & CONTROLERS ===========
	app.use('/view', oboRequire('routes/viewer'))
	app.use('/editor', oboRequire('routes/editor'))
	app.use('/lti', oboRequire('routes/lti'))
	app.use('/api/drafts', oboRequire('routes/api/drafts'))
	app.use('/api/events', oboRequire('routes/api/events'))
	app.use('/api/visits', oboRequire('routes/api/visits'))
	app.use('/profile', oboRequire('routes/profile'))
})

module.exports = app
