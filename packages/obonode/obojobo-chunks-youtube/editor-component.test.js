import React from 'react'
import { mount } from 'enzyme'
import renderer from 'react-test-renderer'

import YouTube from './editor-component'

import ModalUtil from 'obojobo-document-engine/src/scripts/common/util/modal-util'
jest.mock('obojobo-document-engine/src/scripts/common/util/modal-util')

describe('YouTube Editor Node', () => {
	test('YouTube builds the expected component', () => {
		const component = renderer.create(
			<YouTube
				node={{
					data: {
						get: () => {
							return {}
						}
					}
				}}
			/>
		)
		const tree = component.toJSON()

		expect(tree).toMatchSnapshot()
	})

	test('YouTube component edits input', () => {
		const editor = {
			setNodeByKey: jest.fn()
		}

		const component = mount(
			<YouTube
				node={{
					data: {
						get: () => {
							return { videoId: 'mockId' }
						}
					}
				}}
				isFocused={true}
				isSelected={true}
				editor={editor}
			/>
		)

		component
			.find('button')
			.at(0)
			.simulate('click')

		const tree = component.html()

		expect(tree).toMatchSnapshot()
		expect(ModalUtil.show).toHaveBeenCalled()
	})

	test('handleSourceChange sets the nodes content', () => {
		const editor = {
			setNodeByKey: jest.fn()
		}

		const component = mount(
			<YouTube
				node={{
					data: {
						get: () => {
							return {}
						}
					}
				}}
				isFocused={true}
				isSelected={true}
				editor={editor}
			/>
		)

		component.instance().handleSourceChange('mockId')

		expect(editor.setNodeByKey).toHaveBeenCalled()
	})
})
