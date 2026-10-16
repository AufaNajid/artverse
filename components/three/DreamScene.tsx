"use client";

import { Component, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { Edges, Environment, Float, Lightformer, OrbitControls, RoundedBox, useTexture } from "@react-three/drei";
import { Color, DoubleSide, MathUtils, NearestFilter, Object3D, SRGBColorSpace, type Group, type InstancedMesh, type Points } from "three";
import type { Artwork } from "@/data/artworks";
import "./DreamScene.css";

export type DreamSceneProps = {
  artworks: Artwork[];
  interactive?: boolean;
  motionEnabled?: boolean;
  focusArtwork?: string;
  onSelectArtwork?: (slug: string) => void;
};

type SceneArtwork = { slug: string; path: string; title: string; pixel: boolean; depth: boolean; width: number; height: number };

function sceneArtwork(artwork: Artwork): SceneArtwork {
  return { slug: artwork.slug, path: artwork.frameImage, title: artwork.title, pixel: artwork.category === "Pixel art", depth: artwork.category === "Pixel art", width: artwork.width, height: artwork.height };
}

function pickArtwork(artworks: Artwork[], focusArtwork?: string) {
  const main = artworks.find((artwork) => artwork.slug === focusArtwork) || artworks.find((artwork) => artwork.featured && artwork.category === "Pixel art") || artworks[0];
  const buddy = artworks.find((artwork) => artwork.slug !== main?.slug && artwork.category === "Pixel art") || artworks.find((artwork) => artwork.slug !== main?.slug);
  return { main: main ? sceneArtwork(main) : null, buddy: buddy ? sceneArtwork(buddy) : null };
}

class RenderBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function StaticWorld({ artworks, focusArtwork, onSelectArtwork }: Pick<DreamSceneProps, "artworks" | "focusArtwork" | "onSelectArtwork">) {
  const { main, buddy } = pickArtwork(artworks, focusArtwork);
  return (
    <div className="dream-fallback" aria-label="A floating pixel world built around original character art">
      <div className="dream-glass dream-glass-one" /><div className="dream-glass dream-glass-two" />
      <div className="dream-glass dream-glass-three" /><div className="dream-glass dream-glass-four" />
      <div className="dream-lime-shard" /><div className="dream-pink-shard" />
      {main && <button className="dream-sprite dream-sprite-main" style={{ backgroundImage: `url(${main.path})`, imageRendering: main.pixel ? "pixelated" : "auto" }} aria-label={`Explore ${main.title}`} onClick={() => onSelectArtwork?.(main.slug)} />}
      {buddy && <button className="dream-sprite dream-sprite-buddy" style={{ backgroundImage: `url(${buddy.path})`, imageRendering: buddy.pixel ? "pixelated" : "auto" }} aria-label={`Explore ${buddy.title}`} onClick={() => onSelectArtwork?.(buddy.slug)} />}
    </div>
  );
}

/** The original alpha is sampled into shallow voxel columns. The unaltered
 * image forms their crisp front face; orbiting exposes the artwork's depth. */
function PixelSprite({ artwork, height, simplified, motion, onSelectArtwork }: {
  artwork: SceneArtwork; height: number; simplified: boolean; motion: boolean; onSelectArtwork?: (slug: string) => void;
}) {
  const source = useTexture(artwork.path);
  const texture = useMemo(() => {
    const copy = source.clone();
    copy.colorSpace = SRGBColorSpace;
    if (artwork.pixel) { copy.magFilter = copy.minFilter = NearestFilter; copy.generateMipmaps = false; }
    copy.needsUpdate = true;
    return copy;
  }, [source, artwork.pixel]);
  useEffect(() => () => texture.dispose(), [texture]);
  const image = source.image as HTMLImageElement;
  const width = height * image.width / image.height;
  const resolution = simplified ? 42 : 84;
  const voxels = useRef<InstancedMesh>(null);
  const [hovered, setHovered] = useState(false);

  const samples = useMemo(() => {
    if (!artwork.depth) return [];
    const sampleCanvas = document.createElement("canvas");
    sampleCanvas.width = sampleCanvas.height = resolution;
    const context = sampleCanvas.getContext("2d", { willReadFrequently: true });
    if (!context) return [];
    context.imageSmoothingEnabled = false;
    context.drawImage(image, 0, 0, resolution, resolution);
    const pixels = context.getImageData(0, 0, resolution, resolution).data;
    const result: { x: number; y: number; depth: number; color: Color }[] = [];
    for (let y = 0; y < resolution; y++) for (let x = 0; x < resolution; x++) {
      const offset = (y * resolution + x) * 4;
      if (pixels[offset + 3] < 220 || x === 0 || y === 0 || x === resolution - 1 || y === resolution - 1) continue;
      // Keep depth inside the alpha silhouette so a coarse sample never spills
      // a dark block into a transparent gap in the original illustration.
      if ([offset - 4, offset + 4, offset - resolution * 4, offset + resolution * 4].some((neighbor) => pixels[neighbor + 3] < 180)) continue;
      const color = new Color().setRGB(pixels[offset] / 255, pixels[offset + 1] / 255, pixels[offset + 2] / 255, SRGBColorSpace);
      result.push({ x: ((x + 0.5) / resolution - 0.5) * width, y: (0.5 - (y + 0.5) / resolution) * height, depth: 0.13 + pixels[offset + 2] / 255 * 0.10, color });
    }
    return result;
  }, [image, height, width, resolution, artwork.depth]);

  useLayoutEffect(() => {
    if (!voxels.current) return;
    const transform = new Object3D();
    samples.forEach((sample, index) => {
      transform.position.set(sample.x, sample.y, -sample.depth / 2 - 0.008);
      transform.scale.set(width / resolution * 0.95, height / resolution * 0.95, sample.depth);
      transform.updateMatrix();
      voxels.current!.setMatrixAt(index, transform.matrix);
      voxels.current!.setColorAt(index, sample.color);
    });
    voxels.current.instanceMatrix.needsUpdate = true;
    if (voxels.current.instanceColor) voxels.current.instanceColor.needsUpdate = true;
    voxels.current.computeBoundingSphere();
  }, [samples, width, height, resolution]);

  useEffect(() => {
    if (!hovered) return;
    const previousCursor = document.body.style.cursor;
    document.body.style.cursor = "pointer";
    return () => { document.body.style.cursor = previousCursor; };
  }, [hovered]);

  const click = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (event.delta < 7) onSelectArtwork?.(artwork.slug);
  };

  return (
    <group scale={hovered && motion ? 1.025 : 1} onClick={click} onPointerOver={(event) => { event.stopPropagation(); setHovered(true); }} onPointerOut={() => setHovered(false)}>
      {samples.length > 0 && <instancedMesh ref={voxels} args={[undefined, undefined, samples.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.8} metalness={0.04} />
      </instancedMesh>}
      <mesh position={[0, 0, 0.004]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={texture} transparent alphaTest={0.09} side={DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  );
}

function GlassBlock({ position, size, rotation = [0, 0, 0], simplified, color = "#24a8e1" }: {
  position: [number, number, number]; size: [number, number, number]; rotation?: [number, number, number]; simplified: boolean; color?: string;
}) {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={size} radius={0.025} smoothness={simplified ? 2 : 3}>
        <meshPhysicalMaterial color={color} roughness={0.12} metalness={0.15} transparent opacity={0.50} transmission={simplified ? 0 : 0.25} thickness={0.55} ior={1.3} clearcoat={1} clearcoatRoughness={0.06} depthWrite={false} />
      </RoundedBox>
      <mesh>
        <boxGeometry args={size} />
        <meshBasicMaterial color={color} transparent opacity={0} depthWrite={false} />
        <Edges color="#d3fcff" threshold={20} />
      </mesh>
      {!simplified && <mesh position={[0, size[1] * 0.24, size[2] / 2 + 0.028]}>
        <boxGeometry args={[size[0] * 0.88, 0.008, 0.008]} />
        <meshBasicMaterial color="#dcffff" transparent opacity={0.55} depthWrite={false} />
      </mesh>}
    </group>
  );
}

function VoxelArchitecture({ motion, simplified }: { motion: boolean; simplified: boolean }) {
  return (
    <>
      <group position={[0.35, 0.05, -2.3]} rotation={[0.13, -0.14, 0.60]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[6.5, 0.065, 0.085]} />
          <meshStandardMaterial color="#e7adfa" roughness={0.2} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0.14, -0.09]}>
          <boxGeometry args={[5.7, 0.035, 0.055]} />
          <meshStandardMaterial color="#ffc7ef" roughness={0.25} metalness={0.15} />
        </mesh>
      </group>
      <Float speed={motion ? 0.8 : 0} floatIntensity={motion ? 0.13 : 0} rotationIntensity={motion ? 0.025 : 0}>
        <group rotation={[0.13, -0.42, -0.12]} position={[-1.7, -0.9, -1.8]}>
          <GlassBlock position={[-0.6, -1.1, 0]} size={[2.8, 0.5, 1.9]} simplified={simplified} />
          <GlassBlock position={[0.55, -0.54, 0.2]} size={[1.9, 0.55, 1.7]} simplified={simplified} />
          <GlassBlock position={[1.2, 0.02, 0.5]} size={[1.4, 0.5, 1.3]} simplified={simplified} />
          <GlassBlock position={[-1.55, 0.2, -0.3]} size={[0.75, 1.95, 1.1]} simplified={simplified} />
          <GlassBlock position={[-0.98, 1.4, -0.6]} size={[1.3, 0.45, 1.2]} simplified={simplified} />
        </group>
      </Float>
      <Float speed={motion ? 1.0 : 0} floatIntensity={motion ? 0.18 : 0} rotationIntensity={motion ? 0.035 : 0}>
        <group position={[2.4, 1.1, -1.6]} rotation={[0.1, 0.36, -0.16]}>
          <GlassBlock position={[0, -1.2, 0]} size={[1.15, 0.65, 1.2]} simplified={simplified} />
          <GlassBlock position={[0.1, -0.5, 0]} size={[1.45, 0.65, 1.3]} simplified={simplified} />
          <GlassBlock position={[0.45, 0.22, 0.06]} size={[1.45, 0.68, 1.5]} simplified={simplified} />
          <GlassBlock position={[0.3, 0.95, 0.1]} size={[1.85, 0.68, 1.5]} simplified={simplified} />
          <GlassBlock position={[0.7, 1.67, 0.05]} size={[1.3, 0.68, 1.4]} simplified={simplified} />
        </group>
      </Float>
      <group position={[-2.25, 2.17, -1.75]} rotation={[0.12, -0.32, -0.10]}>
        <GlassBlock position={[0, 0, 0]} size={[1.55, 0.36, 1.0]} simplified={simplified} color="#81d8d7" />
        <GlassBlock position={[0.5, 0.38, 0]} size={[0.55, 0.35, 0.95]} simplified={simplified} color="#81d8d7" />
      </group>
      <group position={[2.15, -2.0, -0.6]} rotation={[0.18, 0.4, -0.25]}>
        {[[-0.5, 0], [0, 0], [0.5, 0], [0, 0.5], [0.5, 0.5], [0.5, 1]].map(([x, y], index) => (
          <mesh key={index} position={[x, y, 0]}>
            <boxGeometry args={[0.49, 0.49, 0.5]} />
            <meshStandardMaterial color={index % 2 ? "#6cdbc2" : "#a4eed2"} roughness={0.22} metalness={0.12} />
          </mesh>
        ))}
      </group>
    </>
  );
}

function FloatingShards({ motion, simplified }: { motion: boolean; simplified: boolean }) {
  const panels = [
    { position: [-2.58, -0.15, 0.45] as [number, number, number], size: [0.43, 0.43, 0.045] as [number, number, number], color: "#b7ee56" },
    { position: [2.72, -1.53, 0.6] as [number, number, number], size: [0.52, 0.38, 0.05] as [number, number, number], color: "#c8f67a" },
    { position: [2.05, 2.48, -0.35] as [number, number, number], size: [0.36, 0.36, 0.04] as [number, number, number], color: "#a6e94a" },
    { position: [-1.9, -2.52, -0.25] as [number, number, number], size: [0.33, 0.33, 0.04] as [number, number, number], color: "#9be74c" },
    { position: [0.1, 2.9, -0.6] as [number, number, number], size: [0.26, 0.26, 0.035] as [number, number, number], color: "#ccef78" },
  ];
  const shards = [
    { position: [-2.7, 0.8, 0.65] as [number, number, number], scale: [0.34, 0.58, 0.2] as [number, number, number], color: "#c2ff55" },
    { position: [2.68, -0.6, 0.75] as [number, number, number], scale: [0.26, 0.45, 0.25] as [number, number, number], color: "#d4ff50" },
    { position: [1.7, 2.8, 0.0] as [number, number, number], scale: [0.21, 0.4, 0.18] as [number, number, number], color: "#c4ff65" },
    { position: [-1.5, -2.65, 0.4] as [number, number, number], scale: [0.24, 0.34, 0.22] as [number, number, number], color: "#ff9bdd" },
    { position: [-0.8, 2.95, -1.0] as [number, number, number], scale: [0.2, 0.2, 0.2] as [number, number, number], color: "#ff8ed5" },
  ];
  return <>
    {panels.slice(0, simplified ? 3 : 5).map((panel, index) => <Float key={`tile-${index}`} speed={motion ? 0.9 + index * 0.1 : 0} floatIntensity={motion ? 0.16 : 0} rotationIntensity={motion ? 0.12 : 0}>
      <mesh position={panel.position} rotation={[0.25, -0.35 + index * 0.1, Math.PI / 4 + index * 0.15]}>
        <boxGeometry args={panel.size} />
        <meshStandardMaterial color={panel.color} roughness={0.32} metalness={0.08} />
        <Edges color="#e8ffb3" threshold={20} />
      </mesh>
    </Float>)}
    {shards.slice(0, simplified ? 3 : 5).map((shard, index) => <Float key={index} speed={motion ? 1.2 + index * 0.1 : 0} floatIntensity={motion ? 0.5 : 0} rotationIntensity={motion ? 0.8 : 0}>
      <mesh position={shard.position} scale={shard.scale} rotation={[0.3 + index, 0.5, -0.3]}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color={shard.color} roughness={0.19} metalness={0.24} />
      </mesh>
    </Float>)}
    <Float speed={motion ? 1.25 : 0} floatIntensity={motion ? 0.35 : 0} rotationIntensity={motion ? 0.8 : 0}>
      <mesh position={[2.3, 0.98, 0.9]} rotation={[0.3, 0.6, 0.4]}>
        <boxGeometry args={[0.25, 0.25, 0.25]} />
        <meshStandardMaterial color="#ffaeed" roughness={0.16} metalness={0.12} />
      </mesh>
    </Float>
    {!simplified && <Float speed={motion ? 0.9 : 0} floatIntensity={motion ? 0.2 : 0} rotationIntensity={motion ? 0.25 : 0}>
      <group position={[2.48, 1.52, 0.3]} rotation={[0.3, 0.4, 0.15]} scale={0.72}>
        <mesh><icosahedronGeometry args={[0.27, 0]} /><meshStandardMaterial color="#fdb1e8" roughness={0.3} flatShading /></mesh>
        {Array.from({ length: 6 }, (_, index) => {
          const angle = index * Math.PI / 3;
          return <mesh key={index} position={[Math.sin(angle) * 0.28, Math.cos(angle) * 0.28, 0]} rotation={[0, 0, -angle]}>
            <coneGeometry args={[0.12, 0.30, 4]} />
            <meshStandardMaterial color={index % 2 ? "#f9a4df" : "#ffc4ef"} roughness={0.3} flatShading />
          </mesh>;
        })}
      </group>
    </Float>}
  </>;
}

function Stardust({ motion, simplified }: { motion: boolean; simplified: boolean }) {
  const points = useRef<Points>(null);
  const positions = useMemo(() => {
    const count = simplified ? 22 : 48;
    const data = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      data[i * 3] = Math.cos(i * 2.4) * (2.5 + Math.sin(i * 4.2) * 0.6);
      data[i * 3 + 1] = Math.sin(i * 2.4) * 3.0;
      data[i * 3 + 2] = Math.cos(i * 3.7) * 1.2;
    }
    return data;
  }, [simplified]);
  useFrame((_, delta) => { if (motion && points.current) points.current.rotation.y += delta * 0.025; });
  return <points ref={points}>
    <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
    <pointsMaterial color="#b1fcfc" size={0.023} transparent opacity={0.7} sizeAttenuation depthWrite={false} />
  </points>;
}

function PixelWorld({ artworks, interactive, motion, simplified, scroll, focusArtwork, onSelectArtwork }: {
  artworks: Artwork[]; interactive: boolean; motion: boolean; simplified: boolean; scroll: { current: number }; focusArtwork?: string; onSelectArtwork?: (slug: string) => void;
}) {
  const world = useRef<Group>(null);
  const character = useRef<Group>(null);
  const { main, buddy } = pickArtwork(artworks, focusArtwork);
  useFrame((state, delta) => {
    if (!motion || !world.current) return;
    world.current.rotation.y = MathUtils.damp(world.current.rotation.y, -0.08 + (interactive ? 0 : state.pointer.x * 0.07) + scroll.current * 0.035, 3, delta);
    world.current.rotation.x = MathUtils.damp(world.current.rotation.x, interactive ? 0 : -state.pointer.y * 0.025, 3, delta);
    if (character.current) {
      character.current.rotation.z = -0.035 + Math.sin(state.clock.elapsedTime * 0.36) * 0.025;
      character.current.position.y = -0.16 + Math.sin(state.clock.elapsedTime * 0.75) * 0.09;
    }
  });
  return <>
    <ambientLight intensity={1.0} color="#d6ffff" />
    <directionalLight position={[-4, 6, 6]} intensity={3.1} color="#f3ffff" />
    <directionalLight position={[4, 1, -3]} intensity={2.7} color="#36abff" />
    <pointLight position={[-2, -1, 3]} intensity={5} color="#b0fff0" />
    <Environment resolution={simplified ? 64 : 128} frames={1} environmentIntensity={1.0}>
      <Lightformer form="rect" intensity={4} color="#e0fffa" position={[-4, 6, 4]} scale={[9, 5, 1]} rotation={[Math.PI / 3, 0, 0]} />
      <Lightformer form="rect" intensity={3.5} color="#4ee3ff" position={[4, 1, 5]} scale={[4, 7, 1]} rotation={[0, -Math.PI / 4, 0]} />
      <Lightformer form="rect" intensity={3} color="#e3ffff" position={[-3, 0, -4]} scale={[4, 5, 1]} />
    </Environment>
    <group ref={world} rotation={[0, -0.08, 0]} scale={simplified ? 0.87 : 1}>
      <VoxelArchitecture motion={motion} simplified={simplified} />
      <FloatingShards motion={motion} simplified={simplified} />
      <group ref={character} position={[0.3, -0.16, 1]} rotation={[0, -0.06, -0.035]}>
        {main && <RenderBoundary key={main.path} fallback={null}><Suspense fallback={null}>
          <PixelSprite artwork={main} height={main.slug === "digital-companion" ? 3.55 : Math.min(5.75, 6 / (main.width / main.height))} simplified={simplified} motion={motion} onSelectArtwork={onSelectArtwork} />
        </Suspense></RenderBoundary>}
      </group>
      <Float speed={motion ? 1.3 : 0} floatIntensity={motion ? 0.22 : 0} rotationIntensity={motion ? 0.10 : 0}>
        <group position={[-1.72, 1.84, 1.22]} rotation={[0, 0.15, 0.07]}>
          {buddy && <RenderBoundary key={buddy.path} fallback={null}><Suspense fallback={null}>
            <PixelSprite artwork={buddy} height={1.42} simplified={simplified} motion={motion} onSelectArtwork={onSelectArtwork} />
          </Suspense></RenderBoundary>}
        </group>
      </Float>
      <Stardust motion={motion} simplified={simplified} />
    </group>
    {interactive && <OrbitControls enablePan={false} enableZoom minDistance={7.5} maxDistance={13.5} minPolarAngle={Math.PI / 2.8} maxPolarAngle={Math.PI / 1.65} minAzimuthAngle={-0.65} maxAzimuthAngle={0.65} enableDamping dampingFactor={0.075} />}
  </>;
}

export default function DreamScene({ artworks, interactive = false, motionEnabled = true, focusArtwork, onSelectArtwork }: DreamSceneProps) {
  const container = useRef<HTMLDivElement>(null);
  const scroll = useRef(0);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [simplified, setSimplified] = useState(false);
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sizeQuery = window.matchMedia("(max-width: 760px)");
    const updatePreferences = () => { setReducedMotion(motionQuery.matches); setSimplified(sizeQuery.matches); };
    const initialFrame = requestAnimationFrame(() => {
      const testCanvas = document.createElement("canvas");
      try { const context = testCanvas.getContext("webgl2"); setSupported(Boolean(context)); context?.getExtension("WEBGL_lose_context")?.loseContext(); }
      catch { setSupported(false); }
      updatePreferences();
    });
    motionQuery.addEventListener("change", updatePreferences);
    sizeQuery.addEventListener("change", updatePreferences);
    const updateScroll = () => { scroll.current = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 2); };
    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: "120px" });
    if (container.current) observer.observe(container.current);
    return () => { cancelAnimationFrame(initialFrame); motionQuery.removeEventListener("change", updatePreferences); sizeQuery.removeEventListener("change", updatePreferences); window.removeEventListener("scroll", updateScroll); observer.disconnect(); };
  }, []);
  const fallback = <StaticWorld artworks={artworks} focusArtwork={focusArtwork} onSelectArtwork={onSelectArtwork} />;
  const motion = motionEnabled && !reducedMotion && inView;
  return <div ref={container} className="dream-scene" style={{ position: "relative", width: "100%", height: "100%", minHeight: 360 }}>
    {supported ? <RenderBoundary fallback={fallback}>
      <Canvas camera={{ position: [0, 0, 10.5], fov: 43, near: 0.1, far: 50 }} dpr={simplified ? 1 : [1, 1.5]} frameloop={motion ? "always" : "demand"} gl={{ alpha: true, antialias: !simplified, powerPreference: "low-power" }} fallback={fallback}
        onCreated={({ gl }) => { gl.setClearColor(0x000000, 0); gl.domElement.addEventListener("webglcontextlost", (event) => { event.preventDefault(); setSupported(false); }, { once: true }); }}
        role="img" aria-label="An interactive cyan glass voxel world with original pixel characters and floating neon shards">
        <PixelWorld artworks={artworks} interactive={interactive} motion={motion} simplified={simplified} scroll={scroll} focusArtwork={focusArtwork} onSelectArtwork={onSelectArtwork} />
      </Canvas>
    </RenderBoundary> : fallback}
  </div>;
}
