const { runTest } = require('./runBenchmark')

function mapTest(lib, doc1, n) {
    doc1 = lib.change(doc1, "test" + n, doc => {
        doc.a = { }
    })
    for (i=0; i<n; i++) {
        doc1 = lib.change(doc1, "test" + n + i, doc => {
            doc.a[i] = i
        })
    }
    return doc1
}

function jysTest(doc1, n) {
    // doc1.getMap('a') = { }
    for (i=0; i<n; i++) {
        doc1.getMap('a').set(i, i)
    }
    return doc1
}

runTest(mapTest, jysTest)