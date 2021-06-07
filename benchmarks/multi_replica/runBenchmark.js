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

function initTest(nReplicas, [deltaInit, autoInit, yjsInit]) {
    let deltaDocs = [], autoDocs = [], yjsDocs = []

    for (let i = 0; i < nReplicas; i++) {
        const docDelta = deltaInit(i)
        deltaDocs.push(docDelta)

        const docAutomerge = autoInit()
        autoDocs.push(docAutomerge)

        const docYjs = yjsInit()
        yjsDocs.push(docYjs)

    }

    for (let i = 0; i < nReplicas; i++) {
        const yjsState = Y.encodeStateAsUpdateV2(yjsDocs[i])
        const delta = DCRDT.getChanges(deltaDocs[i])
        for (let j = 0; j < nReplicas; j++) {
            if (i == j) continue
            deltaDocs[j] = DCRDT.applyChanges(deltaDocs[j], delta)
            autoDocs[j] = Automerge.merge(autoDocs[j], autoDocs[i])
            Y.applyUpdate(yjsDocs[j], yjsState)
        }
    }

    return [deltaDocs, autoDocs, yjsDocs]
}

function wait(ms){
    var start = new Date().getTime();
    var end = start;
    while(end < start + ms) {
      end = new Date().getTime();
   }
 }

function runIter(nReplicas, [deltaTest, autoTest, yjsTest], iter, [deltaDocs, autoDocs, yjsDocs], log = false) {
    //[deltaDocs, autoDocs, yjsDocs] = initTest(nReplicas, deltaInit, autoInit, yjsInit)

    for (let i = 0; i < iter; i++) {
        // Get random replica
        const replica = Math.floor(Math.random() * nReplicas)

        // Change that replica
        deltaDocs[replica] = deltaTest(deltaDocs[replica], i)
        autoDocs[replica] = autoTest(autoDocs[replica], i)
        yjsDocs[replica] = yjsTest(yjsDocs[replica], i)

        /*
        if (i == iter - 2) {
            wait(60 * 1000);
        }*/

        // Merge all
        const yjsState = Y.encodeStateAsUpdateV2(yjsDocs[replica])
        let delta = DCRDT.getChanges(deltaDocs[replica])
        for (let i = 0; i < nReplicas; i++) {
            if (i == replica) continue
            deltaDocs[i] = DCRDT.applyChanges(deltaDocs[i], delta)
            autoDocs[i] = Automerge.merge(autoDocs[i], autoDocs[replica])
            Y.applyUpdate(yjsDocs[i], yjsState)
        }
    }

    for (let i = 0; i < nReplicas; i++) {
        let docDeltaInspection = Encoder.encodeFrontend(deltaDocs[i]).byteLength
        let docAutomergeInspection = Automerge.save(autoDocs[i]).length
        let docYjsInspection = Y.encodeStateAsUpdateV2(yjsDocs[i]).byteLength
        console.log(`Replica ${i}:, ${docDeltaInspection},${docAutomergeInspection},${docYjsInspection}`)
    }

    return [deltaDocs, autoDocs, yjsDocs]
}

function _runTest(nReplicas, testFuns, initFuns, n, log = false) {

    for (let i = 2048; i <= n; i *= 2) {
        let docs = initTest(nReplicas, initFuns)

        runIter(nReplicas, testFuns, i, docs)
    
        let [deltaDocs, autoDocs, yjsDocs] = docs

        if (log) {
            console.log("DCRDT")
            console.log(DCRDT.documentValue(deltaDocs[0]))
            console.log("Automerge")
            console.log(util.inspect(autoDocs[0], {showHidden: false, depth: null}))
            console.log("yjs")
            console.log(util.inspect(yjsDocs[0].toJSON(), {showHidden: false, depth: null}))
        }

        let docDeltaInspection = Encoder.encodeFrontend(deltaDocs[0]).byteLength
        let docAutomergeInspection = Automerge.save(autoDocs[0]).length
        let docYjsInspection = Y.encodeStateAsUpdateV2(yjsDocs[0]).byteLength
        console.log(`${i}, ${docDeltaInspection},${docAutomergeInspection},${docYjsInspection}`)

        /*
        for (let r = 0; r < nReplicas; r++) {
            let docDeltaInspection = Encoder.encodeFrontend(deltaDocs[r]).byteLength
            let docAutomergeInspection = Automerge.save(autoDocs[r]).length
            let docYjsInspection = Y.encodeStateAsUpdateV2(yjsDocs[r]).byteLength
            console.log(`Replica ${r}:, ${docDeltaInspection},${docAutomergeInspection},${docYjsInspection}`)
        }
        */
        
    }
}

/**
 * Run a multi replica test, for example:
 *  runTest([2,3,5], [deltaTest, autoTest, yjsTest], [deltaInit, autoInit, yjsInit], 256)
 * 
 * @param {Array} nReplicasArr Array of nReplicas, e.g., [2,4,5]
 * @param {Array} testFuns Array of functions for a single step in the order of [delta, auto, yjs]
 * @param {Array} initFuns Array of init functions in the order of [delta, auto, yjs]
 * @param {Int} maxN Max number of steps - inclusive
 */
function runTest(nReplicasArr, testFuns, initFuns, maxN, log = false) {

    for (let i = 0; i < nReplicasArr.length; i++) {
        let nReplicas = nReplicasArr[i]
        console.log(`nReplicas = ${nReplicas}`)
        _runTest(nReplicas, testFuns, initFuns, maxN, log)       
    }
}

module.exports = { runTest }