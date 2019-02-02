import React from 'react'
import renderer from 'react-test-renderer'

import { shallow } from 'enzyme'

jest.mock('obojobo-document-engine/src/scripts/viewer/util/nav-util')

import Page from './viewer-component'
import OboModel from 'obojobo-document-engine/src/scripts/common/models/obo-model'
import NavUtil from 'obojobo-document-engine/src/scripts/viewer/util/nav-util'

require('./viewer') // used to register this oboModel
require('obojobo-chunks-break/viewer') // // dependency on Obojobo.Chunks.Break

describe('Page', () => {
	beforeEach(() => {
		jest.resetAllMocks()
	})

	test('Page component', () => {
		const model = OboModel.create({
			id: 'id',
			type: 'ObojoboDraft.Pages.Page',
			children: [
				{
					id: 'child',
					type: 'ObojoboDraft.Chunks.Break'
				}
			]
		})

		const moduleData = {
			focusState: {}
		}

		const component = renderer.create(<Page model={model} moduleData={moduleData} />)
		const tree = component.toJSON()

		expect(tree).toMatchSnapshot()
	})

	test('componentWillRecieveProps does nothing when target ids are the same', () => {
		const moduleData = {
			navState: {
				navTargetId: 'mockId'
			}
		}
		const newModuleData = {
			navState: {
				navTargetId: 'mockId'
			}
		}
		const model = OboModel.create({
			id: 'id',
			type: 'ObojoboDraft.Pages.Page',
			children: [
				{
					id: 'child',
					type: 'ObojoboDraft.Chunks.Break'
				}
			]
		})

		const component = shallow(<Page model={model} moduleData={moduleData} />)

		// calls componentWillRecieveProps()
		component.setProps({ moduleData: newModuleData })

		expect(NavUtil.setFlag).not.toHaveBeenCalled()
	})

	test('componentWillRecieveProps calls NavUtil when ids are different', () => {
		const moduleData = {
			navState: {
				navTargetId: 'mockId'
			}
		}
		const newModuleData = {
			navState: {
				navTargetId: 'mockDifferentId'
			}
		}
		const model = OboModel.create({
			id: 'id',
			type: 'ObojoboDraft.Pages.Page',
			children: [
				{
					id: 'child',
					type: 'ObojoboDraft.Chunks.Break'
				}
			]
		})

		const component = shallow(<Page model={model} moduleData={moduleData} />)

		// calls componentWillRecieveProps()
		component.setProps({ moduleData: newModuleData })

		expect(NavUtil.setFlag).toHaveBeenCalledWith('mockId', 'visited', true)
	})
})
