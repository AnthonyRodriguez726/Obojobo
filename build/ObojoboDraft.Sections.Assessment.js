/******/ ;(function(modules) {
	// webpackBootstrap
	/******/ // The module cache
	/******/ var installedModules = {} // The require function
	/******/
	/******/ /******/ function __webpack_require__(moduleId) {
		/******/
		/******/ // Check if module is in cache
		/******/ if (installedModules[moduleId]) {
			/******/ return installedModules[moduleId].exports
			/******/
		} // Create a new module (and put it into the cache)
		/******/ /******/ var module = (installedModules[moduleId] = {
			/******/ i: moduleId,
			/******/ l: false,
			/******/ exports: {}
			/******/
		}) // Execute the module function
		/******/
		/******/ /******/ modules[moduleId].call(
			module.exports,
			module,
			module.exports,
			__webpack_require__
		) // Flag the module as loaded
		/******/
		/******/ /******/ module.l = true // Return the exports of the module
		/******/
		/******/ /******/ return module.exports
		/******/
	} // expose the modules object (__webpack_modules__)
	/******/
	/******/
	/******/ /******/ __webpack_require__.m = modules // expose the module cache
	/******/
	/******/ /******/ __webpack_require__.c = installedModules // identity function for calling harmony imports with the correct context
	/******/
	/******/ /******/ __webpack_require__.i = function(value) {
		return value
	} // define getter function for harmony exports
	/******/
	/******/ /******/ __webpack_require__.d = function(exports, name, getter) {
		/******/ if (!__webpack_require__.o(exports, name)) {
			/******/ Object.defineProperty(exports, name, {
				/******/ configurable: false,
				/******/ enumerable: true,
				/******/ get: getter
				/******/
			})
			/******/
		}
		/******/
	} // getDefaultExport function for compatibility with non-harmony modules
	/******/
	/******/ /******/ __webpack_require__.n = function(module) {
		/******/ var getter =
			module && module.__esModule
				? /******/ function getDefault() {
						return module['default']
					}
				: /******/ function getModuleExports() {
						return module
					}
		/******/ __webpack_require__.d(getter, 'a', getter)
		/******/ return getter
		/******/
	} // Object.prototype.hasOwnProperty.call
	/******/
	/******/ /******/ __webpack_require__.o = function(object, property) {
		return Object.prototype.hasOwnProperty.call(object, property)
	} // __webpack_public_path__
	/******/
	/******/ /******/ __webpack_require__.p = 'build/' // Load entry module and return exports
	/******/
	/******/ /******/ return __webpack_require__((__webpack_require__.s = 181))
	/******/
})(
	/************************************************************************/
	/******/ {
		/***/ /***/ 0: function(module, exports) {
			module.exports = Common

			/***/
		},

		/***/ /***/ 1: function(module, exports) {
			module.exports = Viewer

			/***/
		},

		/***/ /***/ 159: function(module, exports) {
			// removed by extract-text-webpack-plugin
			/***/
		},

		/***/ /***/ 160: function(module, exports) {
			// removed by extract-text-webpack-plugin
			/***/
		},

		/***/ /***/ 181: function(module, exports, __webpack_require__) {
			module.exports = __webpack_require__(42)

			/***/
		},

		/***/ /***/ 42: function(module, exports, __webpack_require__) {
			'use strict'

			var _Common = __webpack_require__(0)

			var _Common2 = _interopRequireDefault(_Common)

			var _Viewer = __webpack_require__(1)

			var _Viewer2 = _interopRequireDefault(_Viewer)

			var _adapter = __webpack_require__(84)

			var _adapter2 = _interopRequireDefault(_adapter)

			var _viewerComponent = __webpack_require__(92)

			var _viewerComponent2 = _interopRequireDefault(_viewerComponent)

			function _interopRequireDefault(obj) {
				return obj && obj.__esModule ? obj : { default: obj }
			}

			var AssessmentUtil = _Viewer2.default.util.AssessmentUtil

			_Common2.default.Store.registerModel('ObojoboDraft.Sections.Assessment', {
				type: 'section',
				adapter: _adapter2.default,
				componentClass: _viewerComponent2.default,
				selectionHandler: null,
				getNavItem: function getNavItem(model) {
					var title = model.title || 'Assessment'

					return {
						type: 'link',
						label: title,
						path: [title.toLowerCase().replace(/ /g, '-')],
						showChildren: false,
						showChildrenOnNavigation: false
					}
				},

				variables: {
					'assessment:attemptsRemaining': function assessmentAttemptsRemaining(
						textModel,
						viewerProps
					) {
						var assessmentModel = textModel.getParentOfType('ObojoboDraft.Sections.Assessment')
						if (assessmentModel.modelState.attempts === Infinity) {
							return 'unlimited'
						}

						return (
							assessmentModel.modelState.attempts -
							AssessmentUtil.getNumberOfAttemptsCompletedForModel(
								viewerProps.assessmentState,
								textModel
							)
						)
					},
					'assessment:attemptsAmount': function assessmentAttemptsAmount(textModel, viewerProps) {
						var assessmentModel = textModel.getParentOfType('ObojoboDraft.Sections.Assessment')
						if (assessmentModel.modelState.attempts === Infinity) {
							return 'unlimited'
						}

						return assessmentModel.modelState.attempts
					}
				}

				// generateNav: (model) ->
				// 	[
				// 		{
				// 			type: 'link',
				// 			label: model.title ||= 'Assessment',
				// 			id: model.get('id')
				// 		},
				// 		{
				// 			type: 'seperator'
				// 		}
				// 	]
			})

			/***/
		},

		/***/ /***/ 84: function(module, exports, __webpack_require__) {
			'use strict'

			Object.defineProperty(exports, '__esModule', {
				value: true
			})

			var _scoreActions = __webpack_require__(87)

			var _scoreActions2 = _interopRequireDefault(_scoreActions)

			function _interopRequireDefault(obj) {
				return obj && obj.__esModule ? obj : { default: obj }
			}

			var Adapter = {
				construct: function construct(model, attrs) {
					// Default state.
					model.modelState.attempts = Infinity
					model.modelState.review = false
					model.modelState.scoreActions = new _scoreActions2.default()

					// Set state if XML has the attributes.
					if (attrs && attrs.content) {
						model.modelState.attempts =
							attrs.content.attempts === 'unlimited'
								? Infinity
								: parseInt(attrs.content.attempts, 10)
						model.modelState.review = attrs.content.review || false
						model.modelState.scoreActions = new _scoreActions2.default(
							attrs.content.scoreActions || null
						)
					}
				},

				// model.modelState.assessmentState =
				// 	inTest: false
				// 	scores: []
				// 	currentScore: 0

				clone: function clone(model, _clone) {
					_clone.modelState.attempts = model.modelState.attempts
					_clone.modelState.hideNav = model.modelState.hideNav
					return (_clone.modelState.scoreActions = model.modelState.scoreActions.clone())
				},

				//@TODO - necessary?
				// clone.modelState.assessmentState =
				// 	inTest: model.modelState.assessmentState.inTest
				// 	currentScore: model.modelState.assessmentState.currentScore
				// 	scores: Object.assign [], model.modelState.assessmentState.scores

				toJSON: function toJSON(model, json) {
					json.content.attempts = model.modelState.attempts
					json.content.hideNav = model.modelState.hideNav
					return (json.content.scoreActions = model.modelState.scoreActions.toObject())
				}
			}

			exports.default = Adapter

			function __guard__(value, transform) {
				return typeof value !== 'undefined' && value !== null ? transform(value) : undefined
			}

			/***/
		},

		/***/ /***/ 85: function(module, exports, __webpack_require__) {
			'use strict'

			Object.defineProperty(exports, '__esModule', {
				value: true
			})

			var _createClass = (function() {
				function defineProperties(target, props) {
					for (var i = 0; i < props.length; i++) {
						var descriptor = props[i]
						descriptor.enumerable = descriptor.enumerable || false
						descriptor.configurable = true
						if ('value' in descriptor) descriptor.writable = true
						Object.defineProperty(target, descriptor.key, descriptor)
					}
				}
				return function(Constructor, protoProps, staticProps) {
					if (protoProps) defineProperties(Constructor.prototype, protoProps)
					if (staticProps) defineProperties(Constructor, staticProps)
					return Constructor
				}
			})()

			var _Common = __webpack_require__(0)

			var _Common2 = _interopRequireDefault(_Common)

			function _interopRequireDefault(obj) {
				return obj && obj.__esModule ? obj : { default: obj }
			}

			function _classCallCheck(instance, Constructor) {
				if (!(instance instanceof Constructor)) {
					throw new TypeError('Cannot call a class as a function')
				}
			}

			function _possibleConstructorReturn(self, call) {
				if (!self) {
					throw new ReferenceError("this hasn't been initialised - super() hasn't been called")
				}
				return call && (typeof call === 'object' || typeof call === 'function') ? call : self
			}

			function _inherits(subClass, superClass) {
				if (typeof superClass !== 'function' && superClass !== null) {
					throw new TypeError(
						'Super expression must either be null or a function, not ' + typeof superClass
					)
				}
				subClass.prototype = Object.create(superClass && superClass.prototype, {
					constructor: { value: subClass, enumerable: false, writable: true, configurable: true }
				})
				if (superClass)
					Object.setPrototypeOf
						? Object.setPrototypeOf(subClass, superClass)
						: (subClass.__proto__ = superClass)
			}

			var Dialog = _Common2.default.components.modal.Dialog
			var ModalUtil = _Common2.default.util.ModalUtil

			var AttemptIncompleteDialog = (function(_React$Component) {
				_inherits(AttemptIncompleteDialog, _React$Component)

				function AttemptIncompleteDialog() {
					_classCallCheck(this, AttemptIncompleteDialog)

					return _possibleConstructorReturn(
						this,
						(AttemptIncompleteDialog.__proto__ || Object.getPrototypeOf(AttemptIncompleteDialog))
							.apply(this, arguments)
					)
				}

				_createClass(AttemptIncompleteDialog, [
					{
						key: 'onCancel',
						value: function onCancel() {
							return ModalUtil.hide()
						}
					},
					{
						key: 'onSubmit',
						value: function onSubmit() {
							ModalUtil.hide()
							return this.props.onSubmit()
						}
					},
					{
						key: 'render',
						value: function render() {
							return React.createElement(
								Dialog,
								{
									buttons: [
										{
											value: 'Submit as incomplete',
											altAction: true,
											dangerous: true,
											onClick: this.onSubmit.bind(this)
										},
										'or',
										{
											value: 'Resume assessment',
											onClick: this.onCancel.bind(this),
											default: true
										}
									]
								},
								React.createElement('b', null, 'Wait! You left some questions blank.'),
								React.createElement('br', null),
								'Finish answering all questions and submit again.'
							)
						}
					}
				])

				return AttemptIncompleteDialog
			})(React.Component)

			exports.default = AttemptIncompleteDialog

			/***/
		},

		/***/ /***/ 86: function(module, exports, __webpack_require__) {
			'use strict'

			Object.defineProperty(exports, '__esModule', {
				value: true
			})

			var _createClass = (function() {
				function defineProperties(target, props) {
					for (var i = 0; i < props.length; i++) {
						var descriptor = props[i]
						descriptor.enumerable = descriptor.enumerable || false
						descriptor.configurable = true
						if ('value' in descriptor) descriptor.writable = true
						Object.defineProperty(target, descriptor.key, descriptor)
					}
				}
				return function(Constructor, protoProps, staticProps) {
					if (protoProps) defineProperties(Constructor.prototype, protoProps)
					if (staticProps) defineProperties(Constructor, staticProps)
					return Constructor
				}
			})()

			__webpack_require__(159)

			var _Common = __webpack_require__(0)

			var _Common2 = _interopRequireDefault(_Common)

			var _Viewer = __webpack_require__(1)

			var _Viewer2 = _interopRequireDefault(_Viewer)

			function _interopRequireDefault(obj) {
				return obj && obj.__esModule ? obj : { default: obj }
			}

			function _classCallCheck(instance, Constructor) {
				if (!(instance instanceof Constructor)) {
					throw new TypeError('Cannot call a class as a function')
				}
			}

			function _possibleConstructorReturn(self, call) {
				if (!self) {
					throw new ReferenceError("this hasn't been initialised - super() hasn't been called")
				}
				return call && (typeof call === 'object' || typeof call === 'function') ? call : self
			}

			function _inherits(subClass, superClass) {
				if (typeof superClass !== 'function' && superClass !== null) {
					throw new TypeError(
						'Super expression must either be null or a function, not ' + typeof superClass
					)
				}
				subClass.prototype = Object.create(superClass && superClass.prototype, {
					constructor: { value: subClass, enumerable: false, writable: true, configurable: true }
				})
				if (superClass)
					Object.setPrototypeOf
						? Object.setPrototypeOf(subClass, superClass)
						: (subClass.__proto__ = superClass)
			}

			var Button = _Common2.default.components.Button

			var LTINetworkStates = _Viewer2.default.stores.assessmentStore.LTINetworkStates

			var LTIStatus = (function(_React$Component) {
				_inherits(LTIStatus, _React$Component)

				function LTIStatus() {
					_classCallCheck(this, LTIStatus)

					var _this = _possibleConstructorReturn(
						this,
						(LTIStatus.__proto__ || Object.getPrototypeOf(LTIStatus)).call(this)
					)

					_this.statusRender = {
						success: _this.renderSuccess.bind(_this),
						not_attempted_no_outcome_service_for_launch: _this.renderNoOutcomeService.bind(_this),
						not_attempted_score_is_null: _this.renderScoreIsNull.bind(_this),
						error_launch_expired: _this.renderError.bind(_this),
						error_replace_result_failed: _this.renderError.bind(_this),
						error_no_launch_found: _this.renderError.bind(_this),
						error_no_assessment_score_found: _this.renderError.bind(_this),
						error_no_secret_for_key: _this.renderError.bind(_this),
						error_score_is_invalid: _this.renderError.bind(_this),
						error_unexpected: _this.renderError.bind(_this),
						null: _this.renderError.bind(_this)
					}
					return _this
				}

				_createClass(LTIStatus, [
					{
						key: 'onClickResendScore',
						value: function onClickResendScore() {
							console.log('RESEND SCORE!!!!!!!!!!!!!!', APIUtil)

							AssessmentUtil.resendLTIScore(this.props.model)
						}
					},
					{
						key: 'render',
						value: function render() {
							var childEl = void 0
							var ltiState = this.props.ltiState
							var ltiNetworkState = this.props.ltiNetworkState

							console.log('LTI NET STATE', ltiNetworkState)

							switch (ltiNetworkState) {
								case LTINetworkStates.AWAITING_SEND_ASSESSMENT_SCORE_RESPONSE:
								case LTINetworkStates.AWAITING_READ_RESULT_RESPONSE:
									childEl = this.renderLoading()
									break

								case LTINetworkStates.IDLE:
								default:
									if (!ltiState || ltiState.gradebookStatus === 'ok_no_outcome_service') {
										childEl = null
									} else if (ltiState.gradebookStatus === 'ok_gradebook_matches_assessment_score') {
										childEl = this.renderSynced()
									} else if (ltiState.gradebookStatus === 'ok_null_score_not_sent') {
										childEl = this.renderNotPassed()
									} else {
										childEl = this.renderStatus(ltiState)
									}

									break
							}

							if (childEl === null) return null

							return React.createElement(
								'div',
								{ className: 'obojobo-draft--sections--assessment--lti-status' },
								childEl
							)
						}
					},
					{
						key: 'renderLoading',
						value: function renderLoading() {
							return React.createElement('div', { className: 'is-loading' }, 'LOADING...')
						}
					},
					{
						key: 'renderSynced',
						value: function renderSynced() {
							return React.createElement('div', { className: 'is-synced' }, 'Your score is synced')
						}
					},
					{
						key: 'renderNotPassed',
						value: function renderNotPassed() {
							return React.createElement('div', { className: 'is-not-passed' }, 'Not passed')
						}
					},
					{
						key: 'renderStatus',
						value: function renderStatus(ltiState) {
							return React.createElement(
								'div',
								{ className: 'is-status-' + (ltiState.status || 'null').replace(/_/g, '-') },
								this.statusRender[ltiState.status]()
							)
						}
					},
					{
						key: 'renderSuccess',
						value: function renderSuccess() {
							return React.createElement('p', null, 'good')
						}
					},
					{
						key: 'renderNoOutcomeService',
						value: function renderNoOutcomeService() {
							return React.createElement('p', null, 'module item?')
						}
					},
					{
						key: 'renderScoreIsNull',
						value: function renderScoreIsNull() {
							return React.createElement('p', null, 'have not passed')
						}
					},
					{
						key: 'renderError',
						value: function renderError() {
							return React.createElement(
								'div',
								null,
								React.createElement(
									'h2',
									null,
									'There was a problem sending your score to the gradebook.'
								),
								React.createElement(
									'p',
									null,
									'Close this assignment, reopen it and then click the button below to resend your score.'
								),
								React.createElement(
									Button,
									{ onClick: this.props.onClickResendScore },
									'Resend Score'
								),
								React.createElement(
									'p',
									null,
									'If the problem persists try again later - The gradebook may be down temporarily.'
								),
								React.createElement(
									'p',
									null,
									'If this still doesn\'t solve the issue contact technical support (error code "',
									btoa(this.props.ltiState.status),
									'")'
								)
							)
						}
					}
				])

				return LTIStatus
			})(React.Component)

			exports.default = LTIStatus

			/***/
		},

		/***/ /***/ 87: function(module, exports, __webpack_require__) {
			'use strict'

			Object.defineProperty(exports, '__esModule', {
				value: true
			})

			var _createClass = (function() {
				function defineProperties(target, props) {
					for (var i = 0; i < props.length; i++) {
						var descriptor = props[i]
						descriptor.enumerable = descriptor.enumerable || false
						descriptor.configurable = true
						if ('value' in descriptor) descriptor.writable = true
						Object.defineProperty(target, descriptor.key, descriptor)
					}
				}
				return function(Constructor, protoProps, staticProps) {
					if (protoProps) defineProperties(Constructor.prototype, protoProps)
					if (staticProps) defineProperties(Constructor, staticProps)
					return Constructor
				}
			})()

			function _classCallCheck(instance, Constructor) {
				if (!(instance instanceof Constructor)) {
					throw new TypeError('Cannot call a class as a function')
				}
			}

			var ScoreActions = (function() {
				function ScoreActions(_actions) {
					_classCallCheck(this, ScoreActions)

					if (_actions == null) {
						_actions = []
					}
					this._actions = _actions
				}

				_createClass(ScoreActions, [
					{
						key: 'getActionForScore',
						value: function getActionForScore(score) {
							var _iteratorNormalCompletion = true
							var _didIteratorError = false
							var _iteratorError = undefined

							try {
								for (
									var _iterator = Array.from(this._actions)[Symbol.iterator](), _step;
									!(_iteratorNormalCompletion = (_step = _iterator.next()).done);
									_iteratorNormalCompletion = true
								) {
									var action = _step.value

									if (score >= action.from && score <= action.to) {
										return action
									}
								}
							} catch (err) {
								_didIteratorError = true
								_iteratorError = err
							} finally {
								try {
									if (!_iteratorNormalCompletion && _iterator.return) {
										_iterator.return()
									}
								} finally {
									if (_didIteratorError) {
										throw _iteratorError
									}
								}
							}

							return null
						}
					},
					{
						key: 'toObject',
						value: function toObject() {
							return Object.assign([], this._actions)
						}
					},
					{
						key: 'clone',
						value: function clone() {
							return new ScoreActions(this.toObject())
						}
					}
				])

				return ScoreActions
			})()

			exports.default = ScoreActions

			/***/
		},

		/***/ /***/ 88: function(module, exports, __webpack_require__) {
			'use strict'

			Object.defineProperty(exports, '__esModule', {
				value: true
			})

			var _Viewer = __webpack_require__(1)

			var _Viewer2 = _interopRequireDefault(_Viewer)

			var _Common = __webpack_require__(0)

			var _Common2 = _interopRequireDefault(_Common)

			function _interopRequireDefault(obj) {
				return obj && obj.__esModule ? obj : { default: obj }
			}

			var AssessmentUtil = _Viewer2.default.util.AssessmentUtil
			var OboModel = _Common2.default.models.OboModel

			var assessmentReviewView = function assessmentReviewView(assessment) {
				// const recentScore = AssessmentUtil.getLastAttemptScoreForModel(
				// 	assessment.props.moduleData.assessmentState,
				// 	assessment.props.model
				// )
				// const highestScore = AssessmentUtil.getHighestAttemptScoreForModel(
				// 	assessment.props.moduleData.assessmentState,
				// 	assessment.props.model
				// )
				var attempts = AssessmentUtil.getAllAttempts(
					assessment.props.moduleData.assessmentState,
					assessment.props.model
				)

				return React.createElement(
					'div',
					{ className: 'score unlock' },
					attempts.map(function(attempt, index) {
						var scoreTotal = attempts[index].questionScores.reduce(function(prev, curr) {
							return prev + curr.score
						}, 0)
						var reviewScore = scoreTotal / attempts[index].questionScores.length
						return attemptReviewComponent(attempt, reviewScore, assessment, index + 1)
					})
				)
			}

			var attemptReviewComponent = function attemptReviewComponent(
				attempt,
				reviewScore,
				assessment,
				attemptNumber
			) {
				return React.createElement(
					'div',
					{ className: 'review' },
					React.createElement('h1', null, 'Attempt ' + attemptNumber),
					React.createElement('h2', null, 'Score: ' + reviewScore),
					attempt.questionScores.map(function(scoreObj) {
						var questionModel = OboModel.models[scoreObj.id]
						var QuestionComponent = questionModel.getComponentClass()
						return React.createElement(QuestionComponent, {
							model: questionModel,
							moduleData: assessment.props.moduleData,
							isReview: true,
							scoreContext: 'assessmentReview:' + attempt.attemptId
						})
					})
				)
			}

			exports.default = assessmentReviewView

			/***/
		},

		/***/ /***/ 89: function(module, exports, __webpack_require__) {
			'use strict'

			Object.defineProperty(exports, '__esModule', {
				value: true
			})

			var _Common = __webpack_require__(0)

			var _Common2 = _interopRequireDefault(_Common)

			var _Viewer = __webpack_require__(1)

			var _Viewer2 = _interopRequireDefault(_Viewer)

			var _ltiStatus = __webpack_require__(86)

			var _ltiStatus2 = _interopRequireDefault(_ltiStatus)

			function _interopRequireDefault(obj) {
				return obj && obj.__esModule ? obj : { default: obj }
			}

			var OboModel = _Common2.default.models.OboModel
			var AssessmentUtil = _Viewer2.default.util.AssessmentUtil

			var scoreSubmittedView = function scoreSubmittedView(assessment) {
				var questionScores = AssessmentUtil.getLastAttemptScoresForModel(
					assessment.props.moduleData.assessmentState,
					assessment.props.model
				)
				var recentScore = AssessmentUtil.getLastAttemptScoreForModel(
					assessment.props.moduleData.assessmentState,
					assessment.props.model
				)
				// @TODO make this in AssessmentUtil
				// const highestScore = AssessmentUtil.getHighestAttemptScoreForModel(
				// 	assessment.props.moduleData.assessmentState,
				// 	assessment.props.model
				// )
				var highestScore = 100

				var scoreAction = assessment.getScoreAction()
				var numCorrect = AssessmentUtil.getNumCorrect(questionScores)

				var onClickResendScore = function onClickResendScore() {
					console.log('RESEND SCORE!!!!!!!!!!!!!!', APIUtil)
					AssessmentUtil.resendLTIScore(assessment.model)
				}

				var ltiState = AssessmentUtil.getLTIStateForModel(
					assessment.props.moduleData.assessmentState,
					assessment.props.model
				)
				var ltiNetworkState = AssessmentUtil.getLTINetworkStateForModel(
					assessment.props.moduleData.assessmentState,
					assessment.props.model
				)

				var childEl = void 0

				if (scoreAction.page != null) {
					var pageModel = OboModel.create(scoreAction.page)
					pageModel.parent = assessment.props.model //'@TODO - FIGURE OUT A BETTER WAY TO DO THIS - THIS IS NEEDED TO GET {{VARIABLES}} WORKING')
					var PageComponent = pageModel.getComponentClass()
					childEl = React.createElement(PageComponent, {
						model: pageModel,
						moduleData: assessment.props.moduleData
					})
				} else {
					childEl = React.createElement('p', null, scoreAction.message)
				}

				return React.createElement(
					'div',
					{ className: 'score unlock' },
					React.createElement(_ltiStatus2.default, {
						ltiState: ltiState,
						ltiNetworkState: ltiNetworkState,
						onClickResendScore: onClickResendScore
					}),
					React.createElement('h1', null, 'Your score is ' + Math.round(recentScore) + '%'),
					recentScore === highestScore
						? React.createElement('h2', null, 'This is your highest score')
						: React.createElement(
								'h2',
								null,
								'Your highest score was ' + Math.round(highestScore) + '%'
							),
					childEl,
					React.createElement(
						'div',
						{ className: 'review' },
						React.createElement(
							'p',
							{ className: 'number-correct' },
							'You got ' + numCorrect + ' out of ' + questionScores.length + ' questions correct:'
						),
						questionScores.map(function(questionScore, index) {
							return questionResultView(assessment.props, questionScore, index)
						})
					)
				)
			}

			var questionResultView = function questionResultView(props, questionScore, index) {
				var questionModel = OboModel.models[questionScore.id]
				var QuestionComponent = questionModel.getComponentClass()

				return React.createElement(
					'div',
					{ key: index, className: questionScore.score === 100 ? 'is-correct' : 'is-not-correct' },
					React.createElement(
						'p',
						null,
						'Question ' +
							(index + 1) +
							' - ' +
							(questionScore.score === 100 ? 'Correct:' : 'Incorrect:')
					),
					React.createElement(QuestionComponent, {
						model: questionModel,
						moduleData: props.moduleData,
						showContentOnly: true
					})
				)
			}

			exports.default = scoreSubmittedView

			/***/
		},

		/***/ /***/ 90: function(module, exports, __webpack_require__) {
			'use strict'

			Object.defineProperty(exports, '__esModule', {
				value: true
			})

			var _Common = __webpack_require__(0)

			var _Common2 = _interopRequireDefault(_Common)

			var _Viewer = __webpack_require__(1)

			var _Viewer2 = _interopRequireDefault(_Viewer)

			function _interopRequireDefault(obj) {
				return obj && obj.__esModule ? obj : { default: obj }
			}

			var Button = _Common2.default.components.Button
			var AssessmentUtil = _Viewer2.default.util.AssessmentUtil

			var takingTestView = function takingTestView(assessment) {
				var moduleData = assessment.props.moduleData
				var recentScore = AssessmentUtil.getLastAttemptScoreForModel(
					assessment.props.moduleData.assessmentState,
					assessment.props.model
				)
				var child = assessment.props.model.children.at(1)
				var Component = child.getComponentClass()
				return React.createElement(
					'div',
					{ className: 'test' },
					React.createElement(Component, {
						className: 'untested',
						model: child,
						moduleData: moduleData,
						showScore: recentScore !== null
					}),
					React.createElement(
						'div',
						{ className: 'submit-button' },
						React.createElement(Button, {
							onClick: assessment.onClickSubmit.bind(assessment),
							value: assessment.isAttemptComplete()
								? 'Submit'
								: 'Submit (Not all questions have been answered)'
						})
					)
				)
			}

			exports.default = takingTestView

			/***/
		},

		/***/ /***/ 91: function(module, exports, __webpack_require__) {
			'use strict'

			Object.defineProperty(exports, '__esModule', {
				value: true
			})
			var untestedView = function untestedView(assessment) {
				var child = assessment.props.model.children.at(0)
				var Component = child.getComponentClass()

				return React.createElement(
					'div',
					{ className: 'untested' },
					React.createElement(Component, { model: child, moduleData: assessment.props.moduleData })
				)
			}

			exports.default = untestedView

			/***/
		},

		/***/ /***/ 92: function(module, exports, __webpack_require__) {
			'use strict'

			Object.defineProperty(exports, '__esModule', {
				value: true
			})

			var _createClass = (function() {
				function defineProperties(target, props) {
					for (var i = 0; i < props.length; i++) {
						var descriptor = props[i]
						descriptor.enumerable = descriptor.enumerable || false
						descriptor.configurable = true
						if ('value' in descriptor) descriptor.writable = true
						Object.defineProperty(target, descriptor.key, descriptor)
					}
				}
				return function(Constructor, protoProps, staticProps) {
					if (protoProps) defineProperties(Constructor.prototype, protoProps)
					if (staticProps) defineProperties(Constructor, staticProps)
					return Constructor
				}
			})()

			__webpack_require__(160)

			var _Common = __webpack_require__(0)

			var _Common2 = _interopRequireDefault(_Common)

			var _Viewer = __webpack_require__(1)

			var _Viewer2 = _interopRequireDefault(_Viewer)

			var _attemptIncompleteDialog = __webpack_require__(85)

			var _attemptIncompleteDialog2 = _interopRequireDefault(_attemptIncompleteDialog)

			var _viewerComponentUntested = __webpack_require__(91)

			var _viewerComponentUntested2 = _interopRequireDefault(_viewerComponentUntested)

			var _viewerComponentReview = __webpack_require__(88)

			var _viewerComponentReview2 = _interopRequireDefault(_viewerComponentReview)

			var _viewerComponentScoreSubmitted = __webpack_require__(89)

			var _viewerComponentScoreSubmitted2 = _interopRequireDefault(_viewerComponentScoreSubmitted)

			var _viewerComponentTakingTest = __webpack_require__(90)

			var _viewerComponentTakingTest2 = _interopRequireDefault(_viewerComponentTakingTest)

			function _interopRequireDefault(obj) {
				return obj && obj.__esModule ? obj : { default: obj }
			}

			function _classCallCheck(instance, Constructor) {
				if (!(instance instanceof Constructor)) {
					throw new TypeError('Cannot call a class as a function')
				}
			}

			function _possibleConstructorReturn(self, call) {
				if (!self) {
					throw new ReferenceError("this hasn't been initialised - super() hasn't been called")
				}
				return call && (typeof call === 'object' || typeof call === 'function') ? call : self
			}

			function _inherits(subClass, superClass) {
				if (typeof superClass !== 'function' && superClass !== null) {
					throw new TypeError(
						'Super expression must either be null or a function, not ' + typeof superClass
					)
				}
				subClass.prototype = Object.create(superClass && superClass.prototype, {
					constructor: { value: subClass, enumerable: false, writable: true, configurable: true }
				})
				if (superClass)
					Object.setPrototypeOf
						? Object.setPrototypeOf(subClass, superClass)
						: (subClass.__proto__ = superClass)
			}

			var OboComponent = _Common2.default.components.OboComponent
			var OboModel = _Common2.default.models.OboModel
			var Button = _Common2.default.components.Button
			var Dispatcher = _Common2.default.flux.Dispatcher
			var ModalUtil = _Common2.default.util.ModalUtil
			var AssessmentUtil = _Viewer2.default.util.AssessmentUtil
			var NavUtil = _Viewer2.default.util.NavUtil

			//@TODO

			var APIUtil = _Viewer2.default.util.APIUtil

			var Assessment = (function(_React$Component) {
				_inherits(Assessment, _React$Component)

				function Assessment() {
					_classCallCheck(this, Assessment)

					var _this = _possibleConstructorReturn(
						this,
						(Assessment.__proto__ || Object.getPrototypeOf(Assessment)).call(this)
					)

					_this.state = { step: null }
					return _this
				}

				_createClass(Assessment, [
					{
						key: 'getCurrentStep',
						value: function getCurrentStep() {
							var assessment = AssessmentUtil.getAssessmentForModel(
								this.props.moduleData.assessmentState,
								this.props.model
							)

							if (assessment === null) {
								return 'untested'
							}
							if (assessment.current !== null) {
								return 'takingTest'
							}

							if (this.props.model.modelState.review && this.isAssessmentComplete()) {
								return 'review'
							}

							if (assessment.attempts.length > 0) {
								return 'scoreSubmitted'
							}
							return 'untested'
						}
					},
					{
						key: 'componentWillReceiveProps',
						value: function componentWillReceiveProps(nextProps) {
							var curStep = this.getCurrentStep()
							if (curStep !== this.state.step) {
								this.needsScroll = true
							}

							return this.setState({ step: curStep })
						}
					},
					{
						key: 'componentDidUpdate',
						value: function componentDidUpdate() {
							if (this.needsScroll) {
								delete this.needsScroll
								return Dispatcher.trigger('viewer:scrollToTop')
							}
						}
					},
					{
						key: 'isAttemptComplete',
						value: function isAttemptComplete() {
							return AssessmentUtil.isCurrentAttemptComplete(
								this.props.moduleData.assessmentState,
								this.props.moduleData.questionState,
								this.props.model
							)
						}
					},
					{
						key: 'isAssessmentComplete',
						value: function isAssessmentComplete() {
							return !AssessmentUtil.hasAttemptsRemaining(
								this.props.moduleData.assessmentState,
								this.props.model
							)
						}
					},
					{
						key: 'onClickSubmit',
						value: function onClickSubmit() {
							if (!this.isAttemptComplete()) {
								ModalUtil.show(
									React.createElement(_attemptIncompleteDialog2.default, {
										onSubmit: this.endAttempt.bind(this)
									})
								)
								return
							}

							return this.endAttempt()
						}
					},
					{
						key: 'endAttempt',
						value: function endAttempt() {
							return AssessmentUtil.endAttempt(this.props.model, this.props.model.modelState.review)
						}
					},
					{
						key: 'exitAssessment',
						value: function exitAssessment() {
							var scoreAction = this.getScoreAction()

							switch (scoreAction.action.value) {
								case '_next':
									return NavUtil.goNext()

								case '_prev':
									return NavUtil.goPrev()

								default:
									return NavUtil.goto(scoreAction.action.value)
							}
						}
					},
					{
						key: 'getScoreAction',
						value: function getScoreAction() {
							var assessmentScore = AssessmentUtil.getAssessmentScoreForModel(
								this.props.moduleData.assessmentState,
								this.props.model
							)
							var scoreAction = this.props.model.modelState.scoreActions.getActionForScore(
								assessmentScore
							)
							if (scoreAction) {
								return scoreAction
							}

							return {
								from: 0,
								to: 100,
								message: '',
								action: {
									type: 'unlock',
									value: '_next'
								}
							}
						}
					},
					{
						key: 'render',
						value: function render() {
							var _this2 = this

							var recentScore = AssessmentUtil.getLastAttemptScoreForModel(
								this.props.moduleData.assessmentState,
								this.props.model
							)
							var assessmentScore = AssessmentUtil.getAssessmentScoreForModel(
								this.props.moduleData.assessmentState,
								this.props.model
							)

							var childEl = (function() {
								switch (_this2.getCurrentStep()) {
									case 'untested':
										return (0, _viewerComponentUntested2.default)(_this2)

									case 'takingTest':
										return (0, _viewerComponentTakingTest2.default)(_this2)

									case 'scoreSubmitted':
										return (0, _viewerComponentScoreSubmitted2.default)(_this2)

									case 'review':
										return (0, _viewerComponentReview2.default)(_this2)
								}
							})()

							return React.createElement(
								OboComponent,
								{
									model: this.props.model,
									moduleData: this.props.moduleData,
									className: 'obojobo-draft--sections--assessment'
								},
								childEl
							)
						}
					}
				])

				return Assessment
			})(React.Component)

			exports.default = Assessment

			/***/
		}

		/******/
	}
)
