import { useRef, useEffect, useState } from 'react'

export default function SignaturePad({ onConfirm, onCancel, title }) {
  const canvasRef = useRef(null)
  const [drawing, setDrawing] = useState(false)
  const [hasStroke, setHasStroke] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
  }, [])

  const getPos = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    }
  }

  const start = (e) => {
    e.preventDefault()
    const { x, y } = getPos(e)
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) {
      ctx.beginPath()
      ctx.moveTo(x, y)
      setDrawing(true)
      setHasStroke(true)
    }
  }

  const move = (e) => {
    e.preventDefault()
    if (!drawing) return
    const { x, y } = getPos(e)
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) {
      ctx.lineTo(x, y)
      ctx.stroke()
    }
  }

  const end = () => setDrawing(false)

  const clear = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasStroke(false)
  }

  const confirm = () => {
    if (!hasStroke) return
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (blob) onConfirm(blob)
    }, 'image/png')
  }

  return (
    <div className="border rounded-lg p-4 bg-white">
      {title && <p className="font-medium text-gray-700 mb-2">{title}</p>}
      <canvas
        ref={canvasRef}
        width={400}
        height={200}
        className="border border-gray-300 rounded w-full touch-none"
        style={{ maxWidth: '100%', height: 'auto', maxHeight: 200 }}
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <div className="flex gap-2 mt-3">
        <button type="button" onClick={clear} className="btn-secondary text-sm">
          Cancella
        </button>
        <button type="button" onClick={confirm} disabled={!hasStroke} className="btn-primary text-sm">
          Conferma firma
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary text-sm">
            Annulla
          </button>
        )}
      </div>
    </div>
  )
}
