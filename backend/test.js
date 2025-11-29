// Import the OpenCV.js library
import cv from 'opencv.js';

// Load the image
const src = cv.imread('test.jpeg');

// Convert the image to grayscale
const gray = new cv.Mat();
cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

// Resize the image
const resized = new cv.Mat();
cv.resize(gray, resized, new cv.Size(800, 600));

// Apply thresholding
const threshold = new cv.Mat();
cv.threshold(resized, threshold, 127, 255, cv.THRESH_BINARY);