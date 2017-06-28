import StyleableText from '../../../src/scripts/common/text/styleable-text'
import StyleRange from '../../../src/scripts/common/text/style-range'

describe('StyleableText', function() {
	let st, st1, st2

	beforeEach(function() {
		st = new StyleableText('123456789ABCDEF')
		st.styleText('a', 5, 10, { href: 'website.com' })

		st1 = new StyleableText('abc')
		st1.styleText('a', 2, 3, { href: 'website.com' })

		st2 = new StyleableText('123')
		st2.styleText('a', 0, 1, { href: 'website.com' })
	})

	it('exports to an object', function() {
		expect(st.getExportedObject()).toEqual({
			value: '123456789ABCDEF',
			styleList: [
				{
					type: 'a',
					start: 5,
					end: 10,
					data: {
						href: 'website.com'
					}
				}
			]
		})
	})

	it('can set text', function() {
		st.setText('new text')

		expect(st.value).toEqual('new text')
		expect(st.styleList.length()).toBe(0)
	})

	it('can replace text', function() {
		st.replaceText(5, 10, '-12-')

		expect(st.value).toEqual('12345-12-BCDEF')
		expect(st.styleList.styles[0]).toEqual(new StyleRange(5, 9, 'a', { href: 'website.com' }))
	})

	it('can append text', function() {
		st.styleText('b', 5, st.length)
		st.appendText('xyz')

		expect(st.value).toEqual('123456789ABCDEFxyz')
		st.styleList.styles.map(function(range) {
			if (range.type === 'b') {
				expect(range).toEqual(new StyleRange(5, 18, 'b'))
			}
		})
	})

	it('move existing styles forward when inserting text before a style range', function() {
		st.insertText(5, 'abcde')

		expect(st.value).toEqual('12345abcde6789ABCDEF')
		expect(st.styleList.length()).toBe(1)
		expect(st.styleList.styles[0]).toEqual(new StyleRange(10, 15, 'a', { href: 'website.com' }))
	})

	it("doesn't modify styles when inserting text after a style range", function() {
		st.insertText(11, 'abcde')

		expect(st.value).toEqual('123456789ABabcdeCDEF')
		expect(st.styleList.length()).toBe(1)
		expect(st.styleList.styles[0]).toEqual(new StyleRange(5, 10, 'a', { href: 'website.com' }))
	})

	it('expands the range when inserting text at the ending edge of a style range', function() {
		st.insertText(10, 'abcde')

		expect(st.value).toEqual('123456789AabcdeBCDEF')
		expect(st.styleList.length()).toBe(1)
		expect(st.styleList.styles[0]).toEqual(new StyleRange(5, 15, 'a', { href: 'website.com' }))
	})

	it('removes styles when deleting the styled text', function() {
		st.deleteText(5, 10)

		expect(st.value).toEqual('12345BCDEF')
		expect(st.styleList.length()).toBe(0)
	})

	it('modifies styles when deleting a portion inside of the styled text', function() {
		st.deleteText(6, 10)

		expect(st.value).toEqual('123456BCDEF')
		expect(st.styleList.length()).toBe(1)
		expect(st.styleList.styles[0]).toEqual(new StyleRange(5, 6, 'a', { href: 'website.com' }))
	})

	it('modifies styles when deleting the left portion of the styled text', function() {
		st.deleteText(5, 9)

		expect(st.value).toEqual('12345ABCDEF')
		expect(st.styleList.length()).toBe(1)
		expect(st.styleList.styles[0]).toEqual(new StyleRange(5, 6, 'a', { href: 'website.com' }))
	})

	it('modifies styles when deleting the right portion of the styled text', function() {
		st.deleteText(6, 10)

		expect(st.value).toEqual('123456BCDEF')
		expect(st.styleList.length()).toBe(1)
		expect(st.styleList.styles[0]).toEqual(new StyleRange(5, 6, 'a', { href: 'website.com' }))
	})

	it('styles text', function() {
		st.styleText('a', 0, 5, { href: 'website.com' })

		expect(st.styleList.length()).toBe(1)
		expect(st.styleList.styles[0]).toEqual(new StyleRange(0, 10, 'a', { href: 'website.com' }))
	})

	it('unstyles text', function() {
		st.unstyleText('a', 6, 9)

		expect(st.styleList.length()).toBe(2)
		expect(st.getExportedObject().styleList).toEqual([
			{
				type: 'a',
				start: 5,
				end: 6,
				data: {
					href: 'website.com'
				}
			},
			{
				type: 'a',
				start: 9,
				end: 10,
				data: {
					href: 'website.com'
				}
			}
		])
	})

	it('first adds then removes style when toggled in a range larger than an existing style', function() {
		st.toggleStyleText('a', 0, 10, { href: 'website.com' })

		expect(st.styleList.length()).toBe(1)
		expect(st.styleList.styles[0]).toEqual(new StyleRange(0, 10, 'a', { href: 'website.com' }))

		st.toggleStyleText('a', 0, 10, { href: 'website.com' })

		expect(st.styleList.length()).toBe(0)
	})

	it('first removes then adds style when toggled in a range within an existing style', function() {
		st.toggleStyleText('a', 6, 9, { href: 'website.com' })

		expect(st.styleList.length()).toBe(2)
		expect(st.getExportedObject().styleList).toEqual([
			{
				type: 'a',
				start: 5,
				end: 6,
				data: {
					href: 'website.com'
				}
			},
			{
				type: 'a',
				start: 9,
				end: 10,
				data: {
					href: 'website.com'
				}
			}
		])

		st.toggleStyleText('a', 6, 9, { href: 'website.com' })

		expect(st.styleList.length()).toBe(1)
		expect(st.styleList.styles[0]).toEqual(new StyleRange(5, 10, 'a', { href: 'website.com' }))
	})

	it('first removes then adds style when toggled in a range exactly containing an existing style', function() {
		st.toggleStyleText('a', 5, 10, { href: 'website.com' })

		expect(st.styleList.length()).toBe(0)

		st.toggleStyleText('a', 5, 10, { href: 'website.com' })
		expect(st.styleList.length()).toBe(1)
		expect(st.styleList.styles[0]).toEqual(new StyleRange(5, 10, 'a', { href: 'website.com' }))
	})

	it('splits a styleable text', function() {
		let sibling = st.split(6)

		expect(st.value).toEqual('123456')
		expect(st.styleList.length()).toEqual(1)
		expect(st.styleList.styles[0]).toEqual(new StyleRange(5, 6, 'a', { href: 'website.com' }))

		expect(sibling.value).toEqual('789ABCDEF')
		expect(sibling.styleList.length()).toEqual(1)
		expect(sibling.styleList.styles[0]).toEqual(new StyleRange(0, 4, 'a', { href: 'website.com' }))
	})

	it('merges two styleable texts', function() {
		st1.merge(st2)

		let similar = new StyleableText('abc123')
		similar.styleText('a', 2, 4, { href: 'website.com' })

		expect(st1).toEqual(similar)
	})
})
