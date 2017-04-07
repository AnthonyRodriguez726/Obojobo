let User = oboRequire('models/user')

let setCurrentUser = (req, user) => {
	if(! user instanceof User) throw new Error('Invalid User for Current user')
	req.session.currentUserId = user.id
}

// returns a Promise!!!
let getCurrentUser = (req, isRequired = false) => {
	if(req.currentUser) return Promise.resolve(req.currentUser)

	if( ! req.session || ! req.session.currentUserId ){
		if(isRequired){
			console.warn('No Session or Current User?', req.session instanceof Object, req.session.currentUserId)
			return Promise.reject(new Error('Login Required'))
		}
		return Promise.resolve(new GuestUser());
	}

	return User.fetchById(req.session.currentUserId)
	.then(user => {
		req.currentUser = user
		return user
	})
	.catch(err => {
		console.warn('getCurrentUser', err)
		if(isRequired) return Promise.reject(new Error('Login Required'))
		return Promise.resolve(new GuestUser());
	})
}

let requireCurrentUser = (req) => {
	// returns a promise
	return req.getCurrentUser(true)
	.then(user => {
		return user
	})
	.catch(err => {
		console.warn('requireCurrentUser', err)
		throw new Error('Login Required')
	})
}

module.exports = (req, res, next) => {
	req.setCurrentUser = setCurrentUser.bind(this, req)
	req.getCurrentUser = getCurrentUser.bind(this, req)
	req.requireCurrentUser = requireCurrentUser.bind(this, req)
	next();
};
