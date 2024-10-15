import "./style.css";

const APP_NAME = "Frank's Sketchpad";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;

const appTitle: HTMLHeadingElement = document.createElement("h1");
appTitle.innerHTML = APP_NAME;
app.appendChild(appTitle);

// create canvas
const canvas: HTMLCanvasElement = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
app.appendChild(canvas);

//create div for clear, undo, redo buttons
const buttonDiv: HTMLDivElement = document.createElement("div");
buttonDiv.className = "buttonDiv";
app.appendChild(buttonDiv);

// create clear button
const clearButton: HTMLButtonElement = document.createElement("button");
clearButton.innerHTML = "Clear";
clearButton.onclick = () => {
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
};
buttonDiv.appendChild(clearButton);

// Get the 2D drawing context
const ctx = canvas.getContext("2d");
if (ctx) {
  ctx.lineWidth = 2; // Set the thickness of the drawing line
  ctx.strokeStyle = "black"; // Set the color of the line
}

let isDrawing = false;

const startDrawing = (event: MouseEvent) => {
  isDrawing = true;
  if (ctx) {
    ctx.beginPath(); // Begin a new path
    ctx.moveTo(event.offsetX, event.offsetY); // Move the path to the mouse position
  }
};

const draw = (event: MouseEvent) => {
  if (!isDrawing || !ctx) return; // Don't draw if not pressed or context not available
  ctx.lineTo(event.offsetX, event.offsetY); // Create a line to the new position
  ctx.stroke(); // Render the line on the canvas
};

const stopDrawing = () => {
  isDrawing = false;
  if (ctx) {
    ctx.closePath(); // Close the path when drawing stops
  }
};

// Add event listeners for drawing
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing); // Also stop drawing if the mouse leaves the canvas