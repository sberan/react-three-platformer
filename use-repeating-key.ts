import { useEffect } from "react"

// 
export default function useRepeatingKey(repeatRate: number, callback: (event: KeyboardEvent) => void) {
  useEffect(() => {
    const keyDownListener = (keyDown: KeyboardEvent) => {
      if (keyDown.repeat) {
        return
      }
      callback(keyDown)
      const repeat = setInterval(() => callback(keyDown), repeatRate)
      const keyUpListener = (keyUp: KeyboardEvent) => {
        if (keyUp.code === keyDown.code) {
          clearInterval(repeat)
          document.removeEventListener('keyup', keyUpListener)
        }
      }
      document.addEventListener('keyup', keyUpListener)
    }
    document.addEventListener('keydown', keyDownListener)
    return () => document.removeEventListener('keydown', keyDownListener)
  }, [])
}