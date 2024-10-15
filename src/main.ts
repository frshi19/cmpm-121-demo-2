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
  drawingData = [];
  currentStroke = [];
  dispatchDrawingChanged();
};
buttonDiv.appendChild(clearButton);

// Get the 2D drawing context
const ctx = canvas.getContext("2d");
if (ctx) {
  ctx.lineWidth = 2; // Set the thickness of the drawing line
  ctx.strokeStyle = "black"; // Set the color of the line
}

let isDrawing = false;
let drawingData: Array<Array<{ x: number, y: number }>> = []; // Array to store the strokes
let currentStroke: Array<{ x: number, y: number }> = []; // Stroke currently being drawn

// Function to dispatch "drawing-changed" event
const dispatchDrawingChanged = () => {
  const event = new Event("drawing-changed");
  canvas.dispatchEvent(event);
};

// Start drawing (beginning of a stroke)
const startDrawing = (event: MouseEvent) => {
  isDrawing = true;
  currentStroke = [];
  currentStroke.push({ x: event.offsetX, y: event.offsetY }); // Add the first point
  dispatchDrawingChanged(); // Trigger an update
};

// Drawing while the mouse is down
const draw = (event: MouseEvent) => {
  if (!isDrawing) return;

  currentStroke.push({ x: event.offsetX, y: event.offsetY }); // Add points to the current stroke
  redraw(); // Redraw on each mouse move to show the current stroke
};

// Stop drawing (end of a stroke)
const stopDrawing = () => {
  if (isDrawing) {
    drawingData.push(currentStroke); // Save the stroke into drawing data
    currentStroke = [];
    isDrawing = false;
    dispatchDrawingChanged(); // Update after stroke is completed
  }
};

// Function to clear and redraw the entire canvas
const redraw = () => {
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    ctx.beginPath();

    // Redraw all completed strokes
    drawingData.forEach(stroke => {
      stroke.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y); // Move to the first point of the stroke
        } else {
          ctx.lineTo(point.x, point.y); // Draw a line to the next point
        }
      });
    });

    // Draw the currently active stroke (in progress)
    currentStroke.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y); // Move to the first point of the current stroke
      } else {
        ctx.lineTo(point.x, point.y); // Draw a line to the next point
      }
    });

    ctx.stroke(); // Apply the stroke
  }
};

// Add an event listener for the custom "drawing-changed" event
canvas.addEventListener("drawing-changed", redraw);

// Add event listeners for drawing
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing); // Also stop drawing if the mouse leaves the canvas
