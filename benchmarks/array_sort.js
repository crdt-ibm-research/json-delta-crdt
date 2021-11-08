// /* 
//   Consecutively updating an element in an array.
//   Creates Figure 11.
// */

// const { runTest } = require("./runBenchmark");
// const DCRDT = require("../src/frontend/index");
// const { DotMap } = require("../src/backend/dotstores");
// const Y = require("yjs");

// let bubbleSort = (inputArr) => {
//     let len = inputArr.length;
//     for (let i = 0; i < len; i++) {
//         let minIdx = i;
//         for (let j = i; j < len; j++) {
//             if (inputArr[j] < inputArr[minIdx]) minIdx = j
//         }
//         let tmp = Array.get(inputArr,minIdx)
//         inputArr.splice(minIdx , 1)[0]
//         // inputArr.splice(i,0, tmp)
//         inputArr.unshift(tmp)
//     }
//    return inputArr;
// };

// function shuffle(array) {
//     array.sort(() => Math.random() - 0.5);
// }  

// let maxN = 10
// // let a = [...Array(2 ** maxN).keys()]
// // let b = [...Array(2 ** maxN).keys()]
// // const zip = (a, b) => a.map((k, i) => [k, b[i]]);

// // let arr = a.map(function(e, i) {
// //   return [e, b[i] +1 ];
// // });

// // let arr = [...Array(2 ** maxN).keys()]
// let indicesArr = []
// let arr = []
// for (let i = 0; i < 2 ** maxN; i++) {
//     arr[i] = {"a" : i, "b" : 2 ** maxN - i}
//     indicesArr[i] = i
// }

// let sortBy = 0;
// let sortTimes = 50
// // let arr  = zip(a, b)
// let sizes = []
// for (let i = 0; i <= maxN; i++ ) {
//     sizes[i] = 2 ** i
// }
// shuffle(arr)
// shuffle(indicesArr)

// function test(lib, doc1, n) {
//   let arr1 = arr.slice(0, n)
//   doc1 = lib.change(doc1, "test", (doc) => {
//     doc.a = arr1
//   });
//   for (let repeat = 0; repeat < sortTimes; repeat++) {
//     sortBy = 1 - sortBy
//     if (lib == DCRDT) {
//       doc1 = lib.change(doc1, "test", (doc) => {
//           doc.a.sort()
//       });
//     } else {
//       doc1 = lib.change(doc1, "test", (doc) => {
//           let len = doc.a.length;
//           for (let i = 0; i < len; i++) {
//               let maxIdx = i;
//               for (let j = i; j < len; j++) {
//                 if (sortBy == 0) {
//                   if (doc.a[j].a < doc.a[maxIdx].a) maxIdx = j
//                 } else {
//                   if (doc.a[j].b < doc.a[maxIdx].b) maxIdx = j
//                 }
//               }
//               let tmp = doc.a[maxIdx].a
//               let tmpT = {"a" : tmp, "b" : (2 ** maxN) - tmp}
//               delete doc.a[maxIdx]
//               doc.a.unshift(tmpT)
//           }
//       });
//     }
//   }

//   return doc1;
// }

// function yjsTest(doc1, n) {
//   const yarray = doc1.getArray("a");
//   let arr1 = arr.slice(0, n)
//   for (let i = 0; i < arr1.length; i++) {
//       let ymap = new Y.Map()
//       ymap.set("a", indicesArr[i]);
//       ymap.set("b", (2 ** maxN) - indicesArr[i]);
//       yarray.insert(i, [ymap]);
//   }
//   for (let repeat = 0; repeat < sortTimes; repeat++) {
//     sortBy = 1 - sortBy
//     for (let i = 0; i < n; i++) {
//       let maxIdx = i;
//       for (let j = i; j < n; j++) {
//         if (sortBy == 0) {
//           if (yarray.get(j).get("a") > yarray.get(maxIdx).get("a")) maxIdx = j
//         } else {
//           if (yarray.get(j).get("b") > yarray.get(maxIdx).get("b")) maxIdx = j
//         }
//       }
//       let tmp = yarray.get(maxIdx).get("a")
//       let ymap = new Y.Map()
//       ymap.set("a", tmp);
//       ymap.set("b", (2 ** maxN) - tmp);
//       yarray.delete(maxIdx, 1);
//       yarray.unshift([ymap]);
//     }
//   }
//   return doc1;
// }

// console.log(sizes)

// runTest(test, yjsTest, sizes );

/* 
  Consecutively updating an element in an array.
  Creates Figure 11.
*/

const { runTest } = require("./runBenchmark");
const DCRDT = require("../src/frontend/index");
const { DotMap } = require("../src/backend/dotstores");
const Y = require("yjs");

let bubbleSort = (inputArr) => {
    let len = inputArr.length;
    for (let i = 0; i < len; i++) {
        let minIdx = i;
        for (let j = i; j < len; j++) {
            if (inputArr[j] < inputArr[minIdx]) minIdx = j
        }
        let tmp = Array.get(inputArr,minIdx)
        inputArr.splice(minIdx , 1)[0]
        // inputArr.splice(i,0, tmp)
        inputArr.unshift(tmp)
    }
   return inputArr;
};

function shuffle(array) {
    array.sort(() => Math.random() - 0.5);
}  

let maxN = 10
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
let sortTimes = 50
// let arr  = zip(a, b)
let sizes = []
for (let i = 5; i <= maxN; i++ ) {
    sizes[i-5] = 2 ** i
}
shuffle(arr)
shuffle(indicesArr)

function test(lib, doc1, n) {
  let arr1 = arr.slice(0, n)
  doc1 = lib.change(doc1, "test", (doc) => {
    doc.a = arr1
  });
  for (let repeat = 0; repeat < sortTimes; repeat++) {
    sortBy = 1 - sortBy
    if (lib == DCRDT) {
      doc1 = lib.change(doc1, "test", (doc) => {
          doc.a.sort((a,b) => a.a - b.a)
      });
    } else {
      doc1 = lib.change(doc1, "test", (doc) => {
        let len = doc.a.length;
        for (let i = 0; i < len; i++) {
          let maxIdx = i;
          for (let j = i; j < len; j++) {
            if (doc.a[j].a > doc.a[maxIdx].a) maxIdx = j
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
  let arr1 = arr.slice(0, n)
  for (let i = 0; i < arr1.length; i++) {
      let ymap = new Y.Map()
      ymap.set("a", indicesArr[i]);
      ymap.set("b", (2 ** maxN) - indicesArr[i]);
      ymap.set("c", {"d": { "e" : {"f" : 1 }}});
      yarray.insert(i, [ymap]);
  }
  for (let i = 0; i < n; i++) {
    let maxIdx = i;
    for (let j = i; j < n; j++) {
      if (yarray.get(j).get("a") > yarray.get(maxIdx).get("a")) maxIdx = j
    }
    let tmp = yarray.get(maxIdx).get("a")
    let ymap = new Y.Map()
    ymap.set("a", tmp);
    ymap.set("b", (2 ** maxN) - tmp);
    ymap.set("c", {"d": { "e" : {"f" : 1 }}});
    yarray.delete(maxIdx, 1);
    yarray.unshift([ymap]);
  }
  return doc1;
}

console.log(sizes)

runTest(test, yjsTest, sizes );
