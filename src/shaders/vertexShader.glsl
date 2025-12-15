attribute vec3 vertex;
attribute vec3 normal;
attribute vec2 texCoord;
attribute vec3 tangent;
attribute vec3 bitangent;

uniform mat4 ModelViewProjectionMatrix;
uniform mat4 ModelViewMatrix;
uniform mat4 NormalMatrix;

uniform float textureRotationAngle;
uniform vec2 rotationCenter;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vTexCoord;
varying vec3 vTangent;
varying vec3 vBitangent;

void main() {
    vec4 position = ModelViewMatrix * vec4(vertex, 1.0);
    vPosition = position.xyz;

    // Transform normal, tangent, and bitangent to view space
    vNormal = normalize((NormalMatrix * vec4(normal, 0.0)).xyz);
    vTangent = normalize((NormalMatrix * vec4(tangent, 0.0)).xyz);
    vBitangent = normalize((NormalMatrix * vec4(bitangent, 0.0)).xyz);

    // Apply texture rotation around user-specified point
    vec2 translatedCoord = texCoord - rotationCenter;
    float cosAngle = cos(textureRotationAngle);
    float sinAngle = sin(textureRotationAngle);
    vec2 rotatedCoord = vec2(
        cosAngle * translatedCoord.x - sinAngle * translatedCoord.y,
        sinAngle * translatedCoord.x + cosAngle * translatedCoord.y
    );
    vTexCoord = rotatedCoord + rotationCenter;

    gl_Position = ModelViewProjectionMatrix * vec4(vertex, 1.0);
}
