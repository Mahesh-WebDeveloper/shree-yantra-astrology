import { useMemo, useRef } from 'react'
import { Canvas, useFrame, type ThreeElements } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'

/* ────────────────────────────────────────────────────────────
   A luminous Shree Yantra — the light source of the hero.

   Built from four depth layers so it reads as an object rather
   than a flat wireframe:
     1. radial light rays (slow counter-rotation, far back)
     2. the bhupura + outer lotus (near-static frame)
     3. the nine interlocking triangles (slow spin)
     4. a glowing bindu core with a soft bloom halo
   Bloom is faked with pre-rendered radial sprites and a doubled
   line pass (wide + faint behind thin + bright) — no post-
   processing pass, so it stays cheap: ~40 draw calls, no
   textures beyond three tiny generated canvases.
   ──────────────────────────────────────────────────────────── */

type Pt = [number, number, number]

const TAU = Math.PI * 2

/* ── geometry helpers ─────────────────────────────────────── */

function circlePoints(r: number, z: number, seg = 128): Pt[] {
  const out: Pt[] = []
  for (let i = 0; i <= seg; i += 1) {
    const a = (i / seg) * TAU
    out.push([Math.cos(a) * r, Math.sin(a) * r, z])
  }
  return out
}

/** A scalloped closed loop — the lotus petal rings, in one polyline. */
function lotusPoints(r0: number, amp: number, lobes: number, z: number, phase = 0): Pt[] {
  const seg = lobes * 26
  const out: Pt[] = []
  for (let i = 0; i <= seg; i += 1) {
    const a = (i / seg) * TAU + phase
    const r = r0 + amp * Math.pow(Math.abs(Math.sin((lobes * (a - phase)) / 2)), 0.62)
    out.push([Math.cos(a) * r, Math.sin(a) * r, z])
  }
  return out
}

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

function triPoints(t: Tri, z: number): Pt[] {
  return [
    [0, t.apex, z],
    [-t.half, t.base, z],
    [t.half, t.base, z],
    [0, t.apex, z],
  ]
}

function squarePoints(r: number, z: number): Pt[] {
  return [
    [-r, -r, z],
    [r, -r, z],
    [r, r, z],
    [-r, r, z],
    [-r, -r, z],
  ]
}

/** The four bhupura gates. */
function gatePoints(r: number, z: number, g = 0.26): Pt[][] {
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

/* ── generated textures (built once, shared) ──────────────── */

let glowTexture: THREE.Texture | null = null
let rayTexture: THREE.Texture | null = null
let starTexture: THREE.Texture | null = null

function canvas2d(size: number) {
  const el = document.createElement('canvas')
  el.width = size
  el.height = size
  return { el, ctx: el.getContext('2d') }
}

/** Soft radial falloff — used for the core glow, halo and stars. */
function getGlowTexture(): THREE.Texture {
  if (glowTexture) return glowTexture
  const { el, ctx } = canvas2d(256)
  if (ctx) {
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.12, 'rgba(255,255,255,0.82)')
    g.addColorStop(0.34, 'rgba(255,255,255,0.3)')
    g.addColorStop(0.62, 'rgba(255,255,255,0.07)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 256, 256)
  }
  glowTexture = new THREE.CanvasTexture(el)
  return glowTexture
}

/** Faint radial light rays fanning out of the bindu. */
function getRayTexture(): THREE.Texture {
  if (rayTexture) return rayTexture
  const size = 512
  const { el, ctx } = canvas2d(size)
  if (ctx) {
    const c = size / 2
    ctx.translate(c, c)
    const rays = 30
    for (let i = 0; i < rays; i += 1) {
      const a = (i / rays) * TAU
      // alternate long / short rays, with a little irregularity
      const len = c * (i % 2 === 0 ? 0.98 : 0.66) * (0.82 + 0.18 * Math.sin(i * 2.7))
      const w = i % 2 === 0 ? 0.016 : 0.009
      const grad = ctx.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len)
      grad.addColorStop(0, 'rgba(255,255,255,0.85)')
      grad.addColorStop(0.35, 'rgba(255,255,255,0.24)')
      grad.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(Math.cos(a - w) * len, Math.sin(a - w) * len)
      ctx.lineTo(Math.cos(a + w) * len, Math.sin(a + w) * len)
      ctx.closePath()
      ctx.fill()
    }
    // fade the whole fan out towards the rim
    ctx.globalCompositeOperation = 'destination-in'
    const fade = ctx.createRadialGradient(0, 0, 0, 0, 0, c)
    fade.addColorStop(0, 'rgba(255,255,255,0.15)')
    fade.addColorStop(0.22, 'rgba(255,255,255,1)')
    fade.addColorStop(0.72, 'rgba(255,255,255,0.5)')
    fade.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = fade
    ctx.fillRect(-c, -c, size, size)
  }
  rayTexture = new THREE.CanvasTexture(el)
  return rayTexture
}

function getStarTexture(): THREE.Texture {
  if (starTexture) return starTexture
  const { el, ctx } = canvas2d(64)
  if (ctx) {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.35, 'rgba(255,255,255,0.7)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 64, 64)
  }
  starTexture = new THREE.CanvasTexture(el)
  return starTexture
}

/* ── palette ──────────────────────────────────────────────── */

type Palette = {
  gold: string
  soft: string
  deep: string
  /** glow sprites need their own warm tints — line gold goes muddy on cream. */
  halo: string
  core: string
  /** additive reads as light on black; on cream it must blend normally. */
  blending: THREE.Blending
  lineOpacity: number
  glow: number
  ray: number
  star: number
}

function palette(dark: boolean): Palette {
  return dark
    ? {
        gold: '#f0c469',
        soft: '#fdeec2',
        deep: '#b8801f',
        halo: '#f4cd7c',
        core: '#ffe6ac',
        blending: THREE.AdditiveBlending,
        lineOpacity: 1,
        glow: 0.62,
        ray: 0.3,
        star: 0.8,
      }
    : {
        gold: '#a9740f',
        soft: '#8a5a10',
        deep: '#c99a3c',
        halo: '#e9c176',
        core: '#f3dda6',
        blending: THREE.NormalBlending,
        lineOpacity: 0.92,
        glow: 0.26,
        ray: 0.15,
        star: 0.4,
      }
}

/* ── pieces ───────────────────────────────────────────────── */

function Glow({
  size,
  color,
  opacity,
  z,
  blending,
  breathe = 0,
}: {
  size: number
  color: string
  opacity: number
  z: number
  blending: THREE.Blending
  breathe?: number
}) {
  const ref = useRef<THREE.Sprite>(null)

  useFrame((state) => {
    if (!breathe || !ref.current) return
    const k = 1 + Math.sin(state.clock.elapsedTime * 0.7) * breathe
    ref.current.scale.set(size * k, size * k, 1)
  })

  return (
    <sprite ref={ref} position={[0, 0, z]} scale={[size, size, 1]}>
      <spriteMaterial
        map={getGlowTexture()}
        color={color}
        transparent
        opacity={opacity}
        blending={blending}
        depthWrite={false}
        depthTest={false}
      />
    </sprite>
  )
}

function Rays({ color, opacity, blending }: { color: string; opacity: number; blending: THREE.Blending }) {
  const mat = useRef<THREE.SpriteMaterial>(null)

  useFrame((state, delta) => {
    const m = mat.current
    if (!m) return
    m.rotation += delta * 0.024
    m.opacity = opacity * (0.82 + 0.18 * Math.sin(state.clock.elapsedTime * 0.45))
  })

  return (
    <sprite position={[0, 0, -1.1]} scale={[7.4, 7.4, 1]}>
      <spriteMaterial
        ref={mat}
        map={getRayTexture()}
        color={color}
        transparent
        opacity={opacity}
        blending={blending}
        depthWrite={false}
        depthTest={false}
      />
    </sprite>
  )
}

/** Thin bright stroke over a wide faint one — a cheap glow on every line. */
function GlowLine({
  points,
  color,
  width = 1.2,
  opacity = 0.9,
  halo = 0.16,
  blending,
}: {
  points: Pt[]
  color: string
  width?: number
  opacity?: number
  halo?: number
  blending: THREE.Blending
}) {
  return (
    <>
      {halo > 0 && (
        <Line
          points={points}
          color={color}
          lineWidth={width * 3.4}
          transparent
          opacity={halo}
          blending={blending}
          depthWrite={false}
        />
      )}
      <Line
        points={points}
        color={color}
        lineWidth={width}
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </>
  )
}

function Yantra({ p }: { p: Palette }) {
  const root = useRef<THREE.Group>(null)
  const lattice = useRef<THREE.Group>(null)
  const petals = useRef<THREE.Group>(null)

  const rings = useMemo(
    () => ({
      inner: circlePoints(1.44, 0),
      mid: circlePoints(1.9, -0.04),
      outer: circlePoints(2.26, -0.08),
      outer2: circlePoints(2.33, -0.08),
      lotus8: lotusPoints(1.5, 0.34, 8, -0.02),
      lotus16: lotusPoints(1.94, 0.28, 16, -0.06, Math.PI / 16),
    }),
    [],
  )

  useFrame((state, delta) => {
    const g = root.current
    if (!g) return
    const t = state.clock.elapsedTime

    // Entrance: settle up to full size over the first ~1.7s.
    const k = Math.min(1, t / 1.7)
    const eased = 1 - Math.pow(1 - k, 3)
    const s = 0.88 + 0.12 * eased
    g.scale.setScalar(s)

    // Idle breathing + a whisper of tilt so it reads as an object.
    g.rotation.x = Math.sin(t * 0.29) * 0.055
    g.rotation.y = Math.sin(t * 0.23 + 1.1) * 0.075
    g.position.y = Math.sin(t * 0.42) * 0.055

    if (lattice.current) lattice.current.rotation.z -= delta * 0.035
    if (petals.current) petals.current.rotation.z += delta * 0.012
  })

  return (
    <group ref={root} scale={0.88}>
      <Rays color={p.halo} opacity={p.ray} blending={p.blending} />
      <Glow size={7} color={p.halo} opacity={p.glow * 0.4} z={-0.9} blending={p.blending} />

      {/* Bhupura — the still frame around the turning wheel. */}
      <GlowLine points={squarePoints(2.86, -0.2)} color={p.gold} width={1.1} opacity={0.34} halo={0.05} blending={p.blending} />
      <GlowLine points={squarePoints(2.72, -0.2)} color={p.deep} width={0.75} opacity={0.2} halo={0} blending={p.blending} />
      <GlowLine points={squarePoints(2.58, -0.2)} color={p.gold} width={0.75} opacity={0.15} halo={0} blending={p.blending} />
      {gatePoints(2.86, -0.2).map((pts, i) => (
        <GlowLine key={`gate${i}`} points={pts} color={p.gold} width={1.1} opacity={0.34} halo={0.05} blending={p.blending} />
      ))}

      {/* Lotus rings — slow forward drift. */}
      <group ref={petals}>
        <GlowLine points={rings.lotus16} color={p.deep} width={0.95} opacity={0.42} halo={0.07} blending={p.blending} />
        <GlowLine points={rings.lotus8} color={p.gold} width={1.05} opacity={0.5} halo={0.09} blending={p.blending} />
      </group>

      <GlowLine points={rings.outer} color={p.gold} width={1} opacity={0.44} halo={0.08} blending={p.blending} />
      <GlowLine points={rings.outer2} color={p.deep} width={0.7} opacity={0.28} halo={0} blending={p.blending} />
      <GlowLine points={rings.mid} color={p.gold} width={0.9} opacity={0.4} halo={0.07} blending={p.blending} />

      {/* The nine interlocking triangles — slow reverse spin. */}
      <group ref={lattice}>
        <GlowLine points={rings.inner} color={p.soft} width={1.15} opacity={0.6} halo={0.1} blending={p.blending} />
        {UP.map((t, i) => (
          <GlowLine
            key={`u${i}`}
            points={triPoints(t, 0.04 + i * 0.05)}
            color={i % 2 ? p.gold : p.soft}
            width={1.2}
            opacity={(0.92 - i * 0.07) * p.lineOpacity}
            halo={0.13 - i * 0.02}
            blending={p.blending}
          />
        ))}
        {DOWN.map((t, i) => (
          <GlowLine
            key={`d${i}`}
            points={triPoints(t, 0.02 - i * 0.05)}
            color={i % 2 ? p.soft : p.gold}
            width={1.2}
            opacity={(0.9 - i * 0.07) * p.lineOpacity}
            halo={0.13 - i * 0.02}
            blending={p.blending}
          />
        ))}
      </group>

      {/* Bindu — the core the whole composition is lit from. */}
      {/* Kept just under blow-out: a pure-white core turns grey under the
          legibility scrim, a warm one stays gold. */}
      <Glow size={3.1} color={p.halo} opacity={p.glow} z={0.3} blending={p.blending} breathe={0.05} />
      <Glow size={0.85} color={p.core} opacity={p.glow * 0.7} z={0.34} blending={p.blending} breathe={0.09} />
      <mesh position={[0, 0, 0.38]}>
        <sphereGeometry args={[0.032, 16, 16]} />
        <meshBasicMaterial color={p.soft} />
      </mesh>
    </group>
  )
}

function StarField({ p }: { p: Palette }) {
  const ref = useRef<THREE.Points>(null)

  const geometry = useMemo(() => {
    const COUNT = 620
    const positions = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i += 1) {
      // A slab well behind the yantra: no star ever nears the camera.
      const r = 4.5 + Math.pow(Math.random(), 0.55) * 22
      const theta = Math.random() * TAU
      positions[i * 3] = Math.cos(theta) * r
      positions[i * 3 + 1] = Math.sin(theta) * r * 0.72
      positions[i * 3 + 2] = -7 - Math.random() * 20
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return g
  }, [])

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += delta * 0.008
  })

  const materialProps: ThreeElements['pointsMaterial'] = {
    size: 0.26,
    sizeAttenuation: true,
    map: getStarTexture(),
    alphaMap: getStarTexture(),
    color: p.soft,
    transparent: true,
    opacity: p.star,
    depthWrite: false,
    blending: p.blending,
  }

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial {...materialProps} />
    </points>
  )
}

export default function YantraScene({ dark = true, paused = false }: { dark?: boolean; paused?: boolean }) {
  const p = useMemo(() => palette(dark), [dark])

  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={paused ? 'never' : 'always'}
      camera={{ position: [0, 0, 7.4], fov: 42 }}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      style={{ pointerEvents: 'none' }}
      aria-hidden
    >
      <StarField p={p} />
      <Yantra p={p} />
    </Canvas>
  )
}
