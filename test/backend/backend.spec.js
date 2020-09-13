/* eslint-env mocha */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)


const DotMap = require('../../src/backend/dotstores/dot-map')
const ORMap = require('../../src/backend/crdts/ormap')
const CausalContext = require('../../src/backend/causal-context')
const MVReg = require('../../src/backend/crdts/mvreg')
const { VALUE } = require('../../src/backend/constants')
const ORArray = require('../../src/backend/crdts/orarray')
const JsonRegister = require('../../src/backend/JsonObjects/JsonRegister')
const JsonMap = require('../../src/backend/JsonObjects/JsonMap')
const JsonArray = require('../../src/backend/JsonObjects/JsonArray')
const Backend = require('../../src/backend')

describe('backend', () => {
	describe('local', () => {
		let backend

		it('type can be created', () => {
			backend = new Backend("r1")
        })
        
        it('starts empty', () => {
            // implicit: doc = {}
            expect(backend.getObject()).to.deep.equal({})
        })

        it('can create an array', () => {
            // doc.a = []
            const createArray = JsonArray.create()
            const insertArray = JsonMap.applyToArray(createArray, "a")
            backend.applyMutator(insertArray)
            expect(backend.getObject()).to.deep.equal({"a" : []})
        })

        it('can update array', () => {
            // doc.a.push("b")
            const writeB = JsonRegister.write("b")
            const insertToArray = JsonArray.insertValue(writeB, 0)
            const updateKey = JsonMap.applyToArray(insertToArray, "a")
            backend.applyMutator(updateKey)
            expect(backend.getObject()).to.deep.equal({
                "a" : [new Set(["b"])]
            })
        })

	})
})
