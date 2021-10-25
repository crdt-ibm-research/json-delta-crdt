// "use strict";

// // Logoot implementation (not optimized)

// const LOWER = 0;
// const UPPER = 32767;
// const BOTTOM_ID = "";

// // The maximum is exclusive and the minimum is inclusive
// function randomInt(min, max) {
//   if (min + 1 === max) {
//     return min;
//   }
//   return Math.floor(Math.random() * (max - min - 1)) + min + 1;
// }
// // Compares by lexicographic order
// function compareAtoms([lval, lsite], [rval, rsite]) {
//   try {
//     if (lval === rval) {
//       return lsite.localeCompare(rsite);
//     }
//     return lval - rval;
//   } catch (err) {
//     console.log(err);
//   }
// }

// class Position {
//   // A position is a list of atoms. Each atom is a tuple of:
//   //  - Number, which can be semi-random
//   //  - Replica Id
//   // In the original design the position is (atoms[], sequence number)
//   // They added the sequence number to ensure uniqueness of positions.
//   // However, As long as each replica creates different positions we can ommit the sequence number.
//   // Example of position: [(17, r1), (30, r2), (13, r2)]
//   constructor(atoms) {
//     this.atoms = atoms;
//   }

//   // The nodeId of the replica that created the position is guaranteed to be in the last atom.
//   get nodeId() {
//     return this.atoms[this.atoms.length - 1][1];
//   }

//   // Lexicographic order, like in dictionary.
//   static compare(left, right) {
//     for (let i = 0; i < Math.min(left.atoms.length, right.atoms.length); i++) {
//       const diff = compareAtoms(left.atoms[i], right.atoms[i]);
//       if (diff !== 0) {
//         return diff;
//       }
//     }
//     return left.atoms.length - right.atoms.length;
//   }

//   static between(nodeId, left, right) {
//     if (left === undefined) left = new Position([[LOWER, BOTTOM_ID]]);
//     if (right === undefined) right = new Position([[UPPER, BOTTOM_ID]]);
//     if (Position.compare(left, right) >= 0) {
//       throw Error("left must be smaller than right");
//     }

//     const atoms = [];
//     let lower, upper;
//     while (true) {
//       let leftAtom = left.atoms[atoms.length] || [LOWER, BOTTOM_ID];
//       let rightAtom = (right && right.atoms[atoms.length]) || [
//         UPPER,
//         BOTTOM_ID,
//       ];
//       lower = leftAtom[0];
//       upper = rightAtom[0];
//       if (upper - lower > 1) {
//         // We can safely generate an atom with value between lower and upper
//         break;
//       }
//       // Once we reach different atoms we can generate anything from the left atom's value to the upper bound
//       if (compareAtoms(leftAtom, rightAtom) !== 0) {
//         right = null;
//       }
//       atoms.push(leftAtom);
//     }

//     atoms.push([randomInt(lower, upper), nodeId]);
//     return new Position(atoms);
//   }
// }

// module.exports = Position;
"use strict";

// Logoot implementation (not optimized)

const LOWER = 0;
const UPPER = 32767;
const BOTTOM_ID = "";

// The maximum is exclusive and the minimum is inclusive
function randomInt(min, max) {
  if (min + 1 === max) {
    return min;
  }
  return Math.floor(Math.random() * (max - min - 1)) + min + 1;
}
// Compares by lexicographic order
function compareAtoms([lval, lsite], [rval, rsite]) {
  try {
    if (lval === rval) {
      return lsite.localeCompare(rsite);
    }
    return lval - rval;
  } catch (err) {
    console.log(err);
  }
}

class Position {
  // A position is a list of atoms. Each atom is a tuple of:
  //  - Number, which can be semi-random
  //  - Replica Id
  // In the original design the position is (atoms[], sequence number)
  // They added the sequence number to ensure uniqueness of positions.
  // However, As long as each replica creates different positions we can ommit the sequence number.
  // Example of position: [(17, r1), (30, r2), (13, r2)]
  constructor(pos) {
    this.pos = pos;
  }

  // The nodeId of the replica that created the position is guaranteed to be in the last atom.
  get nodeId() {
    return this.atoms[this.atoms.length - 1][1];
  }

  // Lexicographic order, like in dictionary.
  static compare(left, right) {
    if (left instanceof Position) {
      left = left.pos
    }
    if (right instanceof Position) {
      right = right.pos
    }
    return left - right
    for (let i = 0; i < Math.min(left.atoms.length, right.atoms.length); i++) {
      const diff = compareAtoms(left.atoms[i], right.atoms[i]);
      if (diff !== 0) {
        return diff;
      }
    }
    return left.atoms.length - right.atoms.length;
  }

  static between(nodeId, left, right) {
    if (left instanceof Position) {
      left = left.pos
    }
    if (right instanceof Position) {
      right = right.pos
    }
    left = left || LOWER
    right = right || UPPER
    return (left+right)/2
  }
}

module.exports = Position;
