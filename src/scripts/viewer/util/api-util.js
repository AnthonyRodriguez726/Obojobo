const createParsedJsonPromise = promise => {
	return new Promise((resolve, reject) => {
		return promise
			.then(res => {
				console.log(res)
				return res.json()
			})
			.then(json => {
				if (json.status === 'error') console.log(json.value)
				return resolve(json)
			})
			.catch(error => reject(error))
	})
}

var APIUtil = {
	get(endpoint) {
		return fetch(endpoint, {
			method: 'GET',
			credentials: 'include',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json'
			} //@TODO - Do I need this?
		})
	},

	post(endpoint, body) {
		if (body == null) {
			body = {}
		}
		return fetch(endpoint, {
			method: 'POST',
			credentials: 'include',
			body: JSON.stringify(body),
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json'
			}
		})
	},

	postEvent(lo, action, payload) {
		createParsedJsonPromise(
			APIUtil.post('/api/events', {
				event: {
					action,
					draft_id: lo.get('_id'),
					actor_time: new Date().toISOString(),
					payload
				}
			})
			// TODO: Send Caliper event to client host.
		).then(json => {
			console.log(json)
		})
	},

	saveState(lo, state) {
		return APIUtil.postEvent(lo, 'saveState', state)
	},

	fetchDraft(id) {
		return createParsedJsonPromise(fetch(`/api/drafts/${id}`))
	},

	getAttempts(lo) {
		return createParsedJsonPromise(APIUtil.get(`/api/drafts/${lo.get('_id')}/attempts`))
	},

	startAttempt(lo, assessment, questions) {
		return createParsedJsonPromise(
			APIUtil.post('/api/assessments/attempt/start', {
				draftId: lo.get('_id'),
				assessmentId: assessment.get('id'),
				actor: 4,
				questions: '@TODO'
			})
		)
	},

	endAttempt(attempt) {
		return createParsedJsonPromise(
			APIUtil.post(`/api/assessments/attempt/${attempt.attemptId}/end`)
		)
	}
}

// recordQuestionResponse: (attempt, question, response) ->
// 	console.clear()
// 	console.log arguments
// 	createParsedJsonPromise APIUtil.post "/api/assessments/attempt/#{attempt.id}/question/#{question.get('id')}", {
// 		response: response
// 	}

export default APIUtil
