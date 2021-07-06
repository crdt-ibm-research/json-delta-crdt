/* eslint-env mocha */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const { ORArray, MVReg} = require('../../../src/backend/crdts')
const { DotMap } = require('../../../src/backend/dotstores')
const CausalContext = require('../../../src/backend/causal-context')
const Position = require('../../../src/backend/utils/position')

describe('orarray', () => {
	describe('local', () => {
		let orarray

		it('type can be created', () => {
			orarray = [new DotMap(ORArray.typename()), new CausalContext("r1")] 
		})

		it('starts empty', () => {
			expect(ORArray.value(orarray)).to.deep.equal([])
		})

		it('can apply a causal CRDT', () => {
			const writeA = function ([m,cc]) {	return MVReg.write("a", [m,cc])	}
            const d1 = ORArray.insertValue("a", writeA, [["r1", 17]], orarray)

            orarray = DotMap.join(orarray, d1)
			expect(ORArray.value(orarray)).to.deep.equal([new Set(["a"])])
		})

		it('can apply a causal CRDT again', () => {
            const writeB = function ([m,cc]) {	return MVReg.write("b", [m,cc])	}
            const d1 = ORArray.applyToValue("a", writeB, [["r1", 17]], orarray)

            orarray = DotMap.join(orarray, d1)
            expect(ORArray.value(orarray)).to.deep.equal([new Set(["b"])])
		})

		it('can remove', () => {
			const delta = ORArray.delete("a", orarray)
			orarray = DotMap.join(orarray, delta)
			expect(ORArray.value(orarray)).to.deep.equal([])
		})

		it('can move', () => {
			const writeA = function ([m,cc]) {	return MVReg.write("a", [m,cc])	}
			let p = new Position( [ [ 55, 'r1' ] ])
			const d1 = ORArray.insertValue("a", writeA, p, orarray)
			orarray = DotMap.join(orarray, d1)

			const writeB = function ([m,cc]) {	return MVReg.write("b", [m,cc])	}
			p = new Position( [ [ 80, 'r1' ] ])
			const d2 = ORArray.insertValue("b", writeB, p, orarray)
            orarray = DotMap.join(orarray, d2)

			expect(ORArray.value(orarray)).to.deep.equal([new Set(["a"]), new Set(["b"])])

			p = new Position( [ [ 150, 'r1' ] ])
			const d3 = ORArray.move("a", p, orarray)
			orarray = DotMap.join(orarray, d3)

			expect(ORArray.value(orarray)).to.deep.equal([new Set(["b"]), new Set(["a"])])

		})
	})
})
