/* eslint-env mocha */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const Context = require('../../src/frontend/context')


const {DotMap, DotFun, DotFunMap} = require('../../src/backend/dotstores/unifiedDotstores')
const {ORMap, ORArray, MVReg} = require('../../src/backend/crdts/unifiedCRDTs')
const CausalContext = require('../../src/backend/causal-context')
const { VALUE } = require('../../src/backend/constants')

describe('check nesting ', () => {
	describe('check nesting map', () => {
		let ormap

		it('check nesting 1', () => {
            ormap = [new DotMap(ORMap.typename()), new CausalContext("r1")]
			let [f, _] = Context.genNestedObjectCreation({"hello": {"name": "2"}})
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
			let [f, _] = Context.genNestedObjectCreation([1, 2, 3])
			let delta = ORMap.applyToArray(f, "content", ormap)
			ormap = DotMap.join(ormap, delta)
			console.log(ORMap.value(ormap))
			expect(ORMap.value(ormap)).to.deep.equal(

				{"content": [new Set([1]), new Set([2]), new Set([3])] }
			)
		})
	})
})
