/* eslint-env mocha */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const Peeler = require('../../src/frontend/peeler')
const Proxies = require('../../src/frontend/proxies')

const {DotMap, DotFun, DotFunMap} = require('../../src/backend/dotstores/unifiedDotstores')
const {ORMap, ORArray, MVReg} = require('../../src/backend/crdts/unifiedCRDTs')
const CausalContext = require('../../src/backend/causal-context')
const { VALUE } = require('../../src/backend/constants')

describe('check frontend ', () => {
	describe('check nesting map', () => {
		let ormap

		it('check empty nesting', () => {
			ormap = ORMap.create([null, new CausalContext("r1")])//[new DotMap(ORMap.typename()), new CausalContext("r1")]
			let [f, _] = Peeler.genNestedObjectCreation({ })
			let delta = ORMap.applyToMap(f, "content", ormap)
			ormap = DotMap.join(ormap, delta)
			expect(ORMap.value(ormap)).to.deep.equal(
				
				{"content": { } }
			)
		})

		it('check nesting 1', () => {
			ormap = ORMap.create([null, new CausalContext("r1")])//[new DotMap(ORMap.typename()), new CausalContext("r1")]
			let [f, _] = Peeler.genNestedObjectCreation({"hello": {"name": "2"}})
			let delta = ORMap.applyToMap(f, "content", ormap)
			ormap = DotMap.join(ormap, delta)
			expect(ORMap.value(ormap)).to.deep.equal(
				
				{"content": {"hello": {"name": new Set("2")}}}
			)
		})
	})

	describe('check empty array', () => {
		let ormap
		it('check nesting 2', () => {
			ormap = [new DotMap(ORMap.typename()), new CausalContext("r1")]
			let [f, _] = Peeler.genNestedObjectCreation([ ])
			let delta = ORMap.applyToArray(f, "content", ormap)
			ormap = DotMap.join(ormap, delta)
			//console.log(ORMap.value(ormap))
			expect(ORMap.value(ormap)).to.deep.equal(

				{"content": [ ] }
			)
		})
	})

	describe('check array in map', () => {
		let ormap
		it('check nesting 2', () => {
			ormap = [new DotMap(ORMap.typename()), new CausalContext("r1")]
			let [f, _] = Peeler.genNestedObjectCreation([1, 2, 3])
			let delta = ORMap.applyToArray(f, "content", ormap)
			ormap = DotMap.join(ormap, delta)
			//console.log(ORMap.value(ormap))
			expect(ORMap.value(ormap)).to.deep.equal(

				{"content": [new Set([1]), new Set([2]), new Set([3])] }
			)
		})
	})


	describe('check empty proxy', () => {
		let ormap
		it('check proxy 1', () => {
			let cc = new CausalContext("r1")
			ormap = [new DotMap(ORMap.typename()), cc]
            let deltaMap = ORMap.create([null, cc])
            ormap = DotMap.join(ormap, deltaMap)

			let context = {}
			context.doc = ormap
			let rootProxy = Proxies.createRootObjectProxy(context)

			expect(ORMap.value(context.doc)).to.deep.equal(
				{ }
			)
		})
	})

	describe('check proxy', () => {
		let ormap
		it('check proxy 1', () => {
			ormap = [new DotMap(ORMap.typename()), new CausalContext("r1")]
			let context = {}
			context.doc = ormap
			let rootProxy = Proxies.createRootObjectProxy(context)
			let callback = doc => {
				doc.a = {"b": { "c": 7 }}
				doc.a.b.c = 5
				doc.a.b = {"hi": "bye"}
			}
			callback(rootProxy)
			expect(ORMap.value(context.doc)).to.deep.equal(

				{"a": {"b": {"hi": new Set(["bye"])} }}
			)
		}),
		it('check proxy 1', () => {
			ormap = [new DotMap(ORMap.typename()), new CausalContext("r1")]
			let context = {}
			context.doc = ormap
			let rootProxy = Proxies.createRootObjectProxy(context)
			let callback = doc => {
				doc.a = {"b": { "c": 7 }}
				doc.a.b.c = 5
				doc.a.b = {"hi": "bye"}
			}
			callback(rootProxy)
			expect(ORMap.value(context.doc)).to.deep.equal(

				{"a": {"b": {"hi": new Set(["bye"])} }}
			)
		})
	})


})
