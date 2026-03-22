# React Three Fiber Patterns

Detailed 3D patterns for web pages. Reference this when the task involves 3D elements.

## Table of Contents
1. [Floating Hero Object](#floating-hero-object)
2. [Particle Field Background](#particle-field-background)
3. [Gradient Blob / Sphere](#gradient-blob)
4. [Interactive Mouse-Tracking Object](#interactive-mouse-tracking)
5. [Lighting & Environment](#lighting-and-environment)
6. [Mobile Fallback Strategy](#mobile-fallback)
7. [Lazy Loading Pattern](#lazy-loading)
8. [Scroll-Linked 3D](#scroll-linked-3d)

---

## Floating Hero Object

A 3D object that gently floats and rotates behind the hero section. Use Drei's `<Float>` for the bobbing motion and `useFrame` for continuous rotation.

```tsx
"use client";
import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, MeshDistortMaterial } from "@react-three/drei";
import type { Mesh } from "three";

function FloatingShape() {
  const meshRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.15;
      meshRef.current.rotation.x += delta * 0.08;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.8}>
      <mesh ref={meshRef} scale={2}>
        <icosahedronGeometry args={[1, 4]} />
        <MeshDistortMaterial
          color="#1B4332"
          roughness={0.15}
          metalness={0.9}
          distort={0.25}
          speed={2}
        />
      </mesh>
    </Float>
  );
}
```

**When to use:** Hero sections that need a "premium tech" feel. The distort material makes it organic and alive.

**Variations:**
- `torusKnotGeometry` for more complex shapes
- `octahedronGeometry` for crystalline/gem feel
- Multiple small floating objects instead of one large one

---

## Particle Field Background

A field of small particles that drift slowly, creating depth. Good for "AI-powered" or "data" vibes.

```tsx
"use client";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function ParticleField({ count = 300 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;     // x
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20; // y
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20; // z
    }
    return pos;
  }, [count]);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.02;
      pointsRef.current.rotation.x += delta * 0.01;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#1B4332"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}
```

**Performance notes:**
- Desktop: 200-500 particles
- Mobile: 50-100 or disable entirely
- Use `sizeAttenuation` for depth perception

---

## Gradient Blob

A morphing, colorful sphere that acts as a living gradient background. More organic than particles.

```tsx
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshDistortMaterial } from "@react-three/drei";
import type { Mesh } from "three";

function GradientBlob({ color = "#1B4332", speed = 2 }) {
  const meshRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
      meshRef.current.rotation.y = Math.cos(state.clock.elapsedTime * 0.2) * 0.15;
    }
  });

  return (
    <mesh ref={meshRef} scale={2.5}>
      <sphereGeometry args={[1, 64, 64]} />
      <MeshDistortMaterial
        color={color}
        roughness={0.1}
        metalness={0.8}
        distort={0.4}
        speed={speed}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}
```

**When to use:** Behind pricing sections, hero backgrounds, or as decorative accents. Feels alive without being distracting.

---

## Interactive Mouse-Tracking

Object that subtly follows the cursor, creating a sense of responsiveness.

```tsx
import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import type { Mesh } from "three";
import * as THREE from "three";

function MouseTracker() {
  const meshRef = useRef<Mesh>(null);
  const { viewport } = useThree();

  useFrame((state) => {
    if (!meshRef.current) return;
    const x = (state.pointer.x * viewport.width) / 4;
    const y = (state.pointer.y * viewport.height) / 4;

    meshRef.current.position.x = THREE.MathUtils.lerp(
      meshRef.current.position.x, x, 0.05
    );
    meshRef.current.position.y = THREE.MathUtils.lerp(
      meshRef.current.position.y, y, 0.05
    );
  });

  return (
    <Float speed={2} floatIntensity={0.3}>
      <mesh ref={meshRef}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color="#1B4332"
          wireframe
          transparent
          opacity={0.3}
        />
      </mesh>
    </Float>
  );
}
```

**When to use:** Subtle depth on hero sections. The `lerp` factor (0.05) controls how lazily it follows — lower = more floaty and elegant.

---

## Lighting and Environment

### Quick Premium Lighting Setup

```tsx
<>
  <Environment preset="city" />
  <ambientLight intensity={0.4} />
  <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
  <pointLight position={[-5, -5, -5]} intensity={0.3} color="#059669" />
</>
```

### Environment Presets
- `"city"` — Neutral, professional (best for SaaS)
- `"sunset"` — Warm, dramatic
- `"dawn"` — Soft, calming
- `"studio"` — Clean, product-shot feel
- `"apartment"` — Casual, warm

### Rim Lighting for Pop
Add a backlight to make objects stand out:
```tsx
<spotLight position={[0, 5, -10]} intensity={2} color="#059669" angle={0.5} />
```

---

## Mobile Fallback

Always provide a non-3D fallback for mobile devices and users with reduced motion preferences.

```tsx
"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const Scene3D = dynamic(() => import("./Scene3D"), { ssr: false });

function StaticFallback() {
  return (
    <div className="absolute inset-0 -z-10">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-200/20 rounded-full blur-3xl" />
    </div>
  );
}

export function HeroBackground() {
  const [show3D, setShow3D] = useState(false);

  useEffect(() => {
    const isDesktop = window.innerWidth >= 1024;
    const hasGPU = navigator.hardwareConcurrency > 4;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    setShow3D(isDesktop && hasGPU && !prefersReducedMotion);
  }, []);

  return show3D ? <Scene3D /> : <StaticFallback />;
}
```

**Rules:**
- Default to 2D fallback, opt-in to 3D
- Check `hardwareConcurrency` as a proxy for device capability
- Always respect `prefers-reduced-motion`
- Use `dynamic(() => import(...), { ssr: false })` so Three.js never touches the server

---

## Lazy Loading

The R3F + Three.js bundle is large (~150KB min). Always lazy-load.

```tsx
import dynamic from "next/dynamic";
import { Suspense } from "react";

const Scene = dynamic(() => import("./Scene"), { ssr: false });

export function HeroSection() {
  return (
    <div className="relative h-screen">
      {/* 3D background */}
      <div className="absolute inset-0 -z-10">
        <Suspense fallback={
          <div className="w-full h-full bg-gradient-to-b from-primary/5 to-transparent" />
        }>
          <Scene />
        </Suspense>
      </div>

      {/* 2D content on top */}
      <div className="relative z-10 flex items-center h-full">
        <h1>Your content here</h1>
      </div>
    </div>
  );
}
```

---

## Scroll-Linked 3D

Drive 3D scene properties from scroll position using Framer Motion's `useScroll`.

```tsx
"use client";
import { useRef } from "react";
import { useScroll, useTransform } from "motion/react";
import { Canvas, useFrame } from "@react-three/fiber";

// Pass scroll progress to 3D via a store or ref
function ScrollScene({ progress }: { progress: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y = progress * Math.PI * 2;
      meshRef.current.position.y = progress * -3;
    }
  });

  return (
    <mesh ref={meshRef}>
      <torusKnotGeometry args={[1, 0.3, 128, 32]} />
      <meshStandardMaterial color="#1B4332" />
    </mesh>
  );
}

export function ScrollHero() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Convert MotionValue to number for R3F
  const [progress, setProgress] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", setProgress);

  return (
    <div ref={containerRef} className="h-[300vh] relative">
      <div className="sticky top-0 h-screen">
        <Canvas>
          <ScrollScene progress={progress} />
        </Canvas>
      </div>
    </div>
  );
}
```

**When to use:** Storytelling pages, case studies, product walkthroughs where the user scrolls through a narrative and the 3D scene responds.
