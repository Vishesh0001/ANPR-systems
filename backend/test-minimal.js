import anprService from "./src/services/anprService.js";

console.log("Starting minimal test...");

async function test() {
    try {
        console.log("About to call processFrame...");
        const result = await anprService.processFrame("./test1.png", 1);
        console.log("processFrame returned:", result);
    } catch (error) {
        console.error("Error:", error);
    }
    console.log("Test completed");
    process.exit(0);
}

test();
