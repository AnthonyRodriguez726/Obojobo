const QueryResultError = require('pg-promise').errors.QueryResultError
const inflector = require('json-inflector')
const logger = oboRequire('logger')
const apiUrlRegex = /\/api\/.*/

const getSanitizedErrorMessage = e => {
	// If the error is in our blacklist only return the error name:
	if (e instanceof QueryResultError) {
		return e.constructor.name
	}

	// Otherwise, allow the message to be returned
	return e.message
}

const shouldRespondWithJson = req => {
	// return api friendly result if route contains '/api/''
	return req.originalUrl.match(apiUrlRegex) || (req.is('json') && req.accepts('json'))
}

const camelize = o => {
	return inflector.transform(o, 'camelizeLower')
}

const success = (req, res, next, valueObject) => {
	res.status(200)
	if (shouldRespondWithJson(req)) {
		return res.json(
			camelize({
				status: 'ok',
				value: valueObject
			})
		)
	}

	res.send(valueObject)
}

const badInput = (req, res, next, message) => {
	res.status(422)
	if (shouldRespondWithJson(req)) {
		return res.json(
			camelize({
				status: 'error',
				value: {
					type: 'badInput',
					message: message
				}
			})
		)
	}

	res.send(`Bad Input: ${message}`)
}

const notAuthorized = (req, res, next, message) => {
	res.status(401)
	if (shouldRespondWithJson(req)) {
		return res.json(
			camelize({
				status: 'error',
				value: {
					type: 'notAuthorized',
					message: message
				}
			})
		)
	}

	res.send(`Not Authorized`)
}

const reject = (req, res, next, message) => {
	res.status(403)
	if (shouldRespondWithJson(req)) {
		return res.json(
			camelize({
				status: 'error',
				value: {
					type: 'reject',
					message: message
				}
			})
		)
	}

	res.send(`Rejected Request: ${message}`)
}

const missing = (req, res, next, message) => {
	res.status(404)

	if (shouldRespondWithJson(req)) {
		return res.json(
			camelize({
				status: 'error',
				value: {
					type: 'missing',
					message: message
				}
			})
		)
	}

	res.render('404')
}

const unexpected = (req, res, next, messageOrError) => {
	let message

	res.status(500)

	if (messageOrError instanceof Error) {
		logger.error('error thrown', messageOrError.stack)
		message = getSanitizedErrorMessage(messageOrError)
	} else {
		logger.error('error message', messageOrError)
		message = messageOrError
	}

	if (!message) {
		message = 'Unexpected Error'
	}

	if (shouldRespondWithJson(req)) {
		return res.json(
			camelize({
				status: 'error',
				value: {
					type: 'unexpected',
					message: message
				}
			})
		)
	}

	res.send(`Server Error: ${message}`)
}

module.exports = (req, res, next) => {
	// partially apply function with bind
	res.success = success.bind(this, req, res, next)
	res.missing = missing.bind(this, req, res, next)
	res.badInput = badInput.bind(this, req, res, next)
	res.notAuthorized = notAuthorized.bind(this, req, res, next)
	res.unexpected = unexpected.bind(this, req, res, next)
	res.reject = reject.bind(this, req, res, next)
	next()
}
