/*
 * TODOS:
 * - Apply material
 * */

M.transform = (vector) => {
  const value = M.get();
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

let objObjects = [];

const clearObj = () => {
  objObjects = [];
};

const addObj = (shape) => {
  const mesh = shape.mesh;
  const vertices = [];
  const textures = [];
  const normals = [];
  const faces = [];
  for (let i = 0; i + vertexSize <= mesh.length; i += vertexSize) {
    const vertex = [mesh[i], mesh[i + 1], mesh[i + 2], 1];
    const normal = [mesh[i + 3], mesh[i + 4], mesh[i + 5], 1];
    const texture = [mesh[i + 6], mesh[i + 7]];
    const transformedVertex = M.transform(vertex).slice(0, 3);
    const transformedNormal = M.transform(normal);
    // NORMALS AND TEXTURES NOT TESTED TO WORK
    vertices.push(transformedVertex);
    normals.push(transformedNormal);
    textures.push(texture);
    const vl = vertices.length;
    // TRIANGLES
    if (shape.type === 0 && vl % 3 === 0) {
      faces.push([vl - 2, vl - 1, vl]);
      // TRIANGLE_STRIP
    } else if (shape.type === 1 && vl >= 3) {
      // STORING VERTICES IN COUNTER-CLOCKWISE ORDER
      const face = vl % 2 ? [vl - 2, vl - 1, vl] : [vl, vl - 1, vl - 2];
      faces.push(face);
    }
  }
  objObjects.push({ vertices, textures, normals, faces });
  return M;
};

const compileObj = () => {
  let compiledObj = "";
  let compiledVertices = "";
  let compiledFaces = "";
  let vertexIndexOffset = 0;
  for (const obj of objObjects) {
    const { vertices, textures, normals, faces } = obj;
    compiledVertices += vertices.map((vertex) => `v ${vertex.join(" ")}`).join("\n") + "\n";
    compiledFaces +=
      faces
        .map((face) => {
          const offsetFace = face.map((index) => index + vertexIndexOffset);
          return `f ${offsetFace.join(" ")}`;
        })
        .join("\n") + "\n";
    // const compiledTextures = textures.join("\n") + "\n";
    // const compiledNormals = normals.join("\n") + "\n";
    // compiledObj += compiledVertices + compiledTextures + compiledNormals + compiledFaces;
    vertexIndexOffset += vertices.length;
  }
  compiledObj = compiledVertices + compiledFaces;
  return compiledObj;
};

M.drawObj = (shape, color, opacity, texture, bumpTexture) => {
  addObj(shape);
  return draw(shape, color, opacity, texture, bumpTexture);
};
