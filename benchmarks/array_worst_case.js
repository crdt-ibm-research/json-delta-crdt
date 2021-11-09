const util = require("util");
const chai = require("chai");
const dirtyChai = require("dirty-chai");
chai.use(dirtyChai);


const DCRDT = require("../src/frontend/index");
const Encoder = require("../src/frontend/encoder");

function syncAll(docs) {
    let deltas = []
    for (let i = 0; i < docs.length; i++) {
        deltas[i] = DCRDT.getChanges(docs[i])
    }

    for (let i = 0; i < docs.length; i++) {
        for (let j = 0; j < docs.length; j++) {
            docs[i] = DCRDT.applyChanges(docs[i], deltas[j])
        }
    }
    return docs
}

let maxDocs = 30

for (let nDocs = 1; nDocs <= maxDocs; nDocs++) {


    let docs = []
    for (let i = 0; i < nDocs; i++) {
        docs.unshift(DCRDT.init({ REPLICA_ID: `R${i}` }))
        
    }

    let arr = [1,2,3,4,5]
    let doc1 = docs[0]

    doc1 = DCRDT.change(doc1, "test", (doc) => {
        doc.a = arr
    });
    let delta = DCRDT.getChanges(doc1)

    for (let i = 1; i < nDocs; i++) {
        docs[i] = DCRDT.applyChanges(docs[i], delta)    
    }

    for (let i = 0; i < nDocs; i++) {
        docs[i] = DCRDT.change(docs[i], "test", (doc) => {
            for (let i = 0; i < arr.length; i++) {
                doc.a[i] = arr.length-i+100
            }
        });
    }

    syncAll(docs)

    for (let i = 0; i < nDocs; i++) {
        docs[i] = DCRDT.change(docs[i], "test", (doc) => {
            doc.a.sort()
        });
    }

    syncAll(docs)


    const encoded = Encoder.encodeFrontend(docs[0]);
    let docDeltaInspection = encoded.byteLength;

    console.log(`${nDocs},${docDeltaInspection}`)
}