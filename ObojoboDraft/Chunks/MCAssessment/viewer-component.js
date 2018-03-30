import './viewer-component.scss'

let ReactCSSTransitionGroup = React.addons.CSSTransitionGroup

import Common from 'Common'
import Viewer from 'Viewer'

let { OboComponent } = Common.components
let { Button } = Common.components
let { OboModel } = Common.models
let { Dispatcher } = Common.flux
let { DOMUtil } = Common.page
// FocusUtil = Common.util.FocusUtil

let { QuestionUtil } = Viewer.util
let { NavUtil } = Viewer.util

// @TODO - This wont update if new children are passed in via props

export default class MCAssessment extends React.Component {
	constructor(props) {
		super(props)

		const { correctLabels, incorrectLabels } = this.props.model.modelState

		this.onClickShowExplanation = this.onClickShowExplanation.bind(this)
		this.onClickHideExplanation = this.onClickHideExplanation.bind(this)
		this.onClickSubmit = this.onClickSubmit.bind(this)
		this.onClickReset = this.onClickReset.bind(this)
		this.onClick = this.onClick.bind(this)
		this.onCheckAnswer = this.onCheckAnswer.bind(this)
		this.isShowingExplanation = this.isShowingExplanation.bind(this)
		this.correctLabels = correctLabels
			? correctLabels
			: ['Correct!', 'You got it!', 'Great job!', "That's right!"]
		this.incorrectLabels = incorrectLabels ? incorrectLabels : ['Incorrect']
		this.updateFeedbackLabels()
	}

	getQuestionModel() {
		return this.props.model.getParentOfType('ObojoboDraft.Chunks.Question')
	}

	getResponseData() {
		let questionResponse = QuestionUtil.getResponse(
			this.props.moduleData.questionState,
			this.getQuestionModel(),
			this.props.moduleData.navState.context
		) || { ids: [] }

		let correct = new Set()
		let responses = new Set()
		let childId

		for (let child of Array.from(this.props.model.children.models)) {
			childId = child.get('id')

			if (child.modelState.score === 100) {
				correct.add(childId)
			}

			if (questionResponse.ids.indexOf(childId) !== -1) {
				responses.add(childId)
			}
		}

		return {
			correct,
			responses
		}
	}

	calculateScore() {
		let responseData = this.getResponseData()
		let { correct } = responseData
		let { responses } = responseData

		switch (this.props.model.modelState.responseType) {
			case 'pick-all':
				if (correct.size !== responses.size) {
					return 0
				}
				let score = 100
				correct.forEach(function(id) {
					if (!responses.has(id)) {
						return (score = 0)
					}
				})
				return score

			default:
				// pick-one | pick-one-multiple-correct
				for (let id of Array.from(Array.from(correct))) {
					if (responses.has(id)) {
						return 100
					}
				}

				return 0
		}
	}

	isShowingExplanation() {
		return QuestionUtil.isShowingExplanation(
			this.props.moduleData.questionState,
			this.getQuestionModel()
		)
	}

	retry() {
		QuestionUtil.retryQuestion(
			this.getQuestionModel().get('id'),
			this.props.moduleData.navState.context
		)
	}

	hideExplanation() {
		QuestionUtil.hideExplanation(this.getQuestionModel().get('id'), 'user')
	}

	onClickReset(event) {
		event.preventDefault()

		this.retry()
	}

	onClickSubmit(event) {
		event.preventDefault()

		QuestionUtil.setScore(
			this.getQuestionModel().get('id'),
			this.calculateScore(),
			this.props.moduleData.navState.context
		)
		// ScoreUtil.setScore(this.getQuestionModel().get('id'), this.calculateScore())
		this.updateFeedbackLabels()
		QuestionUtil.checkAnswer(this.getQuestionModel().get('id'))
	}

	onClickShowExplanation(event) {
		event.preventDefault()

		QuestionUtil.showExplanation(this.getQuestionModel().get('id'))
	}

	onClickHideExplanation(event) {
		event.preventDefault()

		this.hideExplanation()
	}

	onClick(event) {
		let response
		let questionModel = this.getQuestionModel()
		let mcChoiceEl = DOMUtil.findParentWithAttr(
			event.target,
			'data-type',
			'ObojoboDraft.Chunks.MCAssessment.MCChoice'
		)
		if (!mcChoiceEl) {
			return
		}

		let mcChoiceId = mcChoiceEl.getAttribute('data-id')
		if (!mcChoiceId) {
			return
		}

		if (this.getScore() !== null) {
			this.retry()
		}

		switch (this.props.model.modelState.responseType) {
			case 'pick-all':
				response = QuestionUtil.getResponse(
					this.props.moduleData.questionState,
					questionModel,
					this.props.moduleData.navState.context
				) || {
					ids: []
				}
				let responseIndex = response.ids.indexOf(mcChoiceId)

				if (responseIndex === -1) {
					response.ids.push(mcChoiceId)
				} else {
					response.ids.splice(responseIndex, 1)
				}
				break

			default:
				response = {
					ids: [mcChoiceId]
				}
				break
		}

		QuestionUtil.setResponse(
			questionModel.get('id'),
			response,
			mcChoiceId,
			this.props.moduleData.navState.context,
			this.props.moduleData.navState.context.split(':')[1],
			this.props.moduleData.navState.context.split(':')[2]
		)
	}

	getScore() {
		return QuestionUtil.getScoreForModel(
			this.props.moduleData.questionState,
			this.getQuestionModel(),
			this.props.moduleData.navState.context
		)
	}

	componentWillReceiveProps() {
		this.sortIds()
	}

	componentDidMount() {
		Dispatcher.on('question:checkAnswer', this.onCheckAnswer)
	}

	componentWillUnmount() {
		Dispatcher.off('question:checkAnswer', this.onCheckAnswer)
	}

	onCheckAnswer(payload) {
		let questionId = this.getQuestionModel().get('id')

		if (payload.value.id === questionId) {
			QuestionUtil.setScore(
				questionId,
				this.calculateScore(),
				this.props.moduleData.navState.context
			)
		}
	}

	componentWillMount() {
		this.sortIds()
	}

	sortIds() {
		if (!QuestionUtil.getData(this.props.moduleData.questionState, this.props.model, 'sortedIds')) {
			let ids = this.props.model.children.models.map(model => model.get('id'))
			if (this.props.model.modelState.shuffle) ids = _.shuffle(ids)
			QuestionUtil.setData(this.props.model.get('id'), 'sortedIds', ids)
		}
	}

	updateFeedbackLabels() {
		this.correctLabelToShow = this.getRandomItem(this.correctLabels)
		this.incorrectLabelToShow = this.getRandomItem(this.incorrectLabels)
	}

	getRandomItem(arrayOfOptions) {
		return arrayOfOptions[Math.floor(Math.random() * arrayOfOptions.length)]
	}

	render() {
		let { responseType } = this.props.model.modelState
		let isShowingExplanation = this.isShowingExplanation()
		let score = this.getScore()
		let questionSubmitted = score !== null
		let questionAnswered = this.getResponseData().responses.size >= 1
		let sortedIds = QuestionUtil.getData(
			this.props.moduleData.questionState,
			this.props.model,
			'sortedIds'
		)
		// sortedIds = _.shuffle(@props.model.children.models).map (model) -> model.get('id')

		if (!sortedIds) return false

		let feedbacks = Array.from(this.getResponseData().responses)
			.filter(mcChoiceId => {
				return OboModel.models[mcChoiceId].children.length > 1
			})
			.sort((id1, id2) => {
				return sortedIds.indexOf(id1) - sortedIds.indexOf(id2)
			})
			.map(mcChoiceId => {
				return OboModel.models[mcChoiceId].children.at(1)
			})

		let { solution } = this.props.model.parent.modelState
		if (solution != null) {
			var SolutionComponent = solution.getComponentClass()
		}

		return (
			<OboComponent
				model={this.props.model}
				moduleData={this.props.moduleData}
				onClick={this.props.mode !== 'review' ? this.onClick : null}
				tag="form"
				className={
					'obojobo-draft--chunks--mc-assessment' +
					` is-response-type-${this.props.model.modelState.responseType}` +
					` is-mode-${this.props.mode}` +
					(isShowingExplanation ? ' is-showing-explanation' : ' is-not-showing-explantion') +
					(score === null ? ' is-unscored' : ' is-scored')
				}
			>
				<span className="instructions">
					{(function() {
						switch (responseType) {
							case 'pick-one':
								return <span>Pick the correct answer</span>
							case 'pick-one-multiple-correct':
								return <span>Pick one of the correct answers</span>
							case 'pick-all':
								return (
									<span>
										Pick <b>all</b> of the correct answers
									</span>
								)
						}
					})()}
				</span>
				{sortedIds.map((id, index) => {
					let child = OboModel.models[id]
					if (child.get('type') !== 'ObojoboDraft.Chunks.MCAssessment.MCChoice') {
						return null
					}

					let Component = child.getComponentClass()
					return (
						<Component
							key={child.get('id')}
							model={child}
							moduleData={this.props.moduleData}
							responseType={responseType}
							isShowingExplanation
							mode={this.props.mode}
							questionSubmitted={questionSubmitted}
							label={String.fromCharCode(index + 65)}
						/>
					)
				})}
				{
					<div className="submit-and-result-container">
						{this.props.mode === 'practice' ? (
							questionSubmitted ? (
								<div className="submit">
									<Button altAction onClick={this.onClickReset} value="Try Again" />
								</div>
							) : (
								<div className="submit">
									<Button
										onClick={this.onClickSubmit}
										value="Check Your Answer"
										disabled={!questionAnswered}
									/>
								</div>
							)
						) : null}

						{questionSubmitted ? (
							score === 100 ? (
								<div className="result-container">
									<p className="result correct">{this.correctLabelToShow}</p>
								</div>
							) : (
								<div className="result-container">
									<p className="result incorrect">{this.incorrectLabelToShow}</p>
									{responseType === 'pick-all' ? (
										<span className="pick-all-instructions">
											You have either missed some correct answers or selected some incorrect answers
										</span>
									) : null}
								</div>
							)
						) : null}
					</div>
				}
				<ReactCSSTransitionGroup
					component="div"
					transitionName="submit"
					transitionEnterTimeout={800}
					transitionLeaveTimeout={800}
				>
					{questionSubmitted && (feedbacks.length > 0 || solution) ? (
						<div className="solution" key="solution">
							<div className="score">
								{feedbacks.length === 0 ? null : (
									<div
										className={`feedback${
											responseType === 'pick-all'
												? ' is-pick-all-feedback'
												: ' is-not-pick-all-feedback'
										}`}
									>
										{feedbacks.map(model => {
											let Component = model.getComponentClass()
											return (
												<Component
													key={model.get('id')}
													model={model}
													moduleData={this.props.moduleData}
													responseType={responseType}
													isShowingExplanation
													questionSubmitted
													label={String.fromCharCode(
														sortedIds.indexOf(model.parent.get('id')) + 65
													)}
												/>
											)
										})}
									</div>
								)}
							</div>
							{isShowingExplanation ? (
								<Button altAction onClick={this.onClickHideExplanation} value="Hide Explanation" />
							) : solution ? (
								<Button
									altAction
									onClick={this.onClickShowExplanation}
									value="Read an explanation of the answer"
								/>
							) : null}
							<ReactCSSTransitionGroup
								component="div"
								transitionName="solution"
								transitionEnterTimeout={800}
								transitionLeaveTimeout={800}
							>
								{isShowingExplanation ? (
									<div className="solution-container" key="solution-component">
										<SolutionComponent model={solution} moduleData={this.props.moduleData} />
									</div>
								) : null}
							</ReactCSSTransitionGroup>
						</div>
					) : null}
				</ReactCSSTransitionGroup>
			</OboComponent>
		)
	}
}

function __guard__(value, transform) {
	return typeof value !== 'undefined' && value !== null ? transform(value) : undefined
}
