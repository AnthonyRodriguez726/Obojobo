import MCChoiceAdapter from '../../../../../ObojoboDraft/Chunks/MCAssessment/MCChoice/adapter'

describe('MCChoice adapter', () => {
	test('Sets modelState with default values', () => {
		let model = { modelState: {} }
		MCChoiceAdapter.construct(model)
		expect(model.modelState).toMatchObject({ score: '' })
	})

	test('sets modelState with given values', () => {
		let model = { modelState: {} }
		MCChoiceAdapter.construct(model, { content: { score: 999 } })
		expect(model.modelState).toMatchObject({ score: 999 })
	})

	test('clones successfully', () => {
		let a = { modelState: {} }
		let b = { modelState: {} }

		MCChoiceAdapter.construct(a, { content: { score: 999 } })
		MCChoiceAdapter.clone(a, b)

		expect(a).not.toBe(b)
		expect(a.modelState).toMatchObject(b.modelState)
	})

	test.only('toJSON returns an json-able representation', () => {
		let model = { modelState: {} }
		let attrs = { content: { score: 777 } }
		let json = { content: {} }

		MCChoiceAdapter.construct(model, attrs)
		MCChoiceAdapter.toJSON(model, json)

		expect(json).toMatchObject({ content: { score: 777 } })
	})
})
