const Y = require('yjs')

console.log("num update-insert operations;size in bytes" );
for (n=1; n<=2**15; n = n*2) {

    let doc = new Y.Doc()
    let ymap = doc.getMap('a')
    for (let i = 0; i < n; i++) {
        let key = `key-${i}`
        ymap.set(key, 0)
        ymap.delete(key)
    }

    docInspection = Y.encodeStateAsUpdateV2(doc).byteLength
    // console.log(`Size of docYjs: ${docinspection.length} bytes.`)

    console.log(`${n};${docInspection}`)
}

