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

const { runTest } = require('./runBenchmark')


function deltaInit(i) {
    let docDelta = DCRDT.init({"REPLICA_ID": `R${i}`})
    docDelta = DCRDT.change(docDelta, "init", doc => {
        doc.a = [ 0,1,2,3,4,5,6,7,8,9 ]
    })
    return docDelta
}

function autoInit() {
    let docAutomerge = Automerge.init()
    docAutomerge = Automerge.change(docAutomerge, "init", doc => {
        doc.a = [ 0,1,2,3,4,5,6,7,8,9 ]
    })
    return docAutomerge
}

function yjsInit() {
    const docYjs = new Y.Doc()
    const yarray = docYjs.getArray('a')
    yarray.insert(0, [ 0,1,2,3,4,5,6,7,8,9 ])
    return docYjs
}

const MOVE = 0
const UPDATE = 1

let moveOrUpdate, index

function deltaTest(doc, i) {
    moveOrUpdate = Math.floor(Math.random() * 2) // 0 - 1
    index = Math.floor(Math.random() * 9 + 1) // 1 - 9
    if (moveOrUpdate == UPDATE) {
        doc = DCRDT.change(doc, "test" + i, doc => {
            doc.a[index] = i
        })
    } else { // MOVE

    }
    return doc
}

function autoTest(doc, i) {
    doc = Automerge.change(doc, "test" + i, doc => {
        doc.a[0] = i
    })
    return doc
}

function yjsTest(doc, i) {
    const yarray = doc.getArray('a')
    if (yarray.length != 0 ) {
        yarray.delete(0,1)
    }
    yarray.insert(0, [i])
    return doc
}

//runTest([2,3,6, 20], [deltaTest, autoTest, yjsTest], [deltaInit, autoInit, yjsInit], 8192)

console.log("Incomplete test - need to move in DCRDT")
