import { useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Float, useGLTF } from '@react-three/drei'
import { useEffect, useMemo, useRef } from 'react'
import { Box3, Group, MathUtils, Vector3 } from 'three'

const MODEL_URL = '/model.glb'
const HDRI_URL = '/studio.hdr'
const MAX_SIZE = 2.8
const REST_TILT = -0.25
const DRAG_SPEED = 0.006
const MAX_PITCH = 0.9

useGLTF.preload(MODEL_URL)

function Model({ reducedMotion, size }: { reducedMotion: boolean; size: number }) {
  const { scene } = useGLTF(MODEL_URL)
  const group = useRef<Group>(null)
  const regress = useThree((state) => state.performance.regress)
  const invalidate = useThree((state) => state.invalidate)
  const drag = useRef({ active: false, lastX: 0, lastY: 0, yaw: 0, pitch: 0, spin: 0 })

  const { scale, offset } = useMemo(() => {
    const box = new Box3().setFromObject(scene)
    const dims = box.getSize(new Vector3())
    const center = box.getCenter(new Vector3())
    const scale = size / Math.max(dims.x, dims.y, dims.z)
    return { scale, offset: center.multiplyScalar(-scale) }
  }, [scene, size])

  useEffect(() => {
    const d = drag.current
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      d.active = true
      d.lastX = e.clientX
      d.lastY = e.clientY
      document.body.style.cursor = 'grabbing'
    }
    const onMove = (e: PointerEvent) => {
      regress()
      if (!d.active) return
      d.yaw += (e.clientX - d.lastX) * DRAG_SPEED
      d.pitch = MathUtils.clamp(d.pitch + (e.clientY - d.lastY) * DRAG_SPEED, -MAX_PITCH, MAX_PITCH)
      d.lastX = e.clientX
      d.lastY = e.clientY
      invalidate()
    }
    const onUp = () => {
      d.active = false
      document.body.style.cursor = ''
    }
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      document.body.style.cursor = ''
    }
  }, [regress, invalidate])

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    const d = drag.current
    const idle = !reducedMotion && !d.active
    if (idle) d.spin += delta * 0.1
    const pointerX = idle ? state.pointer.x : 0
    const pointerY = idle ? state.pointer.y : 0
    const targetY = 0.6 + d.spin + d.yaw + pointerX * 0.6
    const targetX = REST_TILT + d.pitch - pointerY * 0.3
    const lambda = d.active ? 14 : 3
    g.rotation.y = MathUtils.damp(g.rotation.y, targetY, lambda, delta)
    g.rotation.x = MathUtils.damp(g.rotation.x, targetX, lambda, delta)
    // Under reduced motion the loop is on-demand, so keep asking for frames until the damping settles.
    if (reducedMotion && (Math.abs(g.rotation.y - targetY) > 1e-3 || Math.abs(g.rotation.x - targetX) > 1e-3)) {
      invalidate()
    }
  })

  return (
    <group ref={group}>
      <primitive object={scene} scale={scale} position={offset} />
    </group>
  )
}

export function Scene({ reducedMotion, onReady }: { reducedMotion: boolean; onReady: () => void }) {
  const viewport = useThree((state) => state.viewport)
  const portrait = viewport.width < viewport.height
  const size = Math.min(MAX_SIZE, viewport.width * 0.92)
  // Headline sits bottom-left, so the model lives centre-right (landscape) or upper-centre (portrait).
  const position: [number, number, number] = portrait
    ? [0, viewport.height * 0.08, 0]
    : [viewport.width * 0.08, 0.15, 0]

  useEffect(() => onReady(), [onReady])

  return (
    <>
      <Environment files={HDRI_URL} environmentIntensity={1} />
      <group position={position}>
        <Float
          speed={reducedMotion ? 0 : 1.4}
          rotationIntensity={reducedMotion ? 0 : 0.25}
          floatIntensity={reducedMotion ? 0 : 0.6}
        >
          <Model reducedMotion={reducedMotion} size={size} />
        </Float>
      </group>
      {/* Kept at world x/z = 0: ContactShadows' blur pass assumes the shadow plane is centred on the origin. */}
      <ContactShadows
        position={[0, position[1] - size * 0.35, 0]}
        opacity={0.45}
        scale={size * 3}
        blur={2.4}
        far={size}
        resolution={512}
        frames={reducedMotion ? 1 : Infinity}
      />
    </>
  )
}
