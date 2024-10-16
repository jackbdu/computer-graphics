const fragmentShader = `
/* macros starts */
// #define PI 3.14159265359
/* macros ends */

precision mediump float;

/* varying variables starts */
varying vec3 vPos;
/* varying variables ends */

/* uniform variables starts */
uniform vec3 uCursor;
uniform vec2 uResolution;
uniform vec3 uAmbientLight;
uniform vec3 uDirectionalLights[DIRECTIONAL_LIGHTS_NUM*2];
uniform vec4 uMaterialVectors[OBJECTS_NUM];
uniform mat4 uShapeAMatrices[OBJECTS_NUM];
uniform mat4 uShapeBMatrices[OBJECTS_NUM];
uniform mat4 uShapeCMatrices[OBJECTS_NUM];
uniform mat4 uTransformationMatrix;
uniform float uTime;
uniform float uFocalLength;
// uniform float uFrameCount; // switch this to time later depending on priority
// uniform float uLoopFramesNum; // minimum loop frames
/* uniform variables ends */

/* global parameters starts */
const int detailsLevel = 9;
const float animSpeed = 1.;
const vec3 overallColorTint = vec3(0.);
const float maxRenderingDistance = 200.;
// float adjustedTime = uFrameCount / uLoopFramesNum * PI * 2. * animSpeed;
float adjustedTime = uTime * animSpeed;
/* global parameters ends */

/* camera parameters starts */
const vec3 cameraPosition = vec3(0.0, 0., 10.);
/* camera parameters ends */

/* background parameters starts */
const vec3 gradientColorTop = vec3(.1, .1, .5);
const vec3 gradientColorBottom = vec3(.0, .0, .2);
const float gradientIntensity = .5;
/* background parameters ends */

/* object material parameters starts */
const float objectMaterialHighlightPower = 8.;
const float objectMaterialReflectiveness = .4;
const vec3 objectMaterialColor = vec3(.05, 0., 0.05);
const vec3 objectMaterialTextureNoiseDetails = vec3(.5);
const vec3 objectMaterialTextureNoiseSpaceScale = vec3(.5, .2, .5);
const float objectMaterialTextureNoiseIntensity = .7;
const float objectMaterialTextureAnimAmplitude = 0.; // 2.
const float objectMaterialTextureAnimBaseRadius = 0.; // 2.
const vec3 objectMaterialTextureAnimNoiseSpaceScale = vec3(.1);
/* object material parameters ends */

/* refraction parameters starts */
const float airRefractiveIndex = 1.2;
const float lensRefractiveIndex = 1.4;
/* refraction parameters ends */

/* functions starts */
// noise function provided by Ken Perlin
float noise(vec3 point) { float r = 0.; for (int i=0;i<16;i++) {
  vec3 D, p = point + mod(vec3(i,i/4,i/8) , vec3(4.0,2.0,2.0)) +
       1.7*sin(vec3(i,5*i,8*i)), C=floor(p), P=p-C-.5, A=abs(P);
  C += mod(C.x+C.y+C.z,2.) * step(max(A.yzx,A.zxy),A) * sign(P);
  D=34.*sin(987.*float(i)+876.*C+76.*C.yzx+765.*C.zxy);P=p-C-.5;
  r+=sin(6.3*dot(P,fract(D)-.5))*pow(max(0.,1.-2.*dot(P,P)),4.);
} return .5 * sin(r); }

// adapted from turbulence function provided by Ken Perlin
float turbulence(vec3 point, int detailsLevel) {
  const float rotation = 3.1415926 / 6.;
  const float yOffset = 100.;
  const int maxDetailsLevel = 9;
  const mat3 yRotationMatrix = mat3(
    cos(rotation), 0, sin(rotation),
    0, 1, 0,
    -sin(rotation), 0, cos(rotation)
  );

  float turbulenceAmount = 0.;
  float scale = 1.;
  for (int i = 0; i < maxDetailsLevel; i++) {
    if (i >= detailsLevel) break;
    turbulenceAmount += abs(noise(scale * point)) / scale;
    scale *= 2.;
    point *= yRotationMatrix;
    point.y += yOffset;
  }
  return turbulenceAmount;
}

mat4 getQuadricCoefficients(mat4 quadricShape) {
  return mat4(quadricShape[0].x, 0, 0, 0,
          quadricShape[1].x+quadricShape[0].y,quadricShape[1].y, 0, 0,
          quadricShape[2].x+quadricShape[0].z,quadricShape[2].y+quadricShape[1].z,quadricShape[2].z, 0,
          quadricShape[3].x+quadricShape[0].w,quadricShape[3].y+quadricShape[1].w,quadricShape[3].z+quadricShape[2].w,quadricShape[3].w);
}

mat3 getRefractedRayProperties(vec3 sourcePosition, vec3 rayDirection, vec3 refractionSurfaceNormal, float preRefractionIndex, float postRefractionIndex) {
  vec3 preRefractionCos = dot(refractionSurfaceNormal, rayDirection) * refractionSurfaceNormal;
  vec3 preRefractionSin = rayDirection - preRefractionCos;
  vec3 postRefractionSin = preRefractionSin * preRefractionIndex / postRefractionIndex;
  vec3 postRefractionCos = - sqrt(1. - postRefractionSin * postRefractionSin) * refractionSurfaceNormal;
  vec3 refractedRayDirection = postRefractionCos + postRefractionSin;

  vec3 postRefractionSurfacePoint = sourcePosition + 0.00001 * refractedRayDirection;
  return mat3(postRefractionSurfacePoint, refractedRayDirection, 0, 0, 0);
}

vec2 rayShapeIntersectionDistances(vec3 sourcePosition, vec3 rayDirection, mat4 quadricShape) {
  quadricShape = getQuadricCoefficients(quadricShape);
  vec4 sourcePosition4D = vec4(sourcePosition, 1.);
  vec4 rayDirection4D = vec4(rayDirection, 0.);

  float a = quadricShape[0].x;
  float f = quadricShape[1].x;
  float b = quadricShape[1].y;
  float e = quadricShape[2].x;
  float d = quadricShape[2].y;
  float c = quadricShape[2].z;
  float g = quadricShape[3].x;
  float h = quadricShape[3].y;
  float i = quadricShape[3].z;
  float j = quadricShape[3].w;

  // At^2+Bt+C=0 => t = (-B/2A ± sqrt(B^2 - 4AC))/2A
  float A = dot(vec3(a, b, c), rayDirection.xyz*rayDirection.xyz) + dot(vec3(d, e, f), rayDirection.yzx*rayDirection.zxy);
  float B = 2. * dot(vec3(a,b,c), sourcePosition.xyz*rayDirection.xyz) + d * dot(sourcePosition.yz, rayDirection.zy) + e*dot(sourcePosition.zx, rayDirection.xz) + f * dot(sourcePosition.xy, rayDirection.yx) + dot(vec3(g,h,i), rayDirection.xyz);
  float C = dot(vec3(a,b,c), sourcePosition.xyz * sourcePosition.xyz) + dot(vec3(d,e,f), sourcePosition.yzx * sourcePosition.zxy) + dot(vec3(g,h,i), sourcePosition.xyz) + j;

  float discriminant = B * B - 4. * A * C;

  // what does the discriminant represent geometrically?
  if (discriminant >= 0.) {
    float intersectionsCenterToInersectionSquared = discriminant / (4. * A * A);
    float sourceToIntersectionsCenterDistance = - B / (2. * A);
    float intersectionsCenterToInersection = sqrt(intersectionsCenterToInersectionSquared);
    float rayIntersectionEnteringDistance = sourceToIntersectionsCenterDistance - intersectionsCenterToInersection;
    float rayIntersectionExitingDistance = sourceToIntersectionsCenterDistance + intersectionsCenterToInersection;
    return vec2(rayIntersectionEnteringDistance, rayIntersectionExitingDistance);
  }
  return vec2(-1., -1.);
}

vec3 quadricShapeNormal(vec3 shapeSurfacePoint, mat4 quadricShape) {
  mat4 quadricCoefficients = getQuadricCoefficients(quadricShape);
  float a = quadricCoefficients[0].x;
  float f = quadricCoefficients[1].x;
  float b = quadricCoefficients[1].y;
  float e = quadricCoefficients[2].x;
  float d = quadricCoefficients[2].y;
  float c = quadricCoefficients[2].z;
  float g = quadricCoefficients[3].x;
  float h = quadricCoefficients[3].y;
  float i = quadricCoefficients[3].z;
  float j = quadricCoefficients[3].w;

  float x = shapeSurfacePoint.x;
  float y = shapeSurfacePoint.y;
  float z = shapeSurfacePoint.z;

  vec3 normal = normalize(
  vec3 (2.*a*x + e*z + f*y + g,
        2.*b*y + d*z + f*x + h,
        2.*c*z + d*y + e*x + i));

  return normal;
}

mat3 getRayQuadricObjectProperties(vec3 sourcePosition, vec3 rayDirection, mat4 quadricShapeA, mat4 quadricShapeB, mat4 quadricShapeC, int enteringOrExiting) {

  vec2 rayShapeAIntersectionDistances = rayShapeIntersectionDistances(sourcePosition, rayDirection, quadricShapeA);
  vec2 rayShapeBIntersectionDistances = rayShapeIntersectionDistances(sourcePosition, rayDirection, quadricShapeB);
  vec2 rayShapeCIntersectionDistances = rayShapeIntersectionDistances(sourcePosition, rayDirection, quadricShapeC);

  float rayShapeAEnteringDistance = rayShapeAIntersectionDistances.x;
  float rayShapeBEnteringDistance = rayShapeBIntersectionDistances.x;
  float rayShapeCEnteringDistance = rayShapeCIntersectionDistances.x;

  float rayShapeAExitingDistance = rayShapeAIntersectionDistances.y;
  float rayShapeBExitingDistance = rayShapeBIntersectionDistances.y;
  float rayShapeCExitingDistance = rayShapeCIntersectionDistances.y;

  float rayShapeExitingDistance = rayShapeAExitingDistance;
  mat4 exitingSurfaceMatrix = quadricShapeA;
  if (rayShapeBExitingDistance < rayShapeExitingDistance) {
    exitingSurfaceMatrix = quadricShapeB;
    rayShapeExitingDistance = rayShapeBExitingDistance;
  }
  if (rayShapeCExitingDistance < rayShapeExitingDistance) {
    exitingSurfaceMatrix = quadricShapeC;
    rayShapeExitingDistance = rayShapeCExitingDistance;
  }

  float rayShapeEnteringDistance = rayShapeAEnteringDistance;
  mat4 enteringSurfaceMatrix = quadricShapeA;
  if (rayShapeBEnteringDistance > rayShapeEnteringDistance) {
    enteringSurfaceMatrix = quadricShapeB;
    rayShapeEnteringDistance = rayShapeBEnteringDistance;
  }
  if (rayShapeCEnteringDistance > rayShapeEnteringDistance) {
    enteringSurfaceMatrix = quadricShapeC;
    rayShapeEnteringDistance = rayShapeCEnteringDistance;
  }

  vec3 shapeSurfacePoint = enteringOrExiting == 1 ? sourcePosition + rayShapeExitingDistance * rayDirection : sourcePosition + rayShapeEnteringDistance * rayDirection;
  vec3 shapeSurfaceNormal = enteringOrExiting == 1 ? -quadricShapeNormal(shapeSurfacePoint, exitingSurfaceMatrix) : quadricShapeNormal(shapeSurfacePoint, enteringSurfaceMatrix);

  return mat3(rayShapeEnteringDistance,rayShapeExitingDistance,0,shapeSurfacePoint,shapeSurfaceNormal);
}
/* functions ends */

/* lights shading functions starts */
vec3 lightsShading(vec3 rgb, vec3 surfaceNormal, vec3 reflectionRayDirection, float highlightPower) {
  rgb += uAmbientLight;
  /* directional lights starts */
  for (int i = 0; i < DIRECTIONAL_LIGHTS_NUM; i++) {
    vec3 color = uDirectionalLights[i*2];
    vec3 direction = normalize(uDirectionalLights[i*2+1]);
    vec3 lightRGB = color * max(0., dot(surfaceNormal, direction));
    vec3 lightSpecularRGB = color * pow(max(0., dot(reflectionRayDirection, direction)), highlightPower);
    rgb += rgb * lightRGB;
    rgb += lightSpecularRGB;
  }
  /* directional lights ends */
  return rgb;
}
/* lights shading functions ends */

/* material shading functions starts */
vec3 marbleMaterial(vec3 surfacePoint) {
  // texture animation
  float objectMaterialTextureAnimRadius = objectMaterialTextureAnimBaseRadius + objectMaterialTextureAnimAmplitude * sin(adjustedTime);
  vec3 objectMaterialTextureAnimNoisePoint = surfacePoint * objectMaterialTextureAnimNoiseSpaceScale;
  vec3 objectMaterialTextureAnimNoise3D = vec3(turbulence(objectMaterialTextureAnimNoisePoint, detailsLevel));
  vec3 objectMaterialTextureAnimOffset3D = objectMaterialTextureAnimRadius * objectMaterialTextureAnimNoise3D;
  surfacePoint += vec3(objectMaterialTextureAnimOffset3D);
  // material color
  vec3 objectMaterialTextureNoisePoint = surfacePoint * objectMaterialTextureNoiseSpaceScale;
  float turbulenceAmount = sqrt(turbulence(objectMaterialTextureNoisePoint * objectMaterialTextureNoiseDetails, detailsLevel));
  vec3 objectMaterialTexture = vec3(pow(turbulenceAmount, 2.5), pow(turbulenceAmount, 1.), pow(turbulenceAmount, .5)) * objectMaterialTextureNoiseIntensity;
  vec3 rgb = objectMaterialColor + objectMaterialTexture;
  return rgb;
}
/* material shading functions ends */

/* refraction helper functions starts */

vec3 quadricObjectShadingWithoutRefraction(vec3 rgb, vec4 material, vec3 rayDirection, vec3 shapeSurfacePoint, vec3 shadingSurfaceNormal, mat4 quadricShapeA, mat4 quadricShapeB, mat4 quadricShapeC) {
  float materialOpacity = material.a;

  // material
  vec3 transformedShapeSurfacePoint = (vec4(shapeSurfacePoint,1.) * uTransformationMatrix).xyz;

  vec3 shapeRGB = material.rgb;
  if (materialOpacity != 0.) {
    rgb = marbleMaterial(transformedShapeSurfacePoint);
  }

  // lights
  vec3 reflectionRayDirection = rayDirection - 2. * shadingSurfaceNormal * dot(shadingSurfaceNormal, rayDirection);
  rgb = lightsShading(rgb, shadingSurfaceNormal, reflectionRayDirection, objectMaterialHighlightPower);

  /* refraction starts */
//   mat3 enteredRayProperties = getRefractedRayProperties(shapeSurfacePoint, rayDirection, shadingSurfaceNormal, airRefractiveIndex, lensRefractiveIndex);
//   vec3 enteredRayDirection = enteredRayProperties[1];
//   vec3 shapeEnteredPoint = enteredRayProperties[0];

//   mat3 rayQuardicObjectProperties = getRayQuadricObjectProperties(shapeEnteredPoint, enteredRayDirection, quadricShapeA, quadricShapeB, quadricShapeC, 1);
//   float refractiveRayShapeExitingDistance = rayQuardicObjectProperties[0].y;

//   vec3 shapeExitingPoint = rayQuardicObjectProperties[1];
//   vec3 exitingShapeNormal = rayQuardicObjectProperties[2];

//   mat3 exitedRayProperties = getRefractedRayProperties(shapeExitingPoint, enteredRayDirection, exitingShapeNormal, lensRefractiveIndex, airRefractiveIndex);
//   vec3 exitedRayDirection = exitedRayProperties[1];
//   vec3 shapeExitedPoint = exitedRayProperties[0];

//   vec3 refractedRGB = quadricObjectsShadingWithoutRefraction(rgb, shapeExitedPoint, exitedRayDirection);
//   rgb = mix(refractedRGB, rgb, materialOpacity);
  /* refraction ends */

  /* reflection starts */
  // if (materialOpacity == 0.) {
  //   vec3 reflectionPosition = shapeSurfacePoint + .001 * reflectionRayDirection;
  //   vec3 reflectedRGB = quadricObjectsShadingWithoutRefraction(rgb, reflectionPosition, reflectionRayDirection);
  //   rgb = mix(rgb, reflectedRGB, objectMaterialReflectiveness);
  // }
  /* reflection ends */

  return rgb;
}

vec3 quadricObjectsShadingWithoutRefraction(vec3 rgb, vec3 sourcePosition, vec3 rayDirection) {
  float closestSurfaceDistance = maxRenderingDistance;

  vec3 objectsRGB = rgb;
  for (int i = 0; i < OBJECTS_NUM; i++) {
    vec4 material = uMaterialVectors[i];

    mat4 quadricShapeA = uShapeAMatrices[i];
    mat4 quadricShapeB = uShapeBMatrices[i];
    mat4 quadricShapeC = uShapeCMatrices[i];

    mat3 rayQuardicObjectProperties = getRayQuadricObjectProperties(sourcePosition, rayDirection, quadricShapeA, quadricShapeB, quadricShapeC, -1);

    float rayShapeExitingDistance = rayQuardicObjectProperties[0].y;
    float shadingSurfaceDistance = rayQuardicObjectProperties[0].x;
    vec3 shadingSurfacePoint = rayQuardicObjectProperties[1];
    vec3 shadingSurfaceNormal = rayQuardicObjectProperties[2];

    if (rayShapeExitingDistance > shadingSurfaceDistance && shadingSurfaceDistance > 0. && shadingSurfaceDistance < closestSurfaceDistance) {
      closestSurfaceDistance = shadingSurfaceDistance;

      objectsRGB = quadricObjectShadingWithoutRefraction(rgb, material, rayDirection, shadingSurfacePoint, shadingSurfaceNormal, quadricShapeA, quadricShapeB, quadricShapeC);
    }
  }
  return objectsRGB;
}

vec3 quadricObjectShadingWithRefraction(vec3 rgb, vec4 material, vec3 rayDirection, vec3 shapeSurfacePoint, vec3 shadingSurfaceNormal, mat4 quadricShapeA, mat4 quadricShapeB, mat4 quadricShapeC) {
  float materialOpacity = material.a;

  // material
  vec3 transformedShapeSurfacePoint = (vec4(shapeSurfacePoint,1.) * uTransformationMatrix).xyz;


  vec3 shapeRGB = material.rgb;
  if (materialOpacity != 0.) {
    rgb = marbleMaterial(transformedShapeSurfacePoint);
  }

  // lights
  vec3 reflectionRayDirection = rayDirection - 2. * shadingSurfaceNormal * dot(shadingSurfaceNormal, rayDirection);
  rgb = lightsShading(rgb, shadingSurfaceNormal, reflectionRayDirection, objectMaterialHighlightPower);

  /* refraction starts */
  mat3 enteredRayProperties = getRefractedRayProperties(shapeSurfacePoint, rayDirection, shadingSurfaceNormal, airRefractiveIndex, lensRefractiveIndex);
  vec3 enteredRayDirection = enteredRayProperties[1];
  vec3 shapeEnteredPoint = enteredRayProperties[0];

  mat3 rayQuardicObjectProperties = getRayQuadricObjectProperties(shapeEnteredPoint, enteredRayDirection, quadricShapeA, quadricShapeB, quadricShapeC, 1);
  float refractiveRayShapeExitingDistance = rayQuardicObjectProperties[0].y;

  vec3 shapeExitingPoint = rayQuardicObjectProperties[1];
  vec3 exitingShapeNormal = rayQuardicObjectProperties[2];

  mat3 exitedRayProperties = getRefractedRayProperties(shapeExitingPoint, enteredRayDirection, exitingShapeNormal, lensRefractiveIndex, airRefractiveIndex);
  vec3 exitedRayDirection = exitedRayProperties[1];
  vec3 shapeExitedPoint = exitedRayProperties[0];

  vec3 refractedRGB = quadricObjectsShadingWithoutRefraction(rgb, shapeExitedPoint, exitedRayDirection);
  rgb = mix(refractedRGB, rgb, materialOpacity);
  /* refraction ends */

  /* reflection starts */
  // if (materialOpacity == 0.) {
  //   vec3 reflectionPosition = shapeSurfacePoint + .001 * reflectionRayDirection;
  //   vec3 reflectedRGB = quadricObjectsShadingWithoutRefraction(rgb, reflectionPosition, reflectionRayDirection);
  //   rgb = mix(rgb, reflectedRGB, objectMaterialReflectiveness);
  // }
  /* reflection ends */

  return rgb;
}

vec3 quadricObjectsShadingWithRefraction(vec3 rgb, vec3 sourcePosition, vec3 rayDirection) {
  float closestSurfaceDistance = maxRenderingDistance;

  vec3 objectsRGB = rgb;
  for (int i = 0; i < OBJECTS_NUM; i++) {
    vec4 material = uMaterialVectors[i];

    mat4 quadricShapeA = uShapeAMatrices[i];
    mat4 quadricShapeB = uShapeBMatrices[i];
    mat4 quadricShapeC = uShapeCMatrices[i];

    mat3 rayQuardicObjectProperties = getRayQuadricObjectProperties(sourcePosition, rayDirection, quadricShapeA, quadricShapeB, quadricShapeC, -1);

    float rayShapeExitingDistance = rayQuardicObjectProperties[0].y;
    float shadingSurfaceDistance = rayQuardicObjectProperties[0].x;
    vec3 shadingSurfacePoint = rayQuardicObjectProperties[1];
    vec3 shadingSurfaceNormal = rayQuardicObjectProperties[2];

    if (rayShapeExitingDistance > shadingSurfaceDistance && shadingSurfaceDistance > 0. && shadingSurfaceDistance < closestSurfaceDistance) {
      closestSurfaceDistance = shadingSurfaceDistance;

      objectsRGB = quadricObjectShadingWithRefraction(rgb, material, rayDirection, shadingSurfacePoint, shadingSurfaceNormal, quadricShapeA, quadricShapeB, quadricShapeC);
    }
  }
  return objectsRGB;
}

/* refraction helper functions ends */

/* surface shading functions starts */
vec3 quadricObjectShading(vec3 rgb, vec4 material, vec3 rayDirection, vec3 shapeSurfacePoint, vec3 shadingSurfaceNormal, mat4 quadricShapeA, mat4 quadricShapeB, mat4 quadricShapeC) {
  float materialOpacity = material.a;

  // material
  vec3 transformedShapeSurfacePoint = (vec4(shapeSurfacePoint,1.) * uTransformationMatrix).xyz;

  vec3 shapeRGB = material.rgb;
  if (materialOpacity != 0.) {
    rgb = marbleMaterial(transformedShapeSurfacePoint);
  }

  // lights
  vec3 reflectionRayDirection = rayDirection - 2. * shadingSurfaceNormal * dot(shadingSurfaceNormal, rayDirection);
  rgb = lightsShading(rgb, shadingSurfaceNormal, reflectionRayDirection, objectMaterialHighlightPower);

  /* refraction starts */
  mat3 enteredRayProperties = getRefractedRayProperties(shapeSurfacePoint, rayDirection, shadingSurfaceNormal, airRefractiveIndex, lensRefractiveIndex);
  vec3 enteredRayDirection = enteredRayProperties[1];
  vec3 shapeEnteredPoint = enteredRayProperties[0];

  mat3 rayQuardicObjectProperties = getRayQuadricObjectProperties(shapeEnteredPoint, enteredRayDirection, quadricShapeA, quadricShapeB, quadricShapeC, 1);
  float refractiveRayShapeExitingDistance = rayQuardicObjectProperties[0].y;

  vec3 shapeExitingPoint = rayQuardicObjectProperties[1];
  vec3 exitingShapeNormal = rayQuardicObjectProperties[2];

  mat3 exitedRayProperties = getRefractedRayProperties(shapeExitingPoint, enteredRayDirection, exitingShapeNormal, lensRefractiveIndex, airRefractiveIndex);
  vec3 exitedRayDirection = exitedRayProperties[1];
  vec3 shapeExitedPoint = exitedRayProperties[0];

  vec3 refractedRGB = quadricObjectsShadingWithRefraction(rgb, shapeExitedPoint, exitedRayDirection);
  rgb = mix(refractedRGB, rgb, materialOpacity);
  /* refraction ends */

  /* reflection starts */
  if (materialOpacity == 0.) {
    vec3 reflectionPosition = shapeSurfacePoint + .001 * reflectionRayDirection;
    vec3 reflectedRGB = quadricObjectsShadingWithRefraction(rgb, reflectionPosition, reflectionRayDirection);
    rgb = mix(rgb, reflectedRGB, objectMaterialReflectiveness);
  }
  /* reflection ends */

  return rgb;
}

vec3 quadricObjectsShading(vec3 rgb, vec3 sourcePosition, vec3 rayDirection) {
  float closestSurfaceDistance = maxRenderingDistance;

  vec3 objectsRGB = rgb;
  for (int i = 0; i < OBJECTS_NUM; i++) {
    mat4 quadricShapeA = uShapeAMatrices[i];
    mat4 quadricShapeB = uShapeBMatrices[i];
    mat4 quadricShapeC = uShapeCMatrices[i];

    mat3 rayQuardicObjectProperties = getRayQuadricObjectProperties(sourcePosition, rayDirection, quadricShapeA, quadricShapeB, quadricShapeC, -1);

    float rayShapeExitingDistance = rayQuardicObjectProperties[0].y;
    float shadingSurfaceDistance = rayQuardicObjectProperties[0].x;

    if (rayShapeExitingDistance > shadingSurfaceDistance && shadingSurfaceDistance > 0. && shadingSurfaceDistance < closestSurfaceDistance) {
      closestSurfaceDistance = shadingSurfaceDistance;

      vec3 shadingSurfacePoint = rayQuardicObjectProperties[1];
      vec3 shadingSurfaceNormal = rayQuardicObjectProperties[2];
      vec4 material = uMaterialVectors[i];
      objectsRGB = quadricObjectShading(rgb, material, rayDirection, shadingSurfacePoint, shadingSurfaceNormal, quadricShapeA, quadricShapeB, quadricShapeC);
    }
  }
  return objectsRGB;
}
/* surface shading functions ends */

void main(void) {

  /* camera starts */
  vec4 pos = vec4(vPos, 1.);
  pos.xy *= uResolution / min(uResolution.x, uResolution.y);
  pos.xy += cameraPosition.xy;
  vec3 cameraRayDirection = normalize(vec3(pos.xy, -uFocalLength));
  /* camera stops */

  /* background shading starts */
  vec3 rgb = mix(gradientColorBottom, gradientColorTop, gradientIntensity * pos.y);
  /* background shading ends */

  /* quadric objects shading starts */
  rgb = quadricObjectsShading(rgb, cameraPosition, cameraRayDirection);
  /* quadric objects shading ends */

  /* post processing starts */
  rgb += overallColorTint;
  /* post processing ends */

  gl_FragColor = vec4(sqrt(rgb), 1.0);
}
`;
