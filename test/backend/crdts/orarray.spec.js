/* eslint-env mocha */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)


const DotMap = require('../../../src/backend/dotstores/dot-map')
const ORMap = require('../../../src/backend/crdts/ormap')
const CausalContext = require('../../../src/backend/causal-context')
const MVReg = require('../../../src/backend/crdts/mvreg')
const { VALUE } = require('../../../src/backend/constants')
const ORArray = require('../../../src/backend/crdts/orarray')

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
            const d1 = ORArray.insertValue("a", writeA, 0.5, orarray)

            orarray = DotMap.join(orarray, d1)
			expect(ORArray.value(orarray)).to.deep.equal([new Set(["a"])])
		})

		it('can apply a causal CRDT again', () => {
            const writeB = function ([m,cc]) {	return MVReg.write("b", [m,cc])	}
            const d1 = ORArray.applyToValue("a", writeB, 0.5, orarray)

            orarray = DotMap.join(orarray, d1)
            expect(ORArray.value(orarray)).to.deep.equal([new Set(["b"])])
		})

		it('can remove', () => {
			const delta = ORArray.delete("a", orarray)
			orarray = DotMap.join(orarray, delta)
			expect(ORArray.value(orarray)).to.deep.equal([])
		})
/*
		it('can embed another ormap', () => {
			const sub = ORMap.create
			const delta = ORMap.applyToMap(sub, "a", ormap)
			ormap = DotMap.join(ormap, delta)
			expect(ORMap.value(ormap)).to.deep.equal({ "a" : {}})

			// doc.a.a = 1
			const write1 = function ([m,cc]) {	return MVReg.write("1", [m,cc])	}
			const sub1 = function([m,cc]) { return ORMap.applyToValue(write1, "a", [m,cc])}
			const d1 = ORMap.applyToMap(sub1, "a", ormap)
			ormap = DotMap.join(ormap, d1)

			//doc.a.b = 2
			const write2 = function ([m,cc]) {	return MVReg.write("2", [m,cc])	}
			const sub2 = function([m,cc]) { return ORMap.applyToValue(write2, "b", [m,cc])}
			const d2 = ORMap.applyToMap(sub2, "a", ormap)
			ormap = DotMap.join(ormap, d2)

			expect(ORMap.value(ormap)).to.deep.equal(
				{"a" : {
					"a" : new Set(["1"]),
					"b" : new Set(["2"]),
				}
			})

			const clear = ORMap.clear
			const d3 = ORMap.applyToMap(clear, "a", ormap)
			ormap = DotMap.join(ormap, d3)
			expect(ORMap.value(ormap)).to.deep.equal({ "a" : {}})

			const d4 = ORMap.remove("a", ormap)
			ormap = DotMap.join(ormap, d4)
			expect(ORMap.value(ormap)).to.deep.equal({})
        })
        */
	})
})
/*
describe('together', () => {
	let replica1, replica2
  let deltas = [[], []]
		
	before(() => {
		replica1 = [new DotMap(ORMap.typename()), new CausalContext("r1")]
		replica2 = [new DotMap(ORMap.typename()), new CausalContext("r2")] 
	})

	it('values can be written concurrently', () => {
		const sub1 = function ([m,cc]) { return MVReg.write("1", [m,cc]) }
		deltas[0].push(ORMap.applyToValue(sub1, "a", replica1))
		replica1 = DotMap.join(replica1, deltas[0][0])
		deltas[0].push(ORMap.applyToValue(sub1, "both", replica1))
		replica1 = DotMap.join(replica1, deltas[0][1])

		const sub2 = function ([m,cc]) { return MVReg.write("2", [m,cc]) }
		deltas[1].push(ORMap.applyToValue(sub2, "A", replica2))
		replica2 = DotMap.join(replica2, deltas[1][0])
		deltas[1].push(ORMap.applyToValue(sub2, "both", replica2))
		replica2 = DotMap.join(replica2, deltas[1][1])
	})

  it('each replica has its own values', () => {
		expect(ORMap.value(replica1)).to.deep.equal(
			{"a" : new Set(["1"]),
			"both" : new Set(["1"])}
		)

		expect(ORMap.value(replica2)).to.deep.equal(
			{"A" : new Set(["2"]),
			"both" : new Set(["2"])}
		)
	})

//     it('changes can be raw joined', () => {
//       const state = ORMap('joiner').join(transmit(replica1.state()), transmit(replica2.state()))
//       const replica = ORMap('replica')
//       replica.apply(state)
//       expect(replica.value()).to.deep.equal({
//         a: new Set(['a', 'A']),
//         b: new Set(['b', 'B']),
//         c: new Set(['c', 'C']) })
//     })

	it('the first converges', () => {
		deltas[1].forEach((delta) => replica1 = DotMap.join(replica1, delta))
		expect(ORMap.value(replica1)).to.deep.equal({
			a : new Set(["1"]),
			A : new Set(["2"]),
			both : new Set(["1", "2"])
		})
	})

	it('the second converges', () => {
		deltas[0].forEach((delta) => replica2 = DotMap.join(replica2, delta))
		expect(ORMap.value(replica2)).to.deep.equal({
			a : new Set(["1"]),
			A : new Set(["2"]),
			both : new Set(["1", "2"])
		})
	})

	it('obeys OR semantics', () => {
		const sub = function ([m,cc]) {	return MVReg.write("3", [m,cc])	}
		const writeDelta = ORMap.applyToValue(sub, "a", replica1)
		replica1 = DotMap.join(replica1, writeDelta)


		const removeDelta = ORMap.remove("a", replica2)
		replica2 = DotMap.join(replica2, removeDelta)
		expect(ORMap.value(replica2)).to.deep.equal({
			A : new Set(["2"]),
			both : new Set(["1", "2"])
		})

		replica2 = DotMap.join(replica2, writeDelta)
		expect(ORMap.value(replica2)).to.deep.equal({
			a : new Set(["3"]),
			A : new Set(["2"]),
			both : new Set(["1", "2"])
			})
		replica1 = DotMap.join(replica1, removeDelta)

		const sub1 = function ([m,cc]) {	return MVReg.write("3", [m,cc])	}
		const d1 = ORMap.applyToValue(sub1, "both", replica1)
		replica1 = DotMap.join(replica1, d1)
		replica2 = DotMap.join(replica2, d1)

		expect(ORMap.value(replica1)).to.deep.equal({
			a : new Set(["3"]),
			A : new Set(["2"]),
			both : new Set(["3"])
		})
	})

	it('can have a datatype conflict', () => {
		var sub = ORMap.create
		const d1 = ORMap.applyToMap(sub, "conflict", replica1)
		replica1 = DotMap.join(replica1, d1)
		expect(ORMap.value(replica1)).to.deep.equal({
			a : new Set(["3"]),
			both : new Set(["3"]),
			A : new Set(["2"]),
			conflict : {}
		})

		sub = function ([m,cc]) { return MVReg.write("1", [m,cc]) }
		const d2 = ORMap.applyToValue(sub, "conflict", replica2)
		replica2 = DotMap.join(replica2, d2)
		expect(ORMap.value(replica2)).to.deep.equal({
			a : new Set(["3"]),
			A : new Set(["2"]),
			both : new Set(["3"]),
			conflict : new Set(["1"])
		})

		replica2 = DotMap.join(replica2, d1)
		replica1 = DotMap.join(replica1, d1)
		expect(ORMap.value(replica1)).to.deep.equal(ORMap.value(replica2))
		expect(ORMap.value(replica1)).to.deep.equal({
			a : new Set(["3"]),
			both : new Set(["3"]),
			A : new Set(["2"]),
			conflict : {}
		})

		// Type conflict handler expects this to be defined
		expect(replica2[0].state.get("conflict").has(VALUE)).to.equal(true)
	})

	it('can resolve a datatype conflict', () => {
		const sub = function ([m,cc]) { return MVReg.write("1", [m,cc]) }
		const d3 = ORMap.applyToValue(sub, "conflict", replica2)
		replica2 = DotMap.join(replica2, d3)
		replica1 = DotMap.join(replica1, d3)
		expect(ORMap.value(replica2)).to.deep.equal({
			a : new Set(["3"]),
			A : new Set(["2"]),
			both : new Set(["3"]),
			conflict : new Set(["1"])
		})
	})
})
*/