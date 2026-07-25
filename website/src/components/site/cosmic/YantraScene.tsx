import { useMemo, useRef } from 'react'
import { Canvas, useFrame, type ThreeElements } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'

/* ────────────────────────────────────────────────────────────
   A 3D Shree Yantra in gold wireframe: nine interlocking
   triangles, concentric rings and the bhupura gates, drifting
   inside a quiet star field. Deliberately tiny — no textures,
   no post-processing, ~2k vertices total.
   ──────────────────────────────────────────────────────────── */

type Tri = { apex: number; base: number; half: number }

/** 4 upward (Shiva) triangles. */
const UP: Tri[] = [
  { apex: 1.3, base: -0.3, half: 1.14 },
  { apex: 1.02, base: -0.62, half: 0.88 },
  { apex: 0.74, base: -0.9, half: 0.64 },
  { apex: 0.46, base: -1.14, half: 0.42 },
]

/** 5 downward (Shakti) triangles. */
const DOWN: Tri[] = [
  { apex: -1.36, base: 0.34, half: 1.18 },
  { apex: -1.08, base: 0.66, half: 0.92 },
  { apex: -0.8, base: 0.94, half: 0.68 },
  { apex: -0.52, base: 1.18, half: 0.46 },
  { apex: -0.26, base: 1.36, half: 0.26 },
]

type Pt = [number, number, number]

function triPoints(t: Tri, z: number): Pt[] {
  return [
    [0, t.apex, z],
    [-t.half, t.base, z],
    [t.half, t.base, z],
    [0, t.apex, z],
  ]
}

function circlePoints(r: number, z: number, seg = 96): Pt[] {
  const out: Pt[] = []
  for (let i = 0; i <= seg; i += 1) {
    const a = (i / seg) * Math.PI * 2
    out.push([Math.cos(a) * r, Math.sin(a) * r, z])
  }
  return out
}

/** Bhupura: three nested squares with a gate notch on each side. */
function squarePoints(r: number, z: number): Pt[] {
  return [
    [-r, -r, z],
    [r, -r, z],
    [r, r, z],
    [-r, r, z],
    [-r, -r, z],
  ]
}

function gatePoints(r: number, z: number, g = 0.22): Pt[][] {
  const d = r + g
  return [
    [
      [-g, r, z],
      [0, d, z],
      [g, r, z],
    ],
    [
      [-g, -r, z],
      [0, -d, z],
      [g, -r, z],
    ],
    [
      [r, -g, z],
      [d, 0, z],
      [r, g, z],
    ],
    [
      [-r, -g, z],
      [-d, 0, z],
      [-r, g, z],
    ],
  ]
}

function Yantra({ gold, soft }: { gold: string; soft: string }) {
  const group = useRef<THREE.Group>(null)
  const inner = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    const g = group.current
    const i = inner.current
    if (!g || !i) return
    const t = state.clock.elapsedTime

    // Slow, meditative spin of the triangle lattice only.
    i.rotation.z -= delta * 0.04

    // Gentle mouse parallax + idle breathing.
    const px = state.pointer.x
    const py = state.pointer.y
    g.rotation.y += (px * 0.16 - g.rotation.y) * Math.min(1, delta * 2)
    g.rotation.x += (-py * 0.12 + Math.sin(t * 0.35) * 0.02 - g.rotation.x) * Math.min(1, delta * 2)
    g.position.y = Math.sin(t * 0.5) * 0.05
  })

  const rings = useMemo(() => [1.52, 1.63], [])

  return (
    <group ref={group} scale={0.86}>
      {/* Bhupura stays upright — it frames the spinning lattice. */}
      <Line points={circlePoints(1.92, -0.18)} color={gold} lineWidth={0.8} transparent opacity={0.3} />
      <Line points={squarePoints(2.16, -0.24)} color={gold} lineWidth={1.1} transparent opacity={0.42} />
      <Line points={squarePoints(2.04, -0.24)} color={soft} lineWidth={0.7} transparent opacity={0.24} />
      {gatePoints(2.16, -0.24).map((pts, i) => (
        <Line key={`g${i}`} points={pts} color={gold} lineWidth={1.1} transparent opacity={0.42} />
      ))}

      <group ref={inner}>
        {UP.map((t, i) => (
          <Line
            key={`u${i}`}
            points={triPoints(t, i * 0.045)}
            color={i % 2 ? gold : soft}
            lineWidth={1.15}
            transparent
            opacity={0.9 - i * 0.06}
          />
        ))}
        {DOWN.map((t, i) => (
          <Line
            key={`d${i}`}
            points={triPoints(t, -0.02 - i * 0.045)}
            color={i % 2 ? soft : gold}
            lineWidth={1.15}
            transparent
            opacity={0.88 - i * 0.06}
          />
        ))}

        {rings.map((r, i) => (
          <Line
            key={`r${i}`}
            points={circlePoints(r, -0.12 - i * 0.03)}
            color={gold}
            lineWidth={1}
            transparent
            opacity={0.5}
          />
        ))}

        {/* Bindu */}
        <mesh position={[0, 0, 0.24]}>
          <sphereGeometry args={[0.026, 16, 16]} />
          <meshBasicMaterial color={soft} />
        </mesh>
      </group>
    </group>
  )
}

/** A soft round dot, so stars are not the default square sprites. */
function makeStarTexture(): THREE.Texture {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.35, 'rgba(255,255,255,0.72)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  return tex
}

function StarField({ dark }: { dark: boolean }) {
  const ref = useRef<THREE.Points>(null)
  const sprite = useMemo(makeStarTexture, [])

  const geometry = useMemo(() => {
    const COUNT = 1100
    const positions = new Float32Array(COUNT * 3)
    const sizes = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i += 1) {
      // A flat-ish slab well behind the yantra, so no star ever
      // drifts close to the camera and blows up into a big square.
      const r = 4 + Math.pow(Math.random(), 0.55) * 22
      const theta = Math.random() * Math.PI * 2
      positions[i * 3] = Math.cos(theta) * r
      positions[i * 3 + 1] = Math.sin(theta) * r * 0.72
      positions[i * 3 + 2] = -6 - Math.random() * 20
      sizes[i] = Math.random()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    return g
  }, [])

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += delta * 0.009
  })

  const materialProps: ThreeElements['pointsMaterial'] = {
    size: dark ? 0.3 : 0.22,
    sizeAttenuation: true,
    map: sprite,
    alphaMap: sprite,
    color: dark ? '#f4e3b6' : '#8a5a10',
    transparent: true,
    opacity: dark ? 0.85 : 0.45,
    depthWrite: false,
    blending: dark ? THREE.AdditiveBlending : THREE.NormalBlending,
  }

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial {...materialProps} />
    </points>
  )
}

export default function YantraScene({ dark = true, paused = false }: { dark?: boolean; paused?: boolean }) {
  const gold = dark ? '#e9b850' : '#a9740f'
  const soft = dark ? '#fce8a8' : '#c99a3c'

  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={paused ? 'never' : 'always'}
      camera={{ position: [0, 0, 5.6], fov: 44 }}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      style={{ pointerEvents: 'none' }}
      aria-hidden
    >
      <StarField dark={dark} />
      <Yantra gold={gold} soft={soft} />
    </Canvas>
  )
}
