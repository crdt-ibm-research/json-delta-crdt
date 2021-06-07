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
        doc.a = { 'b' : 0 }
    })
    return docDelta
}

function autoInit() {
    let docAutomerge = Automerge.init()
    docAutomerge = Automerge.change(docAutomerge, "init", doc => {
        doc.a = { 'b' : 0 }
    })
    return docAutomerge
}

function yjsInit() {
    const docYjs = new Y.Doc()
    docYjs.getMap('a').set('b', 0)
    return docYjs
}

let deltaFlag = true, autoFlag = true, yjsFlag = true


function deltaTest(doc, i) {
    key = `${i - (i % 2)}`
    if (i % 2 == 0) {
        doc = DCRDT.change(doc, "test" + i, doc => {
            doc.a[key] = 0
        })
        return doc
    } else {
        doc = DCRDT.change(doc, "test" + i, doc => {
            delete doc.a[key]
        })
        return doc
    }
}

function autoTest(doc, i) {
    key = `${i - (i % 2)}`
    if (i % 2 == 0) {
        doc = Automerge.change(doc, "test" + i, doc => {
            doc.a[key] = 0
        })
        return doc
    } else {
        doc = Automerge.change(doc, "test" + i, doc => {
            delete doc.a[key]
        })
        return doc
    }
}

function yjsTest(doc, i) {
    key = `${i - (i % 2)}`
    if (i % 2 == 0) {
        doc.getMap('a').set(key, 0)
        return doc
    } else {
        doc.getMap('a').delete(key)
        return doc
    }

}

runTest([2,3,6, 20], [deltaTest, autoTest, yjsTest], [deltaInit, autoInit, yjsInit], 8192*2)
