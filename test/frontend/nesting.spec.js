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

		it('check nesting 1', () => {
            ormap = [new DotMap(ORMap.typename()), new CausalContext("r1")]
			let [f, _] = Peeler.genNestedObjectCreation({"hello": {"name": "2"}})
            let delta = ORMap.applyToMap(f, "content", ormap)
            ormap = DotMap.join(ormap, delta)
			console.log(ormap)
			expect(ORMap.value(ormap)).to.deep.equal(
				
				{"content": {"hello": {"name": new Set("2")}}}
			)
		})
	})

	describe('check array in map', () => {
		let ormap
		it('check nesting 1', () => {
			ormap = [new DotMap(ORMap.typename()), new CausalContext("r1")]
			let [f, _] = Peeler.genNestedObjectCreation([1, 2, 3])
			let delta = ORMap.applyToArray(f, "content", ormap)
			ormap = DotMap.join(ormap, delta)
			console.log(ORMap.value(ormap))
			expect(ORMap.value(ormap)).to.deep.equal(

				{"content": [new Set([1]), new Set([2]), new Set([3])] }
			)
		})
	})


	describe('check proxy', () => {
		let ormap
		it('check proxy 1', () => {
			ormap = [new DotMap(ORMap.typename()), new CausalContext("r1")]
			let rootProxy = Proxies.createRootObjectProxy(ormap)
			let callback = doc => {
				doc.a = {"b": { "c": 7 }}
				//console.log("after first set, proxy", doc)
				//console.log("after first set, doc.a", doc.a)
				//doc.a.b.c = 5
				//doc.a.b = {"hi": "bye"}
			}
			callback(rootProxy)
			let itr = Object.getOwnPropertyNames(rootProxy)
			console.log("itr: ", itr)
			for (const key of itr) {
				console.log("loop, key: ", key)
			}

			//console.log("after callback, ormap:", ormap)
			//console.log("after callback, rootProxy.a", rootProxy.a)
			//console.log("after callback, ORMap.value(rootProxy.a):", ORMap.value(rootProxy.a))
			expect(ORMap.value(rootProxy.a)).to.deep.equal(

				{"b": {"c": new Set([7])} }
			)
			/*
			expect(ORMap.value(ormap)).to.deep.equal(

				{"a": {"b": {"hi": new Set("bye")} } }
			)
			*/
		})
	})
})
