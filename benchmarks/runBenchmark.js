const Automerge = require('automerge')
const Y = require('yjs')

const DCRDT = require('../src/frontend/index')
const Encoder = require('../src/frontend/encoder')


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

function runTest(test, yjsTest) {
    for (n=1; n<=524288; n = n*2) {
        // console.log(`Starting ${n}:`)
    
        docDelta = DCRDT.init({"REPLICA_ID": "R1"})
        docDelta = test(DCRDT, docDelta, n)
        docDeltaInspection = Encoder.encodeFrontend(docDelta).byteLength
        // console.log(`Size of docDelta: ${docinspection.length} bytes.`)
    
        docAutomerge = Automerge.init()
        docAutomerge = test(Automerge, docAutomerge, n)
        docAutomergeInspection = Automerge.save(docAutomerge).length
        // docAutomergeInspection = util.inspect(docAutomerge, INSPECT_OPTIONS)
        
        docYjs = new Y.Doc()
        docYjs = yjsTest(docYjs, n)
        docYjsInspection = Y.encodeStateAsUpdateV2(docYjs).byteLength
        // console.log(`Size of docYjs: ${docinspection.length} bytes.`)
    
        console.log(`${n},${docDeltaInspection},${docAutomergeInspection},${docYjsInspection}`)
    }
}

module.exports = { runTest }