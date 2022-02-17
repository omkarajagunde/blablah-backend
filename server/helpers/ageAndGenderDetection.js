//1. tensorflow settings
// import nodejs bindings to native tensorflow,
// not required, but will speed up things drastically (python required)
require("@tensorflow/tfjs-node");
// implements nodejs wrappers for HTMLCanvasElement, HTMLImageElement, ImageData
const canvas = require("canvas");
const faceapi = require("face-api.js");
// patch nodejs environment, we need to provide an implementation of
// HTMLCanvasElement and HTMLImageElement
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

//2. Face detector settings
const faceDetectionNet = faceapi.nets.ssdMobilenetv1;
// export const faceDetectionNet = tinyFaceDetector

// SsdMobilenetv1Options
const minConfidence = 0.5;

// TinyFaceDetectorOptions
const inputSize = 408;
const scoreThreshold = 0.5;

function getFaceDetectorOptions(net) {
	return net === faceapi.nets.ssdMobilenetv1 ? new faceapi.SsdMobilenetv1Options({ minConfidence }) : new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold });
}

const faceDetectionOptions = getFaceDetectorOptions(faceDetectionNet);

module.exports.canvas = canvas;
module.exports.faceDetectionOptions = faceDetectionOptions;
module.exports.faceDetectionNet = faceDetectionNet;
