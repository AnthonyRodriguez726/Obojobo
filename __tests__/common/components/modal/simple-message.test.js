import { shallow } from 'enzyme'
import React from 'react'
import SimpleMessage from '../../../../src/scripts/common/components/modal/simple-message'
import renderer from 'react-test-renderer'

test('SimpleMessage', () => {
	const component = renderer.create(
		<SimpleMessage
			buttonLabel="Label"
			confirm="confirm"
			modal={{
				onButtonClick: jest.fn()
			}}
		>
			Content
		</SimpleMessage>
	)
	let tree = component.toJSON()

	expect(tree).toMatchSnapshot()
})

test('Question confirm click', () => {
	let onClick = jest.fn()

	const component = shallow(
		<SimpleMessage
			buttonLabel="Label"
			confirm="confirm"
			modal={{
				onButtonClick: onClick
			}}
		>
			Content
		</SimpleMessage>
	)

	let button = component.find('button')

	button.simulate('click')

	expect(onClick).toHaveBeenCalledWith('confirm')
})
