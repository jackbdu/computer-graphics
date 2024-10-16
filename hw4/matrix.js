const identity = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
const translation = (x, y, z) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];
const rotationX = (theta) => [1, 0, 0, 0, 0, Math.cos(theta), Math.sin(theta), 0, 0, -Math.sin(theta), Math.cos(theta), 0, 0, 0, 0, 1];
const rotationY = (theta) => [Math.cos(theta), 0, -Math.sin(theta), 0, 0, 1, 0, 0, Math.sin(theta), 0, Math.cos(theta), 0, 0, 0, 0, 1];
const rotationZ = (theta) => [Math.cos(theta), Math.sin(theta), 0, 0, -Math.sin(theta), Math.cos(theta), 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

const transpose = (matrix) => {
  const transposedMatrix = new Array(16);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const index = col * 4 + row;
      const transposedIndex = row * 4 + col;
      transposedMatrix[transposedIndex] = matrix[index];
    }
  }
  return transposedMatrix;
};
const scale = (x, y, z) => [x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1];

const multiply = (matrix1, matrix2) => {
  const matrix = [];
  for (let index = 0; index < 16; index++) {
    const col = Math.floor(index / 4);
    const row = index % 4;
    matrix[index] = 0;
    for (let i = 0; i < 4; i++) {
      const index1 = i * 4 + row;
      const index2 = col * 4 + i;
      matrix[index] += matrix1[index1] * matrix2[index2];
    }
  }
  return matrix;
};

// matrixInverse provided by Ken Perlin
const matrixInverse = (src) => {
  let dst = [];
  let det = 0;
  let cofactor = (c, r) => {
    let s = (i, j) => src[((c + i) & 3) | (((r + j) & 3) << 2)];
    return ((c + r) & 1 ? -1 : 1) * (s(1, 1) * (s(2, 2) * s(3, 3) - s(3, 2) * s(2, 3)) - s(2, 1) * (s(1, 2) * s(3, 3) - s(3, 2) * s(1, 3)) + s(3, 1) * (s(1, 2) * s(2, 3) - s(2, 2) * s(1, 3)));
  };
  for (let n = 0; n < 16; n++) dst.push(cofactor(n >> 2, n & 3));
  for (let n = 0; n < 4; n++) det += src[n] * dst[n << 2];
  for (let n = 0; n < 16; n++) dst[n] /= det;
  return dst;
};

const transform = (Q, matrix) => {
  const inversedMatrix = matrixInverse(matrix);
  return multiply(transpose(inversedMatrix), multiply(Q, inversedMatrix));
};
