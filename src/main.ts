import "./style.css";

// Define the DrawingCommand interface with display and drag methods
interface DrawingCommand {
  display(ctx: CanvasRenderingContext2D): void;
  drag(x: number, y: number): void;
}

// Define the MarkerLine interface which extends DrawingCommand
interface MarkerLine extends DrawingCommand {
  points: { x: number, y: number }[]; // MarkerLine holds an array of points
}

// Create a function to initialize a MarkerLine object
const createMarkerLine = (startX: number, startY: number): MarkerLine => {
  const points = [{ x: startX, y: startY }];

  return {
    points,

    // Method to extend the line when dragging
    drag(x: number, y: number): void {
      points.push({ x, y });
    },

    // Method to render the line on the canvas
    display(ctx: CanvasRenderingContext2D): void {
      if (points.length === 0) return;

      ctx.beginPath();
      points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
    }
  };
};

const APP_NAME = "Frank's Sketchpad";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;

const appTitle: HTMLHeadingElement = document.createElement("h1");
appTitle.innerHTML = APP_NAME;
app.appendChild(appTitle);

// Create canvas
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
    const lastCommand = drawingData.pop(); // Remove the last drawing command
    if (lastCommand) {
      redoStack.push(lastCommand); // Add it to the redo stack
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
    const lastRedoCommand = redoStack.pop(); // Remove the last command from the redo stack
    if (lastRedoCommand) {
      drawingData.push(lastRedoCommand); // Add it back to the drawing data
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
let drawingData: DrawingCommand[] = []; // Array to store drawing commands
let currentCommand: MarkerLine | null = null;
let redoStack: DrawingCommand[] = []; // Stack to store undone drawing commands

// Function to dispatch "drawing-changed" event
const dispatchDrawingChanged = () => {
  const event = new Event("drawing-changed");
  canvas.dispatchEvent(event);
};

// Start drawing (beginning of a stroke)
const startDrawing = (event: MouseEvent) => {
  isDrawing = true;

  // Create a new MarkerLine for the current stroke
  currentCommand = createMarkerLine(event.offsetX, event.offsetY);

  // Clear the redo stack since we're making a new stroke
  redoStack = [];
  dispatchDrawingChanged(); // Trigger an update
};

// Drawing while the mouse is down
const draw = (event: MouseEvent) => {
  if (!isDrawing || !currentCommand) return;

  // Extend the current line
  currentCommand.drag(event.offsetX, event.offsetY);
  redraw(); // Redraw on each mouse move to show the current stroke
};

// Stop drawing (end of a stroke)
const stopDrawing = () => {
  if (isDrawing && currentCommand) {
    drawingData.push(currentCommand); // Save the current command into the drawing data
    currentCommand = null;
    isDrawing = false;
    dispatchDrawingChanged(); // Update after the stroke is completed
  }
};

// Function to clear and redraw the entire canvas
const redraw = () => {
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

    // Redraw all completed drawing commands
    drawingData.forEach(command => {
      command.display(ctx); // Display each command
    });

    // Display the currently active command (in progress)
    if (currentCommand) {
      currentCommand.display(ctx);
    }
  }
};

// Add an event listener for the custom "drawing-changed" event
canvas.addEventListener("drawing-changed", redraw);

// Add event listeners for drawing
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing); // Also stop drawing if the mouse leaves the canvas
