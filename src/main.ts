import "./style.css";

// Constants for magic numbers
const thinSize = 1;
const thickSize = 4;
const exportWidth = 1024;
const exportHeight = 1024;
const emojiSize = 20;

// Define the DrawingCommand interface with display and drag methods
interface DrawingCommand {
  display(ctx: CanvasRenderingContext2D): void;
  drag(x: number, y: number): void;
}

// Define the BrushLine interface which extends DrawingCommand
interface BrushLine extends DrawingCommand {
  points: { x: number, y: number }[];
  thickness: number;
}

// Define the EmojiCommand interface which extends DrawingCommand
interface EmojiCommand extends DrawingCommand {
  emoji: string;
  x: number;
  y: number;
  size: number;
}

// Define the ToolPreview interface
interface ToolPreview {
  x: number;
  y: number;
  thickness?: number;
  emoji?: string;
  draw(ctx: CanvasRenderingContext2D): void;
}

// Create a function to initialize a BrushLine object
const createBrushLine = (startX: number, startY: number, thickness: number): BrushLine => {
  const points = [{ x: startX, y: startY }];

  return {
    points,
    thickness,

    drag(x: number, y: number): void {
      points.push({ x, y });
    },

    display(ctx: CanvasRenderingContext2D): void {
      if (points.length === 0) return;

      ctx.lineWidth = this.thickness;
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

// Create a function to initialize a ToolPreview object (for brush or emoji)
const createToolPreview = (x: number, y: number, thickness?: number, emoji?: string): ToolPreview => {
  return {
    x,
    y,
    thickness,
    emoji,

    draw(ctx: CanvasRenderingContext2D): void {
      if (emoji) {
        ctx.font = emojiSize + "px serif";
        ctx.fillText(emoji, this.x - 10, this.y + 10); // Offset to center emoji
      } else if (thickness) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = "black";
        ctx.beginPath();
        ctx.arc(this.x, this.y, thickness / 2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  };
};

// Create a function to initialize an EmojiCommand object
const createEmojiCommand = (emoji: string, x: number, y: number, size: number): EmojiCommand => {
  return {
    emoji,
    x,
    y,
    size,

    drag(newX: number, newY: number): void {
      this.x = newX;
      this.y = newY;
    },

    display(ctx: CanvasRenderingContext2D): void {
      ctx.font = `${this.size}px serif`;
      ctx.fillText(this.emoji, this.x - this.size / 2, this.y + this.size / 2);
    }
  };
};

const APP_NAME = "Frank's Sketchpad";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;

const appTitle: HTMLHeadingElement = document.createElement("h1");
appTitle.innerHTML = APP_NAME;
app.appendChild(appTitle);

const canvas: HTMLCanvasElement = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
app.appendChild(canvas);
canvas.style.cursor = "none";

const buttonDivTop: HTMLDivElement = document.createElement("div");
buttonDivTop.className = "buttonDivTop";
app.appendChild(buttonDivTop);

const buttonDivBottom: HTMLDivElement = document.createElement("div");
buttonDivBottom.className = "buttonDivBottom";
app.appendChild(buttonDivBottom);

// Create the top row of buttons
const clearButton: HTMLButtonElement = document.createElement("button");
clearButton.innerHTML = "Clear";
clearButton.onclick = () => {
  drawingData = [];
  redoStack = [];
  dispatchDrawingChanged();
};
buttonDivTop.appendChild(clearButton);

const undoButton: HTMLButtonElement = document.createElement("button");
undoButton.innerHTML = "Undo";
undoButton.onclick = () => {
  if (drawingData.length > 0) {
    const lastCommand = drawingData.pop();
    if (lastCommand) {
      redoStack.push(lastCommand);
    }
    dispatchDrawingChanged();
  }
};
buttonDivTop.appendChild(undoButton);

const redoButton: HTMLButtonElement = document.createElement("button");
redoButton.innerHTML = "Redo";
redoButton.onclick = () => {
  if (redoStack.length > 0) {
    const lastRedoCommand = redoStack.pop();
    if (lastRedoCommand) {
      drawingData.push(lastRedoCommand);
    }
    dispatchDrawingChanged();
  }
};
buttonDivTop.appendChild(redoButton);

const exportButton: HTMLButtonElement = document.createElement("button");
exportButton.innerHTML = "Export";
exportButton.onclick = () => {
  // Create a temporary canvas of size 1024x1024
  const exportCanvas: HTMLCanvasElement = document.createElement("canvas");
  exportCanvas.width = exportWidth;
  exportCanvas.height = exportHeight;
  const exportCtx = exportCanvas.getContext("2d");

  if (exportCtx) {
    // Scale the drawing to fill the larger canvas (4x scale)
    exportCtx.scale(4, 4);

    // Redraw all commands onto the larger canvas
    drawingData.forEach(command => {
      command.display(exportCtx);
    });

    // Create a download link for the image
    const anchor = document.createElement("a");
    anchor.href = exportCanvas.toDataURL("image/png");
    anchor.download = "sketchpad.png";
    anchor.click();
  }
};

// Create the bottom row of buttons
const thinButton: HTMLButtonElement = document.createElement("button");
thinButton.innerHTML = "Thin";
thinButton.onclick = () => setToolThickness(thinSize, thinButton);
buttonDivBottom.appendChild(thinButton);

const thickButton: HTMLButtonElement = document.createElement("button");
thickButton.innerHTML = "Thick";
thickButton.onclick = () => setToolThickness(thickSize, thickButton);
buttonDivBottom.appendChild(thickButton);

const setToolThickness = (thicknessValue: number, button: HTMLButtonElement) => {
  currentThickness = thicknessValue;
  selectedEmoji = null;

  const buttons = document.querySelectorAll('.buttonDivBottom button');
  buttons.forEach(btn => btn.classList.remove("selectedTool"));
  button.classList.add("selectedTool");
};

// Store emojis in an array for a data-driven approach
const emojis = ["🙂", "🍄", "🐟", "🐻"];

// Function to create emoji buttons
const createEmojiButtons = () => {
  // Clear previous emoji buttons
  const existingEmojiButtons = buttonDivBottom.querySelectorAll(".emojiButton");
  existingEmojiButtons.forEach(button => button.remove());

  // Create buttons for each emoji
  emojis.forEach((emoji) => {
    const emojiButton: HTMLButtonElement = document.createElement("button");
    emojiButton.className = "emojiButton"; // Add class for easy identification
    emojiButton.innerHTML = emoji;
    emojiButton.onclick = () => {
      selectedEmoji = emoji;
      currentThickness = 0; // Reset thickness when an emoji is selected
      const buttons = document.querySelectorAll('.buttonDivBottom button');
      buttons.forEach(btn => btn.classList.remove("selectedTool")); // Clear selected state
      emojiButton.classList.add("selectedTool"); // Set the selected state for the current emoji
    };
    buttonDivBottom.appendChild(emojiButton);
  });
};

// Add custom emoji button
const customEmojiButton: HTMLButtonElement = document.createElement("button");
customEmojiButton.innerHTML = "Add Custom Emoji";
customEmojiButton.onclick = () => {
  const customEmoji = prompt("Enter your custom emoji:", "🧽");
  if (customEmoji) {
    emojis.push(customEmoji);
    createEmojiButtons(); // Recreate emoji buttons to include the new custom emoji
  }
};
buttonDivTop.appendChild(customEmojiButton);
buttonDivTop.appendChild(exportButton);
createEmojiButtons();

const ctx = canvas.getContext("2d");
if (ctx) {
  ctx.lineWidth = 1;
  ctx.strokeStyle = "black";
}

let isDrawing = false;
let currentThickness = 1;
let drawingData: DrawingCommand[] = [];
let currentCommand: BrushLine | EmojiCommand | null = null;
let redoStack: DrawingCommand[] = [];
let toolPreview: ToolPreview | null = null;
let selectedEmoji: string | null = null;

const dispatchDrawingChanged = () => {
  const event = new Event("drawing-changed");
  canvas.dispatchEvent(event);
};

const dispatchToolMoved = (x: number, y: number) => {
  const event = new CustomEvent("tool-moved", {
    detail: { x, y }
  });
  canvas.dispatchEvent(event);
};

const startDrawing = (event: MouseEvent) => {
  isDrawing = true;
  toolPreview = null;

  if (selectedEmoji) {
    currentCommand = createEmojiCommand(selectedEmoji, event.offsetX, event.offsetY, emojiSize);
  } else {
    currentCommand = createBrushLine(event.offsetX, event.offsetY, currentThickness);
  }

  redoStack = [];
  dispatchDrawingChanged();
};

const draw = (event: MouseEvent) => {
  if (!isDrawing || !currentCommand) return;

  currentCommand.drag(event.offsetX, event.offsetY);
  redraw();
};

const stopDrawing = () => {
  if (isDrawing && currentCommand) {
    drawingData.push(currentCommand);
    currentCommand = null;
    isDrawing = false;
    dispatchDrawingChanged();
  }
};

const redraw = () => {
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawingData.forEach(command => {
      command.display(ctx);
    });

    if (currentCommand) {
      currentCommand.display(ctx);
    }

    if (!isDrawing && toolPreview) {
      toolPreview.draw(ctx);
    }
  }
};

canvas.addEventListener("drawing-changed", redraw);

canvas.addEventListener("tool-moved", (event: Event) => {
  const customEvent = event as CustomEvent<{ x: number, y: number }>;
  const { x, y } = customEvent.detail;

  if (selectedEmoji) {
    toolPreview = createToolPreview(x, y, undefined, selectedEmoji);
  } else {
    toolPreview = createToolPreview(x, y, currentThickness);
  }

  redraw();
});

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', (event: MouseEvent) => {
  if (!isDrawing) {
    dispatchToolMoved(event.offsetX, event.offsetY);
  }
  draw(event);
});
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);
