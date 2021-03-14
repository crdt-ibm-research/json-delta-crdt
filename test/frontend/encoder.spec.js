const chai = require('chai')
const dirtyChai = require('dirty-chai')
const DCRDT = require('../../src/frontend/index')

const {DotMap, DotFun, DotFunMap} = require('../../src/backend/dotstores/unifiedDotstores')
const Peeler = require('../../src/frontend/peeler')
const {ORMap, ORArray, MVReg} = require('../../src/backend/crdts/unifiedCRDTs')
const CausalContext = require('../../src/backend/causal-context')
const Encoder = require('../../src/frontend/encoder')

const expect = chai.expect
chai.use(dirtyChai)

describe('test document encoding ', () => {
    it('simple document', () => {
        let doc = DCRDT.from({"a": { "b": "c" }}, {"REPLICA_ID": "R1"})
        const encodedState = Encoder.encodeFrontend(doc);
        const documentSize = encodedState.byteLength
        console.log("doc size")
        console.log(documentSize)
        const decoded = Encoder.decodeFrontend(encodedState)
    })
})