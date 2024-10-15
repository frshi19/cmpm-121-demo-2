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

// Create div for clear, undo, redo buttons
const buttonDiv: HTMLDivElement = document.createElement("div");
buttonDiv.className = "buttonDiv";
app.appendChild(buttonDiv);

// Create clear button
const clearButton: HTMLButtonElement = document.createElement("button");
clearButton.innerHTML = "Clear";
clearButton.onclick = () => {
  drawingData = [];
  redoStack = [];
  dispatchDrawingChanged();
};
buttonDiv.appendChild(clearButton);

// Create undo button
const undoButton: HTMLButtonElement = document.createElement("button");
undoButton.innerHTML = "Undo";
undoButton.onclick = () => {
  if (drawingData.length > 0) {
    const lastStroke = drawingData.pop(); // Remove the last stroke
    if (lastStroke) {
      redoStack.push(lastStroke); // Add the removed stroke to the redo stack
    }
    dispatchDrawingChanged();
  }
};
buttonDiv.appendChild(undoButton);

// Create redo button
const redoButton: HTMLButtonElement = document.createElement("button");
redoButton.innerHTML = "Redo";
redoButton.onclick = () => {
  if (redoStack.length > 0) {
    const lastRedoStroke = redoStack.pop(); // Remove the last stroke from the redo stack
    if (lastRedoStroke) {
      drawingData.push(lastRedoStroke); // Add the stroke back to the drawing data
    }
    dispatchDrawingChanged();
  }
};
buttonDiv.appendChild(redoButton);

// Get the 2D drawing context
const ctx = canvas.getContext("2d");
if (ctx) {
  ctx.lineWidth = 2; // Set the thickness of the drawing line
  ctx.strokeStyle = "black"; // Set the color of the line
}

let isDrawing = false;
let drawingData: Array<Array<{ x: number, y: number }>> = []; // Array to store the strokes
let currentStroke: Array<{ x: number, y: number }> = []; // Stroke currently being drawn
let redoStack: Array<Array<{ x: number, y: number }>> = []; // Stack to store undone strokes

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

  // Clear the redo stack since we're making a new stroke
  redoStack = [];
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
