/* eslint-env mocha */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)



const { VALUE } = require('../../src/backend/constants')
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

        it('can create a map', () => {
            // doc.a = []
            const createArray = JsonMap.create()
            const insertArray = JsonMap.applyToMap(createArray, "m")
            backend.applyMutator(insertArray)
            expect(backend.getObject()).to.deep.equal({
                "a" : [new Set(["b"])],
                "m" : {}
            })
        })

        it('can update array again', () => {
            // doc.a.push("c")
            const writeC = JsonRegister.write("c")
            const insertToArray = JsonArray.insertValue(writeC, 1)
            const updateKey = JsonMap.applyToArray(insertToArray, "a")
            backend.applyMutator(updateKey)
            console.log(backend.getObject().a)

            expect(backend.getObject().a).to.deep.equal(
                [new Set(["b"]), new Set(["c"])]
            )
        })

        it('can update position in array', () => {
            // doc.a.move(0 ,2)
            const move = JsonArray.move(0, 2)
            const updateKey = JsonMap.applyToArray(move, "a")
            backend.applyMutator(updateKey)
            console.log(backend.getObject().a)
            expect(backend.getObject().a).to.deep.equal(
                [new Set(["c"]), new Set(["b"])]
            )
        })

	})
})
