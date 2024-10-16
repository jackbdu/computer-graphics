// a b c d e f g h i j
// 0 0 0 0 0 0 0 0 0 -1
//                 [a, 0, 0, 0, f, b, 0, 0, e, d, c, 0, g, h, i, j]
const everywhere = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -1];

// a b c d e f g h i j
// 0 1 1 0 0 0 0 0 0 -1
//                [a, 0, 0, 0, f, b, 0, 0, e, d, c, 0, g, h, i, j]
const xCylinder = [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -1];

// a b c d e f g h i j
// 1 0 1 0 0 0 0 0 0 -1
//                [a, 0, 0, 0, f, b, 0, 0, e, d, c, 0, g, h, i, j]
const yCylinder = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, -1];

// a b c d e f g h i j
// 1 1 0 0 0 0 0 0 0 -1
//                [a, 0, 0, 0, f, b, 0, 0, e, d, c, 0, g, h, i, j]
const zCylinder = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, -1];

// a b c d e f g h i j
// 1 1 1 0 0 0 0 0 0 -1
//             [a, 0, 0, 0, f, b, 0, 0, e, d, c, 0, g, h, i, j]
const sphere = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -1];

// a b c d e f g h i j
// 0 0 1 0 0 0 0 0 0 -1
//            [a, 0, 0, 0, f, b, 0, 0, e, d, c, 0, g, h, i, j]
const zSlab = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, -1];

// a b c d e f g h i j
// 0 1 0 0 0 0 0 0 0 -1
//            [a, 0, 0, 0, f, b, 0, 0, e, d, c, 0, g, h, i, j]
const ySlab = [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, -1];

// a b c d e f g h i j
// 1 0 0 0 0 0 0 0 0 -1
//            [a, 0, 0, 0, f, b, 0, 0, e, d, c, 0, g, h, i, j]
const xSlab = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -1];

// a b c d e f g h i j
// 1 1 0 0 0 0 0 0 1 0
//                  [a, 0, 0, 0, f, b, 0, 0, e, d, c, 0, g, h, i, j]
const zParaboloid = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0];

// a b c d e f g h i j
// 1 0 1 0 0 0 0 1 0 0
//                  [a, 0, 0, 0, f, b, 0, 0, e, d, c, 0, g, h, i, j]
const yParaboloid = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0];

// a b c d e f g h i j
// 0 1 1 0 0 0 1 0 0 0
//                  [a, 0, 0, 0, f, b, 0, 0, e, d, c, 0, g, h, i, j]
const xParaboloid = [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0];

// a b c d e f g h i j
// 1 1 0 0 0 0 0 0 -1 0
//                          [a, 0, 0, 0, f, b, 0, 0, e, d, c, 0, g, h, i, j]
const zParaboloidOpposite = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, -1, 0];

// a b c d e f g h i j
// 1 0 1 0 0 0 0 -1 0 0
//                          [a, 0, 0, 0, f, b, 0, 0, e, d, c, 0, g, h, i, j]
const yParaboloidOpposite = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0];

// a b c d e f g h i j
// 0 1 1 0 0 0 -1 0 0 0
//                          [a, 0, 0, 0, f, b, 0, 0, e, d, c, 0, g, h, i, j]
const xParaboloidOpposite = [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -1, 0, 0, 0];
