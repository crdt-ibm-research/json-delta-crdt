var sizeof = require('object-sizeof')
const Automerge = require('automerge')
const util = require('util')
const Y = require('yjs')
// import * as Y from 'yjs'

const DCRDT = require('../../src/frontend/index')
const { BACKEND, DELTAS, DELTAS_CACHE_MODE, COMPRESSED_DELTAS, UNCOMPRESSED_DELTAS, REPLICA_ID } = require('../../src/frontend/constants')

const {DotMap, DotFun, DotFunMap} = require('../../src/backend/dotstores/unifiedDotstores')
const Peeler = require('../../src/frontend/peeler')
const {ORMap, ORArray, MVReg} = require('../../src/backend/crdts/unifiedCRDTs')
const CausalContext = require('../../src/backend/causal-context')


const INSPECT_OPTIONS = {
    showHidden: true,
    maxArrayLength: Infinity,
    depth : Infinity,
    showProxy : true
}

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

let docDelta = DCRDT.init({"REPLICA_ID": "R1"})
delta_base = util.inspect(docDelta, INSPECT_OPTIONS).length

let docAutomerge = Automerge.init()
auto_base = Automerge.save(docAutomerge).length

let docYjs = new Y.Doc()
yjs_base = util.inspect(docYjs, INSPECT_OPTIONS).length

console.log(`Base,${delta_base},${auto_base},${yjs_base}`)

for (n=1; n<=524288; n = n*2) {
    // console.log(`Starting ${n}:`)

    docDelta = DCRDT.init({"REPLICA_ID": "R1"})
    docDelta = mapTest(DCRDT, docDelta, n)
    docDeltaInspection = util.inspect(docDelta, INSPECT_OPTIONS)
    // console.log(`Size of docDelta: ${docinspection.length} bytes.`)

    docAutomerge = Automerge.init()
    docAutomerge = mapTest(Automerge, docAutomerge, n)
    docAutomergeInspection = Automerge.save(docAutomerge)
    // docAutomergeInspection = util.inspect(docAutomerge, INSPECT_OPTIONS)
    
    docYjs = new Y.Doc()
    docYjs = jysTest(docYjs, n)
    docYjsInspection = util.inspect(docYjs, INSPECT_OPTIONS)
    // console.log(`Size of docYjs: ${docinspection.length} bytes.`)

    console.log(`${n},${docDeltaInspection.length},${docAutomergeInspection.length},${docYjsInspection.length}`)
}

