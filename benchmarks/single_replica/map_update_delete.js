const { runTest } = require('./runBenchmark')

function mapTest(lib, doc1, n) {
    doc1 = lib.change(doc1, "test" + n, doc => {
        doc.a = { 'b' : 0}
    })
    for (i=0; i<n; i++) {
        doc1 = lib.change(doc1, "test" + n + i, doc => {
            doc.a.b = i
        })
        doc1 = lib.change(doc1, "test" + n + i, doc => {
            delete doc.a.b
        })
    }
    return doc1
}

function jysTest(doc1, n) {
    // doc1.getMap('a') = { }
    for (i=0; i<n; i++) {
        doc1.getMap('a').set(`${i}`, i)
        doc1.getMap('a').delete(`${i}`)
    }
    return doc1
}

runTest(mapTest, jysTest)