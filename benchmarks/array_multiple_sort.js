/* 
  Consecutively updating an element in an array.
  Creates Figure 11.
*/

const { runTest } = require("./runBenchmark");
const DCRDT = require("../src/frontend/index");
const Y = require("yjs");


function shuffle(array) {
    array.sort(() => Math.random() - 0.5);
}  

let maxN = 2
console.log(2 ** maxN)
// let a = [...Array(2 ** maxN).keys()]
// let b = [...Array(2 ** maxN).keys()]
// const zip = (a, b) => a.map((k, i) => [k, b[i]]);

// let arr = a.map(function(e, i) {
//   return [e, b[i] +1 ];
// });

// let arr = [...Array(2 ** maxN).keys()]
let indicesArr = []
let arr = []
for (let i = 0; i < 2 ** maxN; i++) {
    arr[i] = {"a" : i, "b" : 2 ** maxN - i}
    indicesArr[i] = i
}

let sortBy = 0;
// let arr  = zip(a, b)
let sizes = []
for (let i = 0; i <= 10; i++ ) {
    sizes[i] = 2 ** i
}
shuffle(arr)
shuffle(indicesArr)

function test(lib, doc1, n) {
  doc1 = lib.change(doc1, "test", (doc) => {
    doc.a = arr
  });
  for (let repeat = 0; repeat < n; repeat++) {
    sortBy = 1 - sortBy
    if (lib == DCRDT) {
      doc1 = lib.change(doc1, "test", (doc) => {
        if (sortBy == 0) {
          doc.a.sort((a,b) => a.a - b.a)
        } else {
          doc.a.sort((a,b) => a.b - b.b)
        }
      });
    } else {
      doc1 = lib.change(doc1, "test", (doc) => {
          let len = doc.a.length;
          for (let i = 0; i < len; i++) {
              let maxIdx = i;
              for (let j = i; j < len; j++) {
                if (sortBy == 0) {
                  if (doc.a[j].a > doc.a[maxIdx].a) maxIdx = j
                } else {
                  if (doc.a[j].b > doc.a[maxIdx].b) maxIdx = j
                }
              }
              let tmp = doc.a[maxIdx].a
              let tmpT = {"a" : tmp, "b" : (2 ** maxN) - tmp}
              delete doc.a[maxIdx]
              doc.a.unshift(tmpT)
          }
      });
    }
  }

  return doc1;
}

function yjsTest(doc1, n) {
  const yarray = doc1.getArray("a");
  let len = arr.length
  for (let i = 0; i < len; i++) {
      let ymap = new Y.Map()
      ymap.set("a", indicesArr[i]);
      ymap.set("b", (2 ** maxN) - indicesArr[i]);
      yarray.insert(i, [ymap]);
  }
  for (let repeat = 0; repeat < n; repeat++) {
    sortBy = 1 - sortBy
    for (let i = 0; i < len; i++) {
      let maxIdx = i;
      for (let j = i; j < len ; j++) {
        if (sortBy == 0) {
          if (yarray.get(j).get("a") > yarray.get(maxIdx).get("a")) maxIdx = j
        } else {
          if (yarray.get(j).get("b") > yarray.get(maxIdx).get("b")) maxIdx = j
        }
      }
      let tmp = yarray.get(maxIdx).get("a")
      let ymap = new Y.Map()
      ymap.set("a", tmp);
      ymap.set("b", (2 ** maxN) - tmp);
      yarray.delete(maxIdx, 1);
      yarray.unshift([ymap]);
    }
  }
  return doc1;
}

console.log(sizes)

runTest(test, yjsTest, sizes );
