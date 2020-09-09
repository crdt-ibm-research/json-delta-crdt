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

describe('ormap', () => {
	describe('local', () => {
		let ormap

		it('type can be created', () => {
			ormap = [new DotMap(ORMap.typename()), new CausalContext("r1")] 
		})

		it('starts empty', () => {
			expect(ORMap.value(ormap)).to.deep.equal({})
		})

		it('can apply a causal CRDT', () => {
			const sub = function ([m,cc]) {	return MVReg.write("1", [m,cc])	}
			const delta = ORMap.apply(sub, "a", ormap)

			ormap = DotMap.join(ormap, delta)
			expect(ORMap.value(ormap)).to.deep.equal(
				{"a" : new Set("1")}
			)
		})

		it('can apply a causal CRDT again', () => {
			const sub = function ([m,cc]) {	return MVReg.write("2", [m,cc])	}
			const delta = ORMap.apply(sub, "a", ormap)
			ormap = DotMap.join(ormap, delta)
			expect(ORMap.value(ormap)).to.deep.equal(
				{"a" : new Set("2")}
			)
		})

		it('can remove', () => {
			const delta = ORMap.remove("a", ormap)
			ormap = DotMap.join(ormap, delta)
			expect(ORMap.value(ormap)).to.deep.equal({})
		})

		it('can embed another ormap', () => {
			const sub = ORMap.create
			const delta = ORMap.apply(sub, "a", ormap)
			ormap = DotMap.join(ormap, delta)
			expect(ORMap.value(ormap)).to.deep.equal({ "a" : {}})

			// doc.a.a = 1
			const write1 = function ([m,cc]) {	return MVReg.write("1", [m,cc])	}
			const sub1 = function([m,cc]) { return ORMap.apply(write1, "a", [m,cc])}
			const d1 = ORMap.apply(sub1, "a", ormap)
			ormap = DotMap.join(ormap, d1)

			//doc.a.b = 1
			const write2 = function ([m,cc]) {	return MVReg.write("2", [m,cc])	}
			const sub2 = function([m,cc]) { return ORMap.apply(write2, "b", [m,cc])}
			const d2 = ORMap.apply(sub2, "a", ormap)
			ormap = DotMap.join(ormap, d2)

			expect(ORMap.value(ormap)).to.deep.equal(
				{"a" : {
					"a" : new Set(["1"]),
					"b" : new Set(["2"]),
				}
			})

			const clear = ORMap.clear
			const d3 = ORMap.apply(clear, "a", ormap)
			ormap = DotMap.join(ormap, d3)
			expect(ORMap.value(ormap)).to.deep.equal({ "a" : {}})

			const d4 = ORMap.remove("a", ormap)
			ormap = DotMap.join(ormap, d4)
			expect(ORMap.value(ormap)).to.deep.equal({})
		})
	})
})

describe('together', () => {
	let replica1, replica2
  let deltas = [[], []]
		
	before(() => {
		replica1 = [new DotMap(ORMap.typename()), new CausalContext("r1")]
		replica2 = [new DotMap(ORMap.typename()), new CausalContext("r2")] 
	})

	it('values can be written concurrently', () => {
		const sub1 = function ([m,cc]) {	return MVReg.write("1", [m,cc])	}
		deltas[0].push(ORMap.apply(sub1, "a", replica1))
		replica1 = DotMap.join(replica1, deltas[0][0])
		deltas[0].push(ORMap.apply(sub1, "both", replica1))
		replica1 = DotMap.join(replica1, deltas[0][1])

		const sub2 = function ([m,cc]) {	return MVReg.write("2", [m,cc])	}
		deltas[1].push(ORMap.apply(sub2, "A", replica2))
		replica2 = DotMap.join(replica2, deltas[1][0])
		deltas[1].push(ORMap.apply(sub2, "both", replica2))
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
	 	const writeDelta = ORMap.apply(sub, "a", replica1)
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
		const d1 = ORMap.apply(sub1, "both", replica1)
		replica1 = DotMap.join(replica1, d1)
		replica2 = DotMap.join(replica2, d1)

		expect(ORMap.value(replica1)).to.deep.equal({
			a : new Set(["3"]),
			A : new Set(["2"]),
			both : new Set(["3"])
		 })

	})


//     it('keeps causality', () => {
//       const delta = replica1.applySub('a', 'mvreg', 'write', 'AA')
//       expect(replica1.value().a).to.deep.equal(new Set(['AA']))

//       replica2.apply(delta)
//       expect(replica2.value().a).to.deep.equal(new Set(['AA']))
//     })

//     it('add wins', () => {
//       const delta1 = replica1.remove('b')
//       expect(replica1.value().b).to.not.exist()
//       const delta2 = replica2.applySub('b', 'mvreg', 'write', 'BB')
//       expect(replica2.value().b).to.deep.equal(new Set(['BB']))
//       replica1.apply(transmit(delta2))
//       replica2.apply(transmit(delta1))
//       expect(replica2.value().b).to.deep.equal(new Set(['BB']))
//       expect(replica1.value().b).to.deep.equal(new Set(['BB']))
//       // expect(replica1.state().state.get('b')).instanceof(DotSet)
//       expect(replica1.state().dotstore.get('b')).instanceof(DotFun)
//     })

//     it('removals are stored in state', () => {
//       replica1.remove('b')
//       expect(replica1.value().b).to.not.exist()
//       replica2.apply(replica1.state())
//       expect(replica2.value().b).to.not.exist()
//     })
})