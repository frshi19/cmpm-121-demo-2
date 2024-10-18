import "./style.css";

// Define the DrawingCommand interface with display and drag methods
interface DrawingCommand {
  display(ctx: CanvasRenderingContext2D): void;
  drag(x: number, y: number): void;
}

// Define the MarkerLine interface which extends DrawingCommand
interface MarkerLine extends DrawingCommand {
  points: { x: number, y: number }[];
  thickness: number;
}

// Define the StickerCommand interface which extends DrawingCommand
interface StickerCommand extends DrawingCommand {
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

// Create a function to initialize a MarkerLine object
const createMarkerLine = (startX: number, startY: number, thickness: number): MarkerLine => {
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

// Create a function to initialize a ToolPreview object (for marker or sticker)
const createToolPreview = (x: number, y: number, thickness?: number, emoji?: string): ToolPreview => {
  return {
    x,
    y,
    thickness,
    emoji,

    draw(ctx: CanvasRenderingContext2D): void {
      if (emoji) {
        ctx.font = "30px serif";
        ctx.fillText(emoji, this.x - 15, this.y + 15); // Offset to center emoji
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

// Create a function to initialize a StickerCommand object
const createStickerCommand = (emoji: string, x: number, y: number, size: number): StickerCommand => {
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

const buttonDiv: HTMLDivElement = document.createElement("div");
buttonDiv.className = "buttonDiv";
app.appendChild(buttonDiv);

const clearButton: HTMLButtonElement = document.createElement("button");
clearButton.innerHTML = "Clear";
clearButton.onclick = () => {
  drawingData = [];
  redoStack = [];
  dispatchDrawingChanged();
};
buttonDiv.appendChild(clearButton);

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
buttonDiv.appendChild(undoButton);

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
buttonDiv.appendChild(redoButton);

const thinButton: HTMLButtonElement = document.createElement("button");
thinButton.innerHTML = "Thin";
thinButton.onclick = () => setToolThickness(2, thinButton);
buttonDiv.appendChild(thinButton);

const thickButton: HTMLButtonElement = document.createElement("button");
thickButton.innerHTML = "Thick";
thickButton.onclick = () => setToolThickness(8, thickButton);
buttonDiv.appendChild(thickButton);

const setToolThickness = (thicknessValue: number, button: HTMLButtonElement) => {
  currentThickness = thicknessValue;
  selectedSticker = null;

  const buttons = document.querySelectorAll('.buttonDiv button');
  buttons.forEach(btn => btn.classList.remove("selectedTool"));
  button.classList.add("selectedTool");
};

// Add sticker buttons
const stickerEmojis = ["🙂", "🍄", "🐟"];
stickerEmojis.forEach((emoji) => {
  const stickerButton: HTMLButtonElement = document.createElement("button");
  stickerButton.innerHTML = emoji;
  stickerButton.onclick = () => {
    selectedSticker = emoji;
    currentThickness = 0; // Reset thickness when a sticker is selected
    const buttons = document.querySelectorAll('.buttonDiv button');
    buttons.forEach(btn => btn.classList.remove("selectedTool")); // Clear selected state
    stickerButton.classList.add("selectedTool"); // Set the selected state for the current sticker
  };
  buttonDiv.appendChild(stickerButton);
});


const ctx = canvas.getContext("2d");
if (ctx) {
  ctx.lineWidth = 2;
  ctx.strokeStyle = "black";
}

let isDrawing = false;
let currentThickness = 2;
let drawingData: DrawingCommand[] = [];
let currentCommand: MarkerLine | StickerCommand | null = null;
let redoStack: DrawingCommand[] = [];
let toolPreview: ToolPreview | null = null;
let selectedSticker: string | null = null;

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

  if (selectedSticker) {
    currentCommand = createStickerCommand(selectedSticker, event.offsetX, event.offsetY, 30);
  } else {
    currentCommand = createMarkerLine(event.offsetX, event.offsetY, currentThickness);
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

  if (selectedSticker) {
    toolPreview = createToolPreview(x, y, undefined, selectedSticker);
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
