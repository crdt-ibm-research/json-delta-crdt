const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

// var sizeof = require('object-sizeof')
// const Automerge = require('automerge')
// const util = require('util')
// const Y = require('yjs')
// import * as Y from 'yjs'

const DCRDT = require('../../src/frontend/index')
const { BACKEND, DELTAS, DELTAS_CACHE_MODE, COMPRESSED_DELTAS, UNCOMPRESSED_DELTAS, REPLICA_ID } = require('../../src/frontend/constants')

const {DotMap, DotFun, DotFunMap} = require('../../src/backend/dotstores/unifiedDotstores')
const Peeler = require('../../src/frontend/peeler')
const {ORMap, ORArray, MVReg} = require('../../src/backend/crdts/unifiedCRDTs')
const CausalContext = require('../../src/backend/causal-context')


let doc = DCRDT.init({"REPLICA_ID": "R1" })
doc = DCRDT.change(doc, "test", doc => {
    doc.a = {"b": [1,2,3]}
})
console.log(DCRDT.documentValue(doc).a)

doc = DCRDT.change(doc, "test", doc => {
    delete doc.a.b[2]
})

console.log(DCRDT.documentValue(doc).a)

// expect(DCRDT.documentValue(doc)).to.deep.equal(
// {
//     "c": {
//         "hi": new Set(["bye"])
//     },
//     "a": {
//         "b": { "hi": new Set(["bye"]) }
//     }
// })
