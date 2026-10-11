import { useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Float, useGLTF } from '@react-three/drei'
import { useEffect, useMemo, useRef } from 'react'
import { Box3, Group, MathUtils, Vector3 } from 'three'

const MODEL_URL = '/model.glb'
const HDRI_URL = '/studio.hdr'
const MAX_SIZE = 2.8
const REST_TILT = -0.25

useGLTF.preload(MODEL_URL)

function Model({ reducedMotion, size }: { reducedMotion: boolean; size: number }) {
  const { scene } = useGLTF(MODEL_URL)
  const group = useRef<Group>(null)
  const regress = useThree((state) => state.performance.regress)

  const { scale, offset } = useMemo(() => {
    const box = new Box3().setFromObject(scene)
    const dims = box.getSize(new Vector3())
    const center = box.getCenter(new Vector3())
    const scale = size / Math.max(dims.x, dims.y, dims.z)
    return { scale, offset: center.multiplyScalar(-scale) }
  }, [scene, size])

  useEffect(() => {
    if (reducedMotion) return
    const onMove = () => regress()
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [reducedMotion, regress])

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    if (reducedMotion) {
      g.rotation.set(REST_TILT, 0.6, 0)
      return
    }
    const { x, y } = state.pointer
    const targetY = 0.6 + x * 0.6 + state.clock.elapsedTime * 0.1
    const targetX = REST_TILT - y * 0.3
    g.rotation.y = MathUtils.damp(g.rotation.y, targetY, 3, delta)
    g.rotation.x = MathUtils.damp(g.rotation.x, targetX, 3, delta)
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
