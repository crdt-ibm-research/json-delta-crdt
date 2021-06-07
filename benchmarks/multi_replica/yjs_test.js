const Y = require('yjs')

nReplicas = 2

log = false

function initTest() {
    let yjsDocs = []

    for (let i = 0; i < nReplicas; i++) {
        const docYjs = new Y.Doc()
        yjsDocs.push(docYjs)
    }

    // Merge all for consistent shared state
    for (let i = 0; i < nReplicas; i++) {
        const yjsState = Y.encodeStateAsUpdate(yjsDocs[i])
        for (let j = 0; j < nReplicas; j++) {
            if (i == j) continue
            Y.applyUpdate(yjsDocs[j], yjsState)
        }
    }

    return yjsDocs
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

function runIter(iter, yjsDocs) {
    for (let i = 0; i < iter; i++) {
        // Get random replica
        const replica = Math.floor(Math.random() * nReplicas)

        // Change that replica
        yjsDocs[replica] = yjsTest(yjsDocs[replica], i)

        // Merge all
        const yjsState = Y.encodeStateAsUpdate(yjsDocs[replica])
        for (let i = 0; i < nReplicas; i++) {
            if (i == replica) continue
            Y.applyUpdate(yjsDocs[i], yjsState)
        }
    }
    return yjsDocs
}

console.log(`num update+delete operations, doc size in B`)
for (let i = 2; i <= 8192*2; i *= 2) {
    let yjsDocs = initTest()

    runIter(i, yjsDocs)
    let docYjsInspection = Y.encodeStateAsUpdateV2(yjsDocs[0]).byteLength
    console.log(`${i/2}, ${docYjsInspection}`)

    if (log) {
        for (let i = 0; i < nReplicas; i++) {
            let docYjsInspection = Y.encodeStateAsUpdateV2(yjsDocs[i]).byteLength
            console.log(`Replica ${i}:,${docYjsInspection}`)
        }
        console.log(yjsDocs[0].toJSON())
    }
}