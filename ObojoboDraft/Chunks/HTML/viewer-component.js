import './viewer-component.scss';

import katex from 'katex';

import Common from 'Common'
let { OboComponent } = Common.components;

export default class HTML {
	createMarkup() {
		let div = document.createElement('div');
		div.innerHTML = this.props.model.modelState.html;

		let latexes = div.querySelectorAll('.latex');

		for (let el of Array.from(latexes)) {
			el.innerHTML = katex.renderToString(el.innerHTML);
		}

		return { __html:div.innerHTML  };
	}

	render() {
		let data = this.props.model.modelState;

		return <OboComponent model={this.props.model} moduleData={this.props.moduleData}>
			<div className={`obojobo-draft--chunks--html viewer pad align-${data.align}`} dangerouslySetInnerHTML={this.createMarkup()} />
		</OboComponent>;
	}
}