const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const CausalContext = require('../../src/backend/causal-context')
const Encoder = require('../../src/frontend/encoder')
const DCRDT = require('../../src/frontend/index')

describe('test document encoding ', () => {
    it('encode/decode causal context', () => {
        cc = new CausalContext("a")
        cc.insertDot(['a', 1])
        encoded = Encoder.encode(cc)

        decoded = Encoder.decode(encoded)
        expect(decoded.dotIn(['a', 1])).to.be.true()
    })

    it('encode/decode simple document', () => {
        let doc = DCRDT.from({"a": { "b": "c" }}, {"REPLICA_ID": "R1"})
        const encodedState = Encoder.encodeFrontend(doc);
        const decoded = Encoder.decodeFrontend(encodedState)
        expect(decoded.a.b).to.deep.equal("c")
    })

    it('encode/decode simple document 2', () => {
        let doc = DCRDT.from({"a": { "b": ["c"] }}, {"REPLICA_ID": "R1"})
        const encodedState = Encoder.encodeFrontend(doc);
        const decoded = Encoder.decodeFrontend(encodedState)
        expect(decoded.a.b[0]).to.deep.equal("c")
    })
})