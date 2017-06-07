import './viewer-component.scss';

export default class QuestionContent extends React.Component {
	render() {
		return <div
			className="obojobo-draft--chunks--mc-question--content"
		>
			{
				this.props.model.children.models.slice(0, this.props.model.children.models.length - 1).map(((child, index) => {
					let Component = child.getComponentClass();
					return <Component key={child.get('id')} model={child} moduleData={this.props.moduleData} />;
				}))
			}
		</div>;
	}
}