"use client";

import { Component, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Edges, Environment, Lightformer, OrbitControls, useTexture } from "@react-three/drei";
import { Euler, LinearFilter, MathUtils, NearestFilter, Object3D, Quaternion, SRGBColorSpace, Vector3, type Group, type InstancedMesh, type PerspectiveCamera, type Texture } from "three";
import type { OrbitControls as OrbitControlsInstance } from "three-stdlib";
import type { Artwork } from "@/data/artworks";
import "./ExhibitionScene.css";

export type ExhibitionSceneProps = {
  artworks: Artwork[];
  selectedSlug: string | null;
  paused: boolean;
  reducedMotion: boolean;
  resetKey: number;
  onSelectArtwork: (slug: string) => void;
  onClearFocus: () => void;
  onReady: () => void;
  onUnavailable: () => void;
};

type FramePlacement = {
  artwork: Artwork;
  position: Vector3;
  rotation: [number, number, number];
  normal: Vector3;
  width: number;
  height: number;
};

class SceneBoundary extends Component<{ children: ReactNode; onUnavailable: (cause?: string | Error) => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { this.props.onUnavailable(error); }
  render() { return this.state.failed ? null : this.props.children; }
}

function makePlacements(artworks: Artwork[], sources: Texture[]): FramePlacement[] {
  return artworks.map((artwork, index) => {
    const angle = -0.78 + index * Math.PI * 2 / Math.max(artworks.length, 1);
    const image = sources[index]?.image as { width?: number; height?: number } | undefined;
    const aspect = image?.width && image?.height ? image.width / image.height : artwork.width / artwork.height;
    const width = aspect > 1.4 ? 3.65 : 2.72;
    const height = width / aspect;
    const rotation: [number, number, number] = [0, 0.16 + Math.sin(angle) * 0.27, index % 2 ? -0.035 : 0.035];
    const quaternion = new Quaternion().setFromEuler(new Euler(...rotation));
    return {
      artwork, width, height, rotation,
      position: new Vector3(Math.sin(angle) * 4.6, Math.cos(angle) < 0 ? 1.85 : 0.25 + index * 0.2, Math.cos(angle) * 4.6),
      normal: new Vector3(0, 0, 1).applyQuaternion(quaternion),
    };
  });
}

function ArtworkFrame({ placement, texture, selected, animate, reducedMotion, onSelect }: {
  placement: FramePlacement; texture: Texture; selected: boolean; animate: boolean; reducedMotion: boolean; onSelect: (slug: string) => void;
}) {
  const { artwork, position, rotation, width, height } = placement;
  const { gl } = useThree();
  const frame = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const phase = position.x * 0.5 + position.z;
  const time = useRef(phase);
  useFrame((_, delta) => {
    if (!frame.current) return;
    if (animate) time.current += Math.min(delta, 0.05);
    const float = !reducedMotion && !selected ? Math.sin(time.current * 0.65) * 0.055 : 0;
    const lift = hovered && !selected ? 0.12 : 0;
    frame.current.position.y = reducedMotion ? position.y + lift : MathUtils.damp(frame.current.position.y, position.y + float + lift, 7, delta);
  });

  useEffect(() => {
    if (!hovered) return;
    const canvas = gl.domElement;
    canvas.style.setProperty("cursor", "pointer");
    return () => { canvas.style.setProperty("cursor", "grab"); };
  }, [gl, hovered]);

  const click = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (event.delta < 5) onSelect(artwork.slug);
  };
  const border = 0.125;
  const highlighted = selected || hovered;
  return <group ref={frame} position={position} rotation={rotation}
    onClick={click}
    onPointerOver={(event) => { event.stopPropagation(); setHovered(true); }}
    onPointerOut={() => setHovered(false)}>
    <mesh position={[0, 0, -0.065]}>
      <boxGeometry args={[width + border * 2, height + border * 2, 0.19]} />
      <meshStandardMaterial color="#343fee" roughness={0.25} metalness={0.18} emissive="#2946ff" emissiveIntensity={highlighted ? 0.24 : 0.04} />
    </mesh>
    <mesh position={[0, 0, 0.038]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial color={artwork.color} toneMapped={false} />
    </mesh>
    <mesh position={[0, 0, 0.043]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} transparent alphaTest={0.008} toneMapped={false} />
    </mesh>
    {[[-width / 2 - border / 2, 0, border, height + border * 2], [width / 2 + border / 2, 0, border, height + border * 2], [0, height / 2 + border / 2, width, border], [0, -height / 2 - border / 2, width, border]].map(([x, y, railWidth, railHeight], index) =>
      <mesh key={index} position={[x, y, 0.062]}>
        <boxGeometry args={[railWidth, railHeight, 0.10]} />
        <meshStandardMaterial color={highlighted ? "#475bff" : "#353ef1"} roughness={0.22} metalness={0.12} emissive="#3b51ff" emissiveIntensity={highlighted ? 0.3 : 0.035} />
      </mesh>)}
    <mesh position={[0, height / 2 + border * 0.82, 0.092]}>
      <boxGeometry args={[width + border * 1.6, 0.026, 0.025]} />
      <meshBasicMaterial color={highlighted ? "#d6ffff" : "#8297ff"} toneMapped={false} />
    </mesh>
    {highlighted && <mesh position={[0, 0, -0.05]}>
      <boxGeometry args={[width + border * 2.6, height + border * 2.6, 0.02]} />
      <meshBasicMaterial color="#96fbfb" transparent opacity={0.42} depthWrite={false} />
    </mesh>}
  </group>;
}

function ContextWatcher({ onUnavailable }: { onUnavailable: (reason?: string | Error) => void }) {
  const { gl } = useThree();
  useEffect(() => {
    const onLost = (event: Event) => { event.preventDefault(); onUnavailable("WebGL context was lost."); };
    gl.domElement.addEventListener("webglcontextlost", onLost);
    return () => gl.domElement.removeEventListener("webglcontextlost", onLost);
  }, [gl, onUnavailable]);
  return null;
}

function GlassInstallation({ simplified }: { simplified: boolean }) {
  const steps = [3.4, 2.72, 2.04, 1.36, 0.68];
  return <group position={[0.15, -1.85, -0.15]} rotation={[0, -0.2, 0]}>
    {steps.map((height, index) => <group key={index} position={[-2.1 + index * 1.02, height / 2, 0]}>
      <mesh>
        <boxGeometry args={[1.0, height, 1.35]} />
        <meshPhysicalMaterial color="#75c7da" roughness={0.1} metalness={0.04}
          transmission={simplified ? 0 : 0.32} transparent opacity={simplified ? 0.42 : 0.62}
          thickness={1.05} ior={1.25} clearcoat={0.8} envMapIntensity={1.5} depthWrite={false} />
        <Edges color="#e6ffff" threshold={20} />
      </mesh>
      <mesh position={[0, height / 2 + 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.98, 1.32]} />
        <meshBasicMaterial color="#d9ffff" transparent opacity={0.26} depthWrite={false} />
      </mesh>
    </group>)}
    <mesh position={[-0.1, -0.055, 0]}>
      <boxGeometry args={[5.35, 0.075, 1.7]} />
      <meshPhysicalMaterial color="#a5e7e8" roughness={0.16} transparent opacity={0.25} metalness={0.05} depthWrite={false} />
      <Edges color="#dbffff" />
    </mesh>
  </group>;
}

const crystalData: { position: [number, number, number]; scale: [number, number, number]; color: string }[] = [
  { position: [-4.6, 3.8, -1.3], scale: [0.42, 0.86, 0.42], color: "#b39ce6" },
  { position: [3.65, 4.4, 1.8], scale: [0.64, 1.25, 0.64], color: "#b1e455" },
  { position: [5.7, 3.55, -1.3], scale: [0.35, 0.83, 0.35], color: "#44c4ae" },
  { position: [-5.4, 0.85, 3.1], scale: [0.48, 0.85, 0.48], color: "#49c8b4" },
  { position: [-0.65, 2.7, -1.9], scale: [0.27, 0.57, 0.27], color: "#8fe44e" },
  { position: [1.45, 0.8, 2.45], scale: [0.46, 0.84, 0.46], color: "#85dc42" },
  { position: [-1.9, -0.05, 4.95], scale: [0.43, 0.74, 0.43], color: "#8cdf3e" },
  { position: [5.75, -0.7, 2.35], scale: [0.36, 0.73, 0.36], color: "#c2e766" },
  { position: [-3.25, -0.85, 0.5], scale: [0.45, 0.81, 0.45], color: "#f2a5d8" },
  { position: [5.0, 1.4, -5.1], scale: [0.43, 0.85, 0.43], color: "#e6c0fa" },
  { position: [0.35, 0.85, -0.25], scale: [0.2, 0.37, 0.2], color: "#bfed5f" },
  { position: [-5.6, 4.35, 4.8], scale: [0.19, 0.39, 0.19], color: "#aab4ef" },
];

function Crystals({ animate, simplified }: { animate: boolean; simplified: boolean }) {
  const crystals = useRef<Group>(null);
  const time = useRef(0);
  useFrame((_, delta) => {
    if (!animate || !crystals.current) return;
    time.current += Math.min(delta, 0.05);
    crystals.current.children.forEach((crystal, index) => {
      crystal.position.y = crystalData[index].position[1] + Math.sin(time.current * 0.7 + index * 1.9) * 0.11;
      crystal.rotation.y = index * 0.45 + time.current * 0.07;
    });
  });
  return <group ref={crystals}>
    {crystalData.slice(0, simplified ? 8 : crystalData.length).map((crystal, index) => <mesh key={index} position={crystal.position} scale={crystal.scale} rotation={[0, index * 0.45, 0]}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color={crystal.color} roughness={0.48} metalness={0.02} flatShading />
    </mesh>)}
  </group>;
}

function SquareDust({ animate, simplified }: { animate: boolean; simplified: boolean }) {
  const mesh = useRef<InstancedMesh>(null);
  const count = simplified ? 55 : 135;
  useLayoutEffect(() => {
    if (!mesh.current) return;
    const transform = new Object3D();
    for (let index = 0; index < count; index++) {
      const random = (seed: number) => MathUtils.euclideanModulo(Math.sin(seed * 12.9898) * 43758.5453, 1);
      transform.position.set((random(index + 1) - 0.5) * 18, (random(index + 31) - 0.5) * 11, (random(index + 73) - 0.5) * 15);
      transform.scale.setScalar(index % 13 === 0 ? 0.045 : 0.017);
      transform.updateMatrix();
      mesh.current.setMatrixAt(index, transform.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.computeBoundingSphere();
  }, [count]);
  useFrame((_, delta) => { if (animate && mesh.current) mesh.current.rotation.y += Math.min(delta, 0.05) * 0.008; });
  return <instancedMesh ref={mesh} args={[undefined, undefined, count]} raycast={() => null}>
    <boxGeometry args={[1, 1, 1]} />
    <meshBasicMaterial color="#5878ff" transparent opacity={0.55} depthWrite={false} toneMapped={false} />
  </instancedMesh>;
}

function CameraRig({ placements, selectedSlug, paused, reducedMotion, resetKey, active }: {
  placements: FramePlacement[]; selectedSlug: string | null; paused: boolean; reducedMotion: boolean; resetKey: number; active: boolean;
}) {
  const controls = useRef<OrbitControlsInstance>(null);
  const { camera, size, invalidate } = useThree();
  const destination = useRef({ position: new Vector3(), target: new Vector3(), moving: true });
  const interacting = useRef(false);
  const lastInteraction = useRef(-10000);

  useEffect(() => {
    const perspective = camera as PerspectiveCamera;
    const halfFov = Math.tan(MathUtils.degToRad(perspective.fov) / 2);
    const aspect = Math.max(size.width / Math.max(size.height, 1), 0.25);
    const placement = placements.find((frame) => frame.artwork.slug === selectedSlug);
    if (placement) {
      const distance = Math.max((placement.width + 0.4) / (2 * halfFov * aspect), (placement.height + 0.4) / (2 * halfFov)) * 1.16 + 0.15;
      destination.current.target.copy(placement.position);
      destination.current.position.copy(placement.position).addScaledVector(placement.normal, distance);
    } else {
      const distance = Math.max(13.8 / (2 * halfFov * aspect), 9.1 / (2 * halfFov)) * 1.07;
      destination.current.target.set(0, 0.85, 0);
      destination.current.position.copy(destination.current.target).addScaledVector(new Vector3(0.32, 0.235, 0.918).normalize(), distance);
    }
    destination.current.moving = true;
    interacting.current = false;
    if (reducedMotion && controls.current) {
      camera.position.copy(destination.current.position);
      controls.current.target.copy(destination.current.target);
      controls.current.update();
      destination.current.moving = false;
    }
    invalidate();
  }, [camera, invalidate, placements, reducedMotion, resetKey, selectedSlug, size.height, size.width]);

  useFrame((_, delta) => {
    const orbit = controls.current;
    if (!orbit) return;
    orbit.autoRotate = active && !paused && !reducedMotion && !selectedSlug && !interacting.current && !destination.current.moving && performance.now() - lastInteraction.current > 3000;
    if (!active || interacting.current || !destination.current.moving) return;
    const factor = reducedMotion ? 1 : 1 - Math.exp(-Math.min(delta, 0.06) * 5.5);
    camera.position.lerp(destination.current.position, factor);
    orbit.target.lerp(destination.current.target, factor);
    orbit.update();
    if (camera.position.distanceToSquared(destination.current.position) < 0.00015 && orbit.target.distanceToSquared(destination.current.target) < 0.00015) {
      camera.position.copy(destination.current.position);
      orbit.target.copy(destination.current.target);
      destination.current.moving = false;
    } else invalidate();
  });

  return <OrbitControls ref={controls} makeDefault enablePan={false} enableZoom enableRotate enableDamping
    dampingFactor={0.07} rotateSpeed={0.5} zoomSpeed={0.68} autoRotateSpeed={0.28}
    minDistance={1.8} maxDistance={80} minPolarAngle={0.26} maxPolarAngle={Math.PI - 0.26}
    onStart={() => { interacting.current = true; destination.current.moving = false; if (controls.current) controls.current.autoRotate = false; }}
    onEnd={() => { interacting.current = false; lastInteraction.current = performance.now(); invalidate(); }} />;
}

function ExhibitionWorld({ artworks, selectedSlug, paused, reducedMotion, resetKey, onSelectArtwork, onReady, active, simplified }:
  Omit<ExhibitionSceneProps, "onClearFocus" | "onUnavailable"> & { active: boolean; simplified: boolean }) {
  const sources = useTexture(artworks.map((artwork) => artwork.frameImage ?? artwork.coverImage));
  const textures = useMemo(() => sources.map((source, index) => {
    const texture = source.clone();
    const pixel = artworks[index].category === "Pixel art";
    texture.colorSpace = SRGBColorSpace;
    texture.magFilter = pixel ? NearestFilter : LinearFilter;
    texture.minFilter = pixel ? NearestFilter : LinearFilter;
    texture.generateMipmaps = !pixel;
    texture.needsUpdate = true;
    return texture;
  }), [artworks, sources]);
  useEffect(() => () => textures.forEach((texture) => texture.dispose()), [textures]);
  const placements = useMemo(() => makePlacements(artworks, sources), [artworks, sources]);
  const animate = active && !paused && !reducedMotion;
  useEffect(() => {
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(onReady);
    });
    return () => cancelAnimationFrame(frame);
  }, [onReady]);
  return <>
    <ambientLight intensity={1.35} color="#e3ffff" />
    <directionalLight position={[-5, 9, 7]} intensity={2.5} color="#ffffff" />
    <directionalLight position={[4, 3, -4]} intensity={1.15} color="#94dcff" />
    <Environment resolution={simplified ? 64 : 128} frames={1} environmentIntensity={0.7}>
      <Lightformer form="rect" intensity={3} color="#e6ffff" position={[-4, 7, 3]} scale={[10, 6, 1]} rotation={[Math.PI / 3, 0, 0]} />
      <Lightformer form="rect" intensity={2} color="#87e8ff" position={[7, 1, -2]} scale={[5, 7, 1]} rotation={[0, -Math.PI / 2, 0]} />
    </Environment>
    <GlassInstallation simplified={simplified} />
    <Crystals animate={animate} simplified={simplified} />
    <SquareDust animate={animate} simplified={simplified} />
    {placements.map((placement, index) => <ArtworkFrame key={placement.artwork.slug} placement={placement} texture={textures[index]} selected={selectedSlug === placement.artwork.slug} animate={animate} reducedMotion={reducedMotion} onSelect={onSelectArtwork} />)}
    <CameraRig placements={placements} selectedSlug={selectedSlug} paused={paused} reducedMotion={reducedMotion} resetKey={resetKey} active={active} />
  </>;
}

export default function ExhibitionScene(props: ExhibitionSceneProps) {
  const container = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onUnavailable: props.onUnavailable, onReady: props.onReady });
  useEffect(() => { callbacks.current = { onUnavailable: props.onUnavailable, onReady: props.onReady }; }, [props.onUnavailable, props.onReady]);
  const failureReported = useRef(false);
  const readyReported = useRef(false);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [simplified, setSimplified] = useState(false);
  const [inView, setInView] = useState(true);
  const [visible, setVisible] = useState(true);
  const pointerDown = useRef({ x: 0, y: 0 });
  const missedAllowed = useRef(true);
  const writeDiagnostics = useCallback((status: string, error?: string) => {
    const element = container.current;
    if (!element) return;
    // Keep a copy on the host after it replaces this Canvas with the 2D gallery.
    [element, element.parentElement].forEach((target) => {
      target?.setAttribute("data-render-status", status);
      if (error) target?.setAttribute("data-render-error", error);
      else target?.removeAttribute("data-render-error");
    });
  }, []);
  const reportUnavailable = useCallback((cause: string | Error = "WebGL rendering is unavailable.") => {
    if (failureReported.current) return;
    failureReported.current = true;
    const message = cause instanceof Error ? `${cause.name}: ${cause.message}` : cause;
    writeDiagnostics("unavailable", message);
    console.warn("ARTVERSE 3D:", message);
    callbacks.current.onUnavailable();
  }, [writeDiagnostics]);
  const reportReady = useCallback(() => {
    if (readyReported.current || failureReported.current) return;
    readyReported.current = true;
    writeDiagnostics("ready");
    callbacks.current.onReady();
  }, [writeDiagnostics]);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 900px)");
    const updateSize = () => setSimplified(query.matches);
    const updateVisibility = () => setVisible(!document.hidden);
    const initialFrame = requestAnimationFrame(() => {
      updateSize();
      updateVisibility();
      const testCanvas = document.createElement("canvas");
      let contextFailure = "";
      testCanvas.addEventListener("webglcontextcreationerror", (event) => { contextFailure = (event as WebGLContextEvent).statusMessage; });
      try {
        const context = testCanvas.getContext("webgl2");
        setSupported(Boolean(context));
        if (!context) reportUnavailable(`WebGL 2 context creation returned null.${contextFailure ? ` ${contextFailure}` : ""}`);
        else writeDiagnostics("webgl-supported");
        context?.getExtension("WEBGL_lose_context")?.loseContext();
      } catch (error) { setSupported(false); reportUnavailable(error instanceof Error ? error : "WebGL capability check failed."); }
    });
    query.addEventListener("change", updateSize);
    document.addEventListener("visibilitychange", updateVisibility);
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    if (container.current) observer.observe(container.current);
    const element = container.current;
    const preventPageZoom = (event: WheelEvent) => { event.preventDefault(); event.stopPropagation(); };
    element?.addEventListener("wheel", preventPageZoom, { passive: false });
    return () => {
      cancelAnimationFrame(initialFrame);
      query.removeEventListener("change", updateSize);
      document.removeEventListener("visibilitychange", updateVisibility);
      observer.disconnect();
      element?.removeEventListener("wheel", preventPageZoom);
    };
  }, [reportUnavailable, writeDiagnostics]);

  const active = inView && visible;
  return <div ref={container} className="exhibition-scene" data-render-status="checking" style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", touchAction: "none" }}>
    {supported && <SceneBoundary onUnavailable={reportUnavailable}>
      <Canvas camera={{ position: [8, 5.8, 19], fov: 43, near: 0.1, far: 90 }}
        style={{ width: "100%", height: "100%", touchAction: "none" }}
        dpr={simplified ? [1, 1.25] : [1, 1.5]} frameloop={active && !props.paused && !props.reducedMotion ? "always" : "demand"}
        gl={{ alpha: true, antialias: !simplified, powerPreference: "low-power" }}
        fallback="Your browser is showing the artwork gallery without 3D."
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.domElement.style.touchAction = "none";
          writeDiagnostics("renderer-created");
        }}
        onPointerDown={(event) => { pointerDown.current = { x: event.clientX, y: event.clientY }; missedAllowed.current = true; }}
        onPointerMove={(event) => { if (event.buttons && Math.hypot(event.clientX - pointerDown.current.x, event.clientY - pointerDown.current.y) >= 5) missedAllowed.current = false; }}
        onPointerUp={(event) => { missedAllowed.current = missedAllowed.current && Math.hypot(event.clientX - pointerDown.current.x, event.clientY - pointerDown.current.y) < 5; }}
        onPointerMissed={() => { if (missedAllowed.current && props.selectedSlug) props.onClearFocus(); }}
        role="img" aria-label="Interactive floating exhibition of original artwork in electric blue frames, surrounded by cyan glass stairs and colorful crystals">
        <ContextWatcher onUnavailable={reportUnavailable} />
        <Suspense fallback={null}>
          <ExhibitionWorld artworks={props.artworks} selectedSlug={props.selectedSlug} paused={props.paused} reducedMotion={props.reducedMotion} resetKey={props.resetKey} onSelectArtwork={props.onSelectArtwork} onReady={reportReady} active={active} simplified={simplified} />
        </Suspense>
      </Canvas>
    </SceneBoundary>}
  </div>;
}
