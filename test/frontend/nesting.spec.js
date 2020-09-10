/* eslint-env mocha */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const Context = require('../../src/frontend/context')


const DotMap = require('../../src/backend/dotstores/dot-map')
const ORMap = require('../../src/backend/crdts/ormap')
const CausalContext = require('../../src/backend/causal-context')
const MVReg = require('../../src/backend/crdts/mvreg')
const { VALUE } = require('../../src/backend/constants')

describe('check nesting ', () => {
	describe('check nesting ', () => {
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
})
