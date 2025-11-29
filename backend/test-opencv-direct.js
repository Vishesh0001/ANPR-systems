import { createRequire } from "module";
const require = createRequire(import.meta.url);
const cvModule = require("@techstark/opencv-js");

console.log("cvModule keys:", Object.keys(cvModule).slice(0, 20));
console.log("cvModule.Mat:", typeof cvModule.Mat);
console.log("cvModule.getBuildInformation:", typeof cvModule.getBuildInformation);

if (cvModule.Mat) {
    console.log("✅ OpenCV is ready!");
    console.log("Build info:", cvModule.getBuildInformation());
} else {
    console.log("❌ OpenCV not ready, setting callback...");
    cvModule.onRuntimeInitialized = () => {
        console.log("✅ Callback fired!");
        console.log("cvModule.Mat:", typeof cvModule.Mat);
    };
}

setTimeout(() => {
    console.log("After 2 seconds:");
    console.log("cvModule.Mat:", typeof cvModule.Mat);
    process.exit(0);
}, 2000);
