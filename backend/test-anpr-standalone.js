import anprService from "./src/services/anprService.js";
import path from "path";

const imagePath = path.resolve("./test1.png");
console.log("Testing with:", imagePath);

try {
    const result = await anprService.processFrame(imagePath, 1);
    console.log("Result:", result);
} catch (error) {
    console.error("Error:", error);
}
