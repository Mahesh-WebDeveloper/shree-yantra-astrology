import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/* Soft radial sprite texture — used for the central glow and round stars. */
function useGlowTexture() {
  return useMemo(() => {
    const size = 128
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
      g.addColorStop(0, 'rgba(255,248,225,1)')
      g.addColorStop(0.35, 'rgba(246,210,122,0.55)')
      g.addColorStop(1, 'rgba(246,210,122,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, size, size)
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.needsUpdate = true
    return tex
  }, [])
}

/* Gentle central light — a soft glow sprite, never a hard blob. */
function CentralGlow({ texture }: { texture: THREE.Texture }) {
  const ref = useRef<THREE.Sprite>(null)
  useFrame((s) => {
    if (!ref.current) return
    const p = 3.0 + Math.sin(s.clock.elapsedTime * 0.7) * 0.12
    ref.current.scale.set(p, p, p)
  })
  return (
    <sprite ref={ref} scale={3}>
      <spriteMaterial
        map={texture}
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </sprite>
  )
}

/* Tiny bright seed at the very centre. */
function CoreStar() {
  return (
    <mesh scale={0.09}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial color="#fff6dc" />
    </mesh>
  )
}

/* Signature zodiac ring: a fine gold circle with 12 markers + inner ticks. */
function ZodiacRing() {
  const group = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (group.current) group.current.rotation.z += dt * 0.03
  })
  const R = 2.45
  const markers = useMemo(() => new Array(12).fill(0).map((_, i) => (i * Math.PI) / 6), [])
  return (
    <group ref={group} rotation={[1.32, 0, 0]}>
      <mesh>
        <torusGeometry args={[R, 0.008, 16, 240]} />
        <meshBasicMaterial color="#f6d27a" transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh>
        <torusGeometry args={[R - 0.14, 0.003, 12, 200]} />
        <meshBasicMaterial color="#e9b850" transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {markers.map((a, i) => (
        <mesh key={i} position={[Math.cos(a) * R, Math.sin(a) * R, 0]}>
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshBasicMaterial color={i % 3 === 0 ? '#fff2c8' : '#f6d27a'} />
        </mesh>
      ))}
    </group>
  )
}

/* Tilted planetary orbits (thin rings). */
function OrbitRings() {
  const group = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (group.current) group.current.rotation.z -= dt * 0.018
  })
  const rings = useMemo(
    () => [
      { r: 1.35, tilt: [1.15, 0.35, 0] as const, op: 0.4, c: '#e9b850' },
      { r: 3.15, tilt: [1.45, -0.4, 0.25] as const, op: 0.24, c: '#c9a2f0' },
      { r: 3.75, tilt: [1.05, 0.55, -0.3] as const, op: 0.16, c: '#e9b850' },
    ],
    [],
  )
  return (
    <group ref={group}>
      {rings.map((ring, i) => (
        <mesh key={i} rotation={ring.tilt as unknown as THREE.Euler}>
          <torusGeometry args={[ring.r, 0.005, 14, 200]} />
          <meshBasicMaterial color={ring.c} transparent opacity={ring.op} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

/* Small planets riding elliptical paths. */
function Planets({ texture }: { texture: THREE.Texture }) {
  const group = useRef<THREE.Group>(null)
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (!group.current) return
    group.current.children.forEach((child, idx) => {
      const i = Math.floor(idx / 2) // pairs: planet + glow share an orbit
      const speed = 0.14 + i * 0.05
      const rad = 1.35 + i * 1.2
      child.position.set(
        Math.cos(t * speed + i * 2) * rad,
        Math.sin(t * speed + i * 2) * rad * 0.4,
        Math.sin(t * speed + i * 2) * rad * 0.28,
      )
    })
  })
  const planets = [
    { c: '#f6d27a', s: 0.06 },
    { c: '#c9a2f0', s: 0.075 },
    { c: '#8ce0c0', s: 0.05 },
  ]
  return (
    <group ref={group}>
      {planets.map((p, i) => (
        <group key={i}>
          <mesh>
            <sphereGeometry args={[p.s, 18, 18]} />
            <meshBasicMaterial color={p.c} />
          </mesh>
          <sprite scale={p.s * 6}>
            <spriteMaterial map={texture} transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} />
          </sprite>
        </group>
      ))}
    </group>
  )
}

/* Soft round starfield. */
function Starfield({ texture, count = 900 }: { texture: THREE.Texture; count?: number }) {
  const ref = useRef<THREE.Points>(null)
  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const gold = new THREE.Color('#f6d27a')
    const white = new THREE.Color('#ffffff')
    const violet = new THREE.Color('#b79cf0')
    for (let i = 0; i < count; i += 1) {
      const r = 6 + Math.random() * 30
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6
      pos[i * 3 + 2] = r * Math.cos(phi) - 10
      const pick = Math.random()
      const c = pick > 0.9 ? violet : pick > 0.45 ? gold : white
      col[i * 3] = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b
    }
    return { positions: pos, colors: col }
  }, [count])

  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.01
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={texture}
        size={0.09}
        vertexColors
        transparent
        opacity={0.85}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

/* Gentle camera parallax toward the pointer. */
function ParallaxRig() {
  const { camera, pointer } = useThree()
  useFrame(() => {
    camera.position.x += (pointer.x * 0.5 - camera.position.x) * 0.03
    camera.position.y += (pointer.y * 0.35 + 0.2 - camera.position.y) * 0.03
    camera.lookAt(0, 0, -2)
  })
  return null
}

export default function CosmicSceneInner() {
  const glow = useGlowTexture()
  return (
    <Canvas
      camera={{ position: [0, 0.2, 6.4], fov: 50 }}
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ width: '100%', height: '100%' }}
    >
      <group position={[0, 0, -2]} rotation={[0.12, 0, 0.06]}>
        <CentralGlow texture={glow} />
        <CoreStar />
        <ZodiacRing />
        <OrbitRings />
        <Planets texture={glow} />
      </group>
      <Starfield texture={glow} />
      <ParallaxRig />
    </Canvas>
  )
}
