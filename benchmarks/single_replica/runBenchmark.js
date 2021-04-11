const util = require('util')

// for verifying encode/decode
const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const Automerge = require('automerge')
const Y = require('yjs')

const DCRDT = require('../../src/frontend/index')
const Encoder = require('../../src/frontend/encoder')

function mapTest(lib, doc1, n) {
    doc1 = lib.change(doc1, "test" + n, doc => {
        doc.a = { '0' : 0}
    })
    for (i=0; i<n; i++) {
        doc1 = lib.change(doc1, "test" + n + i, doc => {
            doc.a['0'] = i
        })
    }
    return doc1
}

function jysTest(doc1, n) {
    // doc1.getMap('a') = { }
    for (i=0; i<n; i++) {
        doc1.getMap('a')['0'] = i
    }
    return doc1
}

//const encodedState = Encoder.encodeFrontend(doc);


let docDelta = DCRDT.init({"REPLICA_ID": "R1"})

let docAutomerge = Automerge.init()

let docYjs = new Y.Doc()

let docDeltaInspection, docAutomergeInspection, docYjsInspection

function runTest(test, yjsTest, maxN = 524288, log = false) {
    for (n=1; n<=maxN; n = n*2) {
        // console.log(`Starting ${n}:`)
    
        docDelta = DCRDT.init({"REPLICA_ID": "R1"})
        docDelta = test(DCRDT, docDelta, n)
        if (log) {
            console.log("DCRDT")
            console.log(DCRDT.documentValue(docDelta))
        }
        const encoded = Encoder.encodeFrontend(docDelta)
        docDeltaInspection = encoded.byteLength

        // decode and verify same content
        let decoded = Encoder.decodeFrontend(encoded)
        expect(DCRDT.documentValue(decoded)).to.deep.equal(DCRDT.documentValue(docDelta))

        // do another operation on both and check the document is still valid
        docDelta = DCRDT.change(docDelta, "test", doc => {
            doc.test = "true"
        })

        decoded = DCRDT.change(decoded, "test", doc => {
            doc.test = "true"
        })
        expect(DCRDT.documentValue(decoded)).to.deep.equal(DCRDT.documentValue(docDelta))

        // console.log(`Size of docDelta: ${docinspection.length} bytes.`)
    
        docAutomerge = Automerge.init()
        docAutomerge = test(Automerge, docAutomerge, n)
        if (log) {
            console.log("Automerge")
            console.log(util.inspect(docAutomerge, {showHidden: false, depth: null}))
        }
        docAutomergeInspection = Automerge.save(docAutomerge).length
        // docAutomergeInspection = util.inspect(docAutomerge, INSPECT_OPTIONS)
        
        docYjs = new Y.Doc()
        docYjs = yjsTest(docYjs, n)
        if (log) {
            console.log("yjs")
            console.log(util.inspect(docYjs.toJSON(), {showHidden: false, depth: null}))
        }
        docYjsInspection = Y.encodeStateAsUpdateV2(docYjs).byteLength
        // console.log(`Size of docYjs: ${docinspection.length} bytes.`)
    
        console.log(`${n},${docDeltaInspection},${docAutomergeInspection},${docYjsInspection}`)
    }
}

module.exports = { runTest }