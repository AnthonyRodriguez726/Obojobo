import './delete-button.scss'

import React from 'react'

export default class DeleteButton extends React.Component {
	static get defaultProps() {
		return { indent: 0 }
	}

	focus() {
		this.refs.button.focus()
	}

	render() {
		return (
			<div className="obojobo-draft--components--delete-button">
				<button
					ref="button"
					onClick={this.props.onClick}
					tabIndex={this.props.shouldPreventTab ? '-1' : this.props.tabIndex}
					disabled={this.props.shouldPreventTab}
				>
					{this.props.label || 'Delete'}
				</button>
			</div>
		)
	}
}
