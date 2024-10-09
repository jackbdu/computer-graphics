function Matrix() {
  this.identity = () => (value = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  this.translate = (x, y, z) => (value = multiply(value, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]));
  this.rotateX = (theta) => (value = multiply(value, [1, 0, 0, 0, 0, Math.cos(theta), Math.sin(theta), 0, 0, -Math.sin(theta), Math.cos(theta), 0, 0, 0, 0, 1]));
  this.rotateY = (theta) => (value = multiply(value, [Math.cos(theta), 0, -Math.sin(theta), 0, 0, 1, 0, 0, Math.sin(theta), 0, Math.cos(theta), 0, 0, 0, 0, 1]));
  this.rotateZ = (theta) => (value = multiply(value, [Math.cos(theta), Math.sin(theta), 0, 0, -Math.sin(theta), Math.cos(theta), 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]));
  this.scale = (x, y, z) => (value = multiply(value, [x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1]));
  this.perspective = (x, y, z) => (value = multiply(value, [1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z, 0, 0, 0, 1]));
  this.get = () => value;
  this.set = (v) => (value = v);
  this.transform = (vector) => {
    const transformedVector = [];
    for (let row = 0; row < 4; row++) {
      transformedVector[row] = 0;
      for (let col = 0; col < 4; col++) {
        const index = col * 4 + row;
        transformedVector[row] += vector[col] * value[index];
      }
    }
    return transformedVector;
  };

  let value = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

  let multiply = (matrix1, matrix2) => {
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
}
