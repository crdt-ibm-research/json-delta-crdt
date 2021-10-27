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

let nDocs = 5

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

let updateProbs = [0, 0.3, 0.5, 0.7, 1]
let syncProbs = [0.001, 0.01, 0.1, 1]
let nOps = 200
let testTimes = 10
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}
updateProbs.forEach(probUpdate => {
    syncProbs.forEach(probSync => {
        let sizes = []
        for (let r = 0; r < testTimes; r++) {
            let maxSize = 0;

            for (let op = 0; op <= nOps; op++) {
                let replica = getRandomInt(docs.length)
                if (Math.random() < probUpdate) {
                    let index = getRandomInt(arr.length)
                    docs[replica] =  DCRDT.change(docs[replica], "test", (doc) => {
                        doc.a[index] = getRandomInt(1000)
                    });
                } else {
                    docs[replica] =  DCRDT.change(docs[replica], "test", (doc) => {
                        doc.a.sort()
                    });
                }
                if (Math.random() < probSync) {
                    syncAll(docs)
                }
                if ((op % 2) == 0) {
                    // syncAll(docs)
                    let maxBytes = 0
                    docs.forEach(doc => {
                        let encoded = Encoder.encodeFrontend(docs[0]);
                        maxBytes = Math.max(maxBytes, encoded.byteLength)
                    });
                    // const encoded = Encoder.encodeFrontend(docs[0]);
                    // let docDeltaInspection = encoded.byteLength;
                    // console.log(`${op}, ${maxBytes}`)
                    if (maxSize < maxBytes) {
                        maxSize = maxBytes
                    }
                }
            }
            sizes.unshift(maxSize)
        }
        // syncAll(docs)


        // const encoded = Encoder.encodeFrontend(docs[0]);
        // let docDeltaInspection = encoded.byteLength;

        // console.log(`${nDocs}, ${docDeltaInspection}`)

        // const average = (array) => array.reduce((a, b) => a + b) / array.length;
        // console.log(`${probUpdate}, ${probSync}, ${average(sizes)}`)
        console.log(`${probUpdate}, ${probSync}, ${sizes.join(', ')}`)
        sizes.join(', ');
    });
});