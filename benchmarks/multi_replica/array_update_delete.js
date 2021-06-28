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
    let docDelta = DCRDT.init({ "REPLICA_ID": `R${i}` })
    docDelta = DCRDT.change(docDelta, "init", doc => {
        doc.a = []
    })
    return docDelta
}

function autoInit() {
    let docAutomerge = Automerge.init()
    docAutomerge = Automerge.change(docAutomerge, "init", doc => {
        doc.a = []
    })
    return docAutomerge
}

function yjsInit() {
    const docYjs = new Y.Doc()
    const yarray = docYjs.getArray('a')
        //yarray.insert(0, [-1])
    return docYjs
}

function deltaTest(doc, i) {
    if (i % 2 == 0) {
        doc = DCRDT.change(doc, "test" + i, doc => {
            doc.a[0] = { "a": i }
        })
        return doc
    } else {
        doc = DCRDT.change(doc, "test" + i, doc => {
            delete doc.a[0]
        })
        return doc
    }
}

function autoTest(doc, i) {
    if (i % 2 == 0) {
        doc = Automerge.change(doc, "test" + i, doc => {
            doc.a[0] = { "a": i }
        })
        return doc
    } else {
        doc = Automerge.change(doc, "test" + i, doc => {
            delete doc.a[0]
        })
        return doc
    }
}

function yjsTest(doc, i) {
    const yarray = doc.getArray('a')
    if (i % 2 == 0) {
        // let m = new Y.Map()
        // m.set("a", i)
        // yarray.insert(0, [m])
        yarray.push([i])
        return doc
    } else {
        yarray.delete(0, 1)
        return doc
    }
}

runTest([2, 3, 6, 20], [deltaTest, autoTest, yjsTest], [deltaInit, autoInit, yjsInit], 8192 * 2)