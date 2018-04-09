const ScoreStore = require('../../../src/scripts/viewer/stores/score-store').default
const ScoreUtil = require('../../../src/scripts/viewer/util/score-util').default
const OboModel = require('../../../src/scripts/common/models/obo-model').default
const Dispatcher = require('../../../src/scripts/common/flux/dispatcher')

jest.mock('../../../src/scripts/viewer/util/api-util', () => ({
	postEvent: jest.fn()
}))

jest.mock('../../../src/scripts/common/models/obo-model', () => ({
	models: {
		test: {
			getRoot: jest.fn()
		}
	}
}))

jest.mock('../../../src/scripts/common/flux/dispatcher', () => ({
	trigger: jest.fn(),
	on: jest.fn()
}))

describe('ScoreUtil', () => {
	beforeEach(() => {
		ScoreStore.init()
	})

	it("should return a null score for a model that doesn't have a score associated with it", () => {
		let fakeModel = {
			get: () => 'test'
		}

		let score = ScoreUtil.getScoreForModel(ScoreStore.getState(), fakeModel)

		expect(score).toBe(null)
	})

	it('should return a score for a model that has a score associated with it', () => {
		let fakeModel = {
			get: () => 'test'
		}

		ScoreStore.setState({
			scores: {
				test: {
					id: 'uuid',
					itemId: 'test',
					score: 50
				}
			}
		})

		let score = ScoreUtil.getScoreForModel(ScoreStore.getState(), fakeModel)

		expect(score).toBe(50)
	})

	it('should set scores', () => {
		ScoreUtil.setScore('test', 50)

		expect(Dispatcher.trigger).toHaveBeenCalledWith(
			'score:set',
			expect.objectContaining({
				value: {
					itemId: 'test',
					score: 50
				}
			})
		)
	})

	it('should clear scores', () => {
		ScoreUtil.setScore('test', 50)
		ScoreUtil.clearScore('test')

		expect(ScoreStore.getState()).toEqual({ scores: {} })
	})
})
