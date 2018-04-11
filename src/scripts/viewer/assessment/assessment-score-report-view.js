require('./assessment-score-report-view.scss')

const GREAT_JOB_YOU_ROCK_EMOJI = '😎'

const scoreReportView = props => {
	return (
		<div className="obojobo-draft--sections--assessment--components--score-report">
			<div className="text-items">{props.report.textItems.map(getItemEl)}</div>
			{props.report.scoreChangeDescription === null ? null : (
				<span className="score-change-description">{props.report.scoreChangeDescription}</span>
			)}
		</div>
	)
}

const getAmountEl = (value, isTotalOf100 = false) => {
	if (value === 'Did Not Pass') {
		return <span className="amount is-null">Did Not Pass</span>
	}

	if (isTotalOf100) {
		return (
			<div className="amount is-number">
				{value}%<span className="great-job-you-rock">{GREAT_JOB_YOU_ROCK_EMOJI}</span>
			</div>
		)
	}

	return <span className="amount is-number">{value}%</span>
}

const getItemEl = item => {
	switch (item.type) {
		case 'text':
			return <div className="text">{item.text}</div>

		case 'divider':
			return <hr className="divider" />

		case 'extra-credit':
			return (
				<div className="extra-credit">
					<span className="label">
						<span>Extra-credit</span> - {item.text}
					</span>
					{getAmountEl('+' + item.value)}
				</div>
			)

		case 'penalty':
			return (
				<div className="penalty">
					<span className="label">
						<span>Penalty</span> - {item.text}
					</span>
					{getAmountEl('-' + item.value)}
				</div>
			)

		case 'value':
		case 'total':
			return (
				<div className={item.type}>
					<div className="label">{item.text}</div>
					{getAmountEl(item.value, item.type === 'total' && item.value === '100')}
				</div>
			)
	}
}

export default scoreReportView
