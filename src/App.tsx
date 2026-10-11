import { Canvas } from '@react-three/fiber'
import { AdaptiveDpr, useProgress } from '@react-three/drei'
import { Suspense, useCallback, useState, useSyncExternalStore } from 'react'
import { Scene } from './Scene'

const motionQuery = '(prefers-reduced-motion: reduce)'

function subscribeToMotion(onChange: () => void) {
  const mq = window.matchMedia(motionQuery)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

function useReducedMotion() {
  return useSyncExternalStore(
    subscribeToMotion,
    () => window.matchMedia(motionQuery).matches,
    () => false,
  )
}

function Loader({ done }: { done: boolean }) {
  const { progress } = useProgress()
  return (
    <div className={done ? 'loader done' : 'loader'} aria-hidden={done}>
      <div>
        <div className="loader-bar">
          <div className="loader-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="loader-label">Loading {Math.round(progress)}%</div>
      </div>
    </div>
  )
}

export default function App() {
  const reducedMotion = useReducedMotion()
  const [ready, setReady] = useState(false)
  const onReady = useCallback(() => setReady(true), [])

  return (
    <main className="stage">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0.4, 4.2], fov: 32 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        frameloop={reducedMotion ? 'demand' : 'always'}
      >
        <Suspense fallback={null}>
          <Scene reducedMotion={reducedMotion} onReady={onReady} />
        </Suspense>
        <AdaptiveDpr pixelated />
      </Canvas>

      <div className="copy">
        <p className="meta meta-tl">
          <span>No. 01</span>
          <span>Camera, leather strap</span>
        </p>
        <p className="meta meta-tr">{reducedMotion ? 'Motion reduced' : 'Move your cursor'}</p>
        <h1 className="headline">
          Show,
          <br />
          <em>don’t tell.</em>
        </h1>
        <p className="subline">A real-time product viewer with studio lighting. Runs anywhere.</p>
      </div>

      <Loader done={ready} />
    </main>
  )
}
