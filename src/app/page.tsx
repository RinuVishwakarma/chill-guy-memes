"use client"

import { Toolbar } from "../components/toolbar"
import { useFabric } from "../hooks/use-fabric"
import "./fonts.css"
import { useEffect, useState } from "react"

export default function HomePage() {
  const [isClient, setIsClient] = useState(false)
  const {
    canvasRef,
    setBackgroundImage,
    removeBackground,
    hasBackgroundImage,
    addText,
    addChillGuy,
    changeFontFamily,
    changeTextColor,
    flipImage,
    deleteSelectedObject,
    downloadCanvas,
    changeBackgroundColor,
    currentBackgroundColor,
    selectedTextProperties,
    toggleFilter,
    isImageSelected,
    toggleDrawingMode,
    incrementBrushSize,
    setBrushColor,
    drawingSettings,
    toggleEraser,
  } = useFabric()

  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <>
      <div className="px-2 space-y-10 min-h-screen items-center h-full flex-col flex justify-between">
        <div></div>
        <canvas
          ref={canvasRef}
          className="border rounded-3xl overflow-hidden"
        />
        <div className="pt-10 pb-8 space-y-5 flex items-center flex-col">
          {isClient && (
            <Toolbar
              setBackgroundImage={setBackgroundImage}
              removeBackground={removeBackground}
              hasBackgroundImage={hasBackgroundImage}
              addText={addText}
              addChillGuy={addChillGuy}
              changeFontFamily={changeFontFamily}
              changeTextColor={changeTextColor}
              flipImage={flipImage}
              deleteSelectedObject={deleteSelectedObject}
              downloadCanvas={downloadCanvas}
              changeBackgroundColor={changeBackgroundColor}
              currentBackgroundColor={currentBackgroundColor}
              selectedTextProperties={selectedTextProperties}
              toggleFilter={toggleFilter}
              isImageSelected={isImageSelected}
              toggleDrawingMode={toggleDrawingMode}
              drawingSettings={drawingSettings}
              incrementBrushSize={incrementBrushSize}
              setBrushColor={setBrushColor}
              toggleEraser={toggleEraser}
            />
          )}
          <div className="flex flex-col justify-center text-center items-center text-sm md:flex-row">
            <a
              className="text-balance leading-loose text-muted-foreground font-medium hover:text-blue-700"
              href="https://www.linkedin.com/in/rinu-vishwakarma-57120a19b"
              target="_blank"
              rel="noopener noreferrer"
            >
              Built by Vishwakarma
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
