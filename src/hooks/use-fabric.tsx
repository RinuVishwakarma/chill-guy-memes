import React from "react"
import { Canvas, FabricImage, PencilBrush } from "fabric"
import * as fabric from "fabric"
import { useWindow } from "@/hooks/use-window"
import { filterNames, getFilter } from "@/lib/constants"

const CANVAS_DIMENSIONS = { default: 500, mobileMultiplier: 0.9 }
const DEFAULT_BACKGROUND_COLOR = "#8d927b"
const DEFAULT_FONT_COLOR = "#000000"
const DEFAULT_FONT_FAMILY = "Impact"
const DEFAULT_TEXT_OPTIONS = {
  text: "Your Text Here",
  fontSize: 40,
  fontFamily: DEFAULT_FONT_FAMILY,
  fill: DEFAULT_FONT_COLOR,
  // stroke: "black",
  // strokeWidth: 1.5,
  textAlign: "center",
}

export interface selectedTextPropertiesProps {
  fontFamily: string
  fontColor: string
  isTextSelected: boolean
}

export interface DrawingPropertiesProps {
  isDrawing: boolean
  brushSize: number
  brushColor: string
  isEraser: boolean
}

export function useFabric() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const [canvas, setCanvas] = React.useState<Canvas | null>(null)
  const [currentBackgroundColor, setCurrentBackgroundColor] =
    React.useState<string>(DEFAULT_BACKGROUND_COLOR)
  const [hasBackgroundImage, setHasBackgroundImage] = React.useState<boolean>(false)
  const [selectedTextProperties, setSelectedTextProperties] =
    React.useState<selectedTextPropertiesProps>({
      fontFamily: DEFAULT_FONT_FAMILY,
      fontColor: DEFAULT_FONT_COLOR,
      isTextSelected: false,
    })
  const [isImageSelected, setIsImageSelected] = React.useState<boolean>(false)
  const [currentFilterIndex, setCurrentFilterIndex] = React.useState<number>(0)
  const { isMobile, windowSize } = useWindow()
  const [drawingSettings, setDrawingSettings] =
    React.useState<DrawingPropertiesProps>({
      isDrawing: false,
      brushSize: 4,
      brushColor: "#000000",
      isEraser: false,
    })

  React.useEffect(() => {
    if (!canvasRef.current) return

    const fabricCanvas = new Canvas(canvasRef.current, {
      width: CANVAS_DIMENSIONS.default,
      height: CANVAS_DIMENSIONS.default,
    })

    setCanvas(fabricCanvas)
    fabricCanvas.backgroundColor = currentBackgroundColor

    // Add a listener for when an object is added to the canvas
    fabricCanvas.on("object:added", (e) => {
      const object = e.target
      if (object) {
        object.set({
          cornerColor: "#FFF",
          cornerStyle: "circle",
          borderColor: "#8a4fec",
          borderScaleFactor: 1.5,
          transparentCorners: false,
          borderOpacityWhenMoving: 1,
          cornerStrokeColor: "#8a4fec",
        })

        // TODO: MAKE IT MORE LIKE CANVA SELECTOR

        // Define custom controls
        // object.controls = {
        //   ...object.controls,
        //   mtr: new fabric.Control({
        //     x: 0,
        //     y: -0.58,
        //     offsetY: -30,
        //     cursorStyle: "grab",
        //     actionName: "rotate",
        //     actionHandler: fabric.controlsUtils.rotationWithSnapping,
        //   }),
        // }

        fabricCanvas.renderAll()
      }
    })

    // Add listeners for object selection and deselection
    const updateSelectedProperties = () => {
      const activeObject = fabricCanvas.getActiveObject()

      if (activeObject && activeObject.type === "textbox") {
        setSelectedTextProperties({
          fontFamily: activeObject.get("fontFamily") as string,
          fontColor: activeObject.get("fill") as string,
          isTextSelected: true,
        })
      } else {
        setSelectedTextProperties({
          fontFamily: DEFAULT_FONT_FAMILY,
          fontColor: DEFAULT_FONT_COLOR,
          isTextSelected: false,
        })
      }

      // Update image selection state
      if (activeObject && activeObject.type === "image") {
        setIsImageSelected(true)
      } else {
        setIsImageSelected(false)
      }
    }

    // Load the brush for drawing
    fabricCanvas.freeDrawingBrush = new PencilBrush(fabricCanvas)
    fabricCanvas.freeDrawingBrush.color = drawingSettings.brushColor
    fabricCanvas.freeDrawingBrush.width = drawingSettings.brushSize

    // Listen to multiple events that might change selection
    fabricCanvas.on("selection:created", updateSelectedProperties)
    fabricCanvas.on("selection:updated", updateSelectedProperties)
    fabricCanvas.on("selection:cleared", updateSelectedProperties)

    // Add a listener for object modifications
    fabricCanvas.on("object:modified", updateSelectedProperties)

    adjustCanvasSize(fabricCanvas, isMobile) // Initial size adjustment

    return () => {
      // Remove event listeners
      fabricCanvas.off("selection:created", updateSelectedProperties)
      fabricCanvas.off("selection:updated", updateSelectedProperties)
      fabricCanvas.off("selection:cleared", updateSelectedProperties)
      fabricCanvas.off("object:modified", updateSelectedProperties)
      fabricCanvas.dispose()
    }
  }, [])

  React.useEffect(() => {
    if (canvas) {
      adjustCanvasSize(canvas, isMobile) // Adjust size on window resize
      canvas.renderAll()
    }
  }, [isMobile, windowSize.width, windowSize.height])

  const deleteSelectedObject = React.useCallback(() => {
    if (!canvas) return

    const activeObject = canvas.getActiveObject()
    if (activeObject) {
      canvas.remove(activeObject)
      canvas.discardActiveObject()
      canvas.renderAll()
    }
  }, [canvas])

  React.useEffect(() => {
    if (!canvas) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const activeObject = canvas.getActiveObject()
      
      if (activeObject && activeObject.type === "textbox") {
        // Allow normal text editing for text objects
        return
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault() // Prevent default browser behavior
        deleteSelectedObject()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [canvas, deleteSelectedObject])

  React.useEffect(() => {
    if (!canvas) return
    canvas.isDrawingMode = drawingSettings.isDrawing
    if (canvas.freeDrawingBrush) {
      if (drawingSettings.isEraser) {
        // Configure brush for erasing
        canvas.freeDrawingBrush.color = canvas.backgroundColor as string
        canvas.freeDrawingBrush.width = drawingSettings.brushSize * 2
        // Add a shadow to make erasing more visible
        canvas.freeDrawingBrush.shadow = new fabric.Shadow({
          color: canvas.backgroundColor as string,
          blur: 10,
          offsetX: 0,
          offsetY: 0
        })
      } else {
        // Configure brush for normal drawing
        canvas.freeDrawingBrush.color = drawingSettings.brushColor
        canvas.freeDrawingBrush.width = drawingSettings.brushSize
        canvas.freeDrawingBrush.shadow = null
      }
    }
    canvas.renderAll()
  }, [drawingSettings, canvas])

  function adjustCanvasSize(fabricCanvas: Canvas, isMobile: boolean) {
    const size = isMobile
      ? Math.min(
          windowSize.width! * CANVAS_DIMENSIONS.mobileMultiplier,
          CANVAS_DIMENSIONS.default,
        )
      : CANVAS_DIMENSIONS.default

    fabricCanvas.setDimensions({ width: size, height: size })
  }

  async function setBackgroundImage(imageUrl: string): Promise<Canvas | null> {
    if (!canvas) return null

    const img = await FabricImage.fromURL(imageUrl)

    if (!img) {
      alert("Failed to load image")
      return null
    }

    // Keep canvas dimensions fixed
    const canvasWidth = canvas.width!
    const canvasHeight = canvas.height!

    // Calculate scale to cover the entire canvas
    const scaleX = canvasWidth / img.width!
    const scaleY = canvasHeight / img.height!
    const scale = Math.max(scaleX, scaleY)

    img.scale(scale)
    img.set({
      originX: "center",
      originY: "center",
      left: canvasWidth / 2,
      top: canvasHeight / 2,
      objectCaching: false,
    })

    canvas.backgroundImage = img
    setHasBackgroundImage(true)
    canvas.renderAll()

    return canvas
  }

  function removeBackground() {
    if (!canvas) return
    canvas.backgroundImage = undefined
    setHasBackgroundImage(false)
    canvas.renderAll()
  }

  function addText() {
    if (!canvas) return

    const text = new fabric.Textbox(DEFAULT_TEXT_OPTIONS.text, {
      ...DEFAULT_TEXT_OPTIONS,
      left: canvas.getWidth() / 2,
      top: canvas.getHeight() / 2,
      width: canvas.getWidth() * 0.8,
      originX: "center",
      originY: "center",
    })

    canvas.add(text)
    canvas.setActiveObject(text)
    canvas.renderAll()
  }

  function changeFontFamily(fontFamily: string) {
    if (!canvas) return

    const activeObject = canvas.getActiveObject()
    if (activeObject && activeObject.type === "textbox") {
      const text = activeObject as fabric.Textbox
      text.set("fontFamily", fontFamily)

      // Immediately update the selected text properties
      setSelectedTextProperties((prev) => ({
        ...prev,
        fontFamily: fontFamily,
      }))

      canvas.renderAll()
    }
  }

  function changeTextColor(color: string) {
    if (!canvas) return

    const activeObject = canvas.getActiveObject()
    if (activeObject && activeObject.type === "textbox") {
      const text = activeObject as fabric.Textbox
      text.set("fill", color)

      // Immediately update the selected text properties
      setSelectedTextProperties((prev) => ({
        ...prev,
        fontColor: color,
      }))

      canvas.renderAll()
    }
  }

  async function addChillGuy() {
    if (!canvas) return

    try {
      const imageUrl = '/chillguy.png'
      
      const img = await FabricImage.fromURL(imageUrl).catch(error => {
        console.error("Error loading image:", error)
        return null
      })

      if (!img) {
        console.error("Failed to load image")
        return
      }

      const { width, height } = canvas
      const scale = Math.min(
        (width! * 0.5) / img.width!,
        (height! * 0.5) / img.height!,
      )

      img.set({
        scaleX: scale,
        scaleY: scale,
        left: width! / 2,
        top: height! / 2,
        originX: "center",
        originY: "center",
        selectable: true,
      })

      canvas.add(img)
      canvas.setActiveObject(img)
      canvas.renderAll()
    } catch (error) {
      console.error("Error in addChillGuy:", error)
    }
  }

  function flipImage(direction: "horizontal" | "vertical") {
    if (!canvas) return

    const activeObject = canvas.getActiveObject()

    if (activeObject && activeObject.type === "image") {
      const image = activeObject as fabric.Image
      direction === "horizontal"
        ? image.set("flipX", !image.flipX)
        : image.set("flipY", !image.flipY)

      canvas.renderAll()
    }
  }

  function toggleFilter() {
    // Move to the next filter in the list
    const nextIndex = (currentFilterIndex + 1) % filterNames.length
    setCurrentFilterIndex(nextIndex)

    // Determine the next filter
    const nextFilter = filterNames[nextIndex]

    if (!canvas) return

    const activeObject = canvas.getActiveObject()
    if (activeObject && activeObject.type === "image") {
      const image = activeObject as FabricImage
      const filter = getFilter(nextFilter)

      image.filters = filter ? [filter] : []
      image.applyFilters()
      ;(image as any).filterName = nextFilter
      canvas.renderAll()
    }
  }

  function toggleDrawingMode() {
    setDrawingSettings((prev) => ({
      ...prev,
      isDrawing: !prev.isDrawing,
      isEraser: false,
    }))
  }

  function incrementBrushSize() {
    setDrawingSettings((prev) => {
      let newSize = prev.brushSize + 2
      if (newSize > 20) {
        newSize = 2
      }
      return { ...prev, brushSize: newSize }
    })
  }

  function setBrushColor(color: string) {
    setDrawingSettings((prev) => ({
      ...prev,
      brushColor: color,
    }))
  }

  function downloadCanvas() {
    if (!canvas) return

    const dataURL = canvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 3,
    })

    const link = document.createElement("a")
    link.href = dataURL
    link.download = "meme.png"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function changeBackgroundColor(color: string) {
    if (canvas) {
      setCurrentBackgroundColor(color)
      canvas.backgroundColor = color
      canvas.renderAll()
    }
  }

  function toggleEraser() {
    setDrawingSettings((prev) => ({
      ...prev,
      isEraser: !prev.isEraser,
      brushSize: !prev.isEraser ? prev.brushSize * 2 : prev.brushSize / 2,
    }))
  }

  return {
    canvasRef,
    setBackgroundImage,
    removeBackground,
    hasBackgroundImage,
    addText,
    addChillGuy,
    changeFontFamily,
    changeTextColor,
    flipImage,
    changeBackgroundColor,
    currentBackgroundColor,
    deleteSelectedObject,
    downloadCanvas,
    selectedTextProperties,
    toggleFilter,
    isImageSelected,
    toggleDrawingMode,
    incrementBrushSize,
    setBrushColor,
    drawingSettings,
    toggleEraser,
  }
}
