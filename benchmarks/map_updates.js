/* 
  Consecutively updating an element in a map.
  Creates Figure 9.
*/

const { runTest } = require("./runBenchmark");

function mapTest(lib, doc1, n) {
  doc1 = lib.change(doc1, "test" + n, (doc) => {
    doc.a = { b: 0 };
  });
  for (i = 0; i < n; i++) {
    doc1 = lib.change(doc1, "test" + n + i, (doc) => {
      doc.a["b"] = i;
    });
  }
  return doc1;
}

function jysTest(doc1, n) {
  for (i = 0; i < n; i++) {
    doc1.getMap("a").set("b", i);
  }
  return doc1;
}

// let sizes = [1,  2,  4,  8,  16,  32,  64,  128,  256,  512,  1024,  2048,  4096,  8192,  16384,  32768,
//   65536,  131072,  262144]
 let sizes = [1,  2,  4,  8,  16,  32,  64,  128,  256,  512,  1024,  2048,  4096,  8192,  16384,  32768]

runTest(mapTest, jysTest, sizes);
