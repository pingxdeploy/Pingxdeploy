import React, { useEffect, useRef, useState } from 'react';
import { initAudio, playHoverSound, playClickSound, setPhaseSound } from './AudioManager';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, MeshTransmissionMaterial, MeshDistortMaterial } from '@react-three/drei';
import { EffectComposer, Bloom, Noise } from '@react-three/postprocessing';
import { motion, useScroll, useSpring, useMotionValue, AnimatePresence } from 'framer-motion';
import Lenis from '@studio-freight/lenis';
import { ArrowRight } from 'lucide-react';
import * as THREE from 'three';
import logoUrl from './assets/logo.png';
import manacVideo from './assets/manac_screenrecord.mp4';
import restaurantVideo from './assets/restaurant_record.mp4';
import manacVideo2 from './assets/Manac_infotech.mp4';
import introVideo from './assets/intro.mp4';

// --- Custom Magnetic Button Component ---
const MagneticButton = ({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { damping: 15, stiffness: 150 });
  const springY = useSpring(y, { damping: 15, stiffness: 150 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    x.set((clientX - centerX) * 0.4);
    y.set((clientY - centerY) * 0.4);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handleMouseEnter = () => {
    playHoverSound();
  };

  const handleClick = () => {
    initAudio();
    playClickSound();
    if (onClick) onClick();
  };

  return (
    <motion.button
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      className={className}
      onClick={handleClick}
    >
      {children}
    </motion.button>
  );
};

// --- Custom Fresnel Glow Shader (Apple / Awwwards Cinematic Eclipse Halo) ---
const FresnelShader = {
  uniforms: {
    uTime: { value: 0 },
    uGlowColor: { value: new THREE.Color('#c2a688') },
    uRimPower: { value: 5.0 },
    uRimIntensity: { value: 3.0 },
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec3 vWorldNormal;
    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vNormal = normalize(normalMatrix * normal);
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 uGlowColor;
    uniform float uRimPower;
    uniform float uRimIntensity;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec3 vWorldNormal;
    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);
      
      // Fresnel edge term
      float intensity = pow(1.0 - max(0.0, dot(normal, viewDir)), uRimPower) * uRimIntensity;
      
      // Vertical gradient: slightly stronger golden rim glow at the bottom edge
      float bottomBoost = max(0.0, -vWorldNormal.y) * 1.5;
      
      gl_FragColor = vec4(uGlowColor, intensity + bottomBoost * intensity * 0.45);
    }
  `
};

// --- 6-STAGE MULTI-MESH SCROLL-MORPHING 3D SCULPTURE ---
// Evolving one single core energy object through 6 distinct structural and emotional phases on scroll:
// 1. Origin Orb, 2. Fracture Shards, 3. Neural Plexus, 4. Crystal Octahedron, 5. Silk Wave Fluid, 6. Transcendence Rings.
const CinematicSculpture3D = ({ scrollProgress }: { scrollProgress: any }) => {
  const groupRef = useRef<THREE.Group>(null);

  // 6 separate mesh/group references
  const sphereRef = useRef<THREE.Group>(null);
  const geodeRef = useRef<THREE.Group>(null);
  const shardsRef = useRef<THREE.Group>(null);
  const cubeRef = useRef<THREE.Mesh>(null);
  const fluidRef = useRef<THREE.Mesh>(null);
  const puddleRef = useRef<THREE.Group>(null);

  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const { viewport } = useThree();

  // Dynamic responsive horizontal positioning gap based on viewport width
  const rightX = viewport.width > 12 ? 3.0 : viewport.width > 8 ? 2.0 : 1.2;

  const zoomProgress = useRef(0);
  const { camera } = useThree();
  useFrame((state, delta) => {
    const scroll = scrollProgress.get();
    const t = state.clock.elapsedTime;

    // Initial camera zoom from far to normal view
    if (zoomProgress.current < 1) {
      const startZ = 15;
      const endZ = 6.5;
      camera.position.z = THREE.MathUtils.lerp(startZ, endZ, zoomProgress.current);
      zoomProgress.current = Math.min(1, zoomProgress.current + delta * 0.5);
    }


    // 1. DYNAMIC RESPONSIVE POSITIONING & SCALING FOR EACH SECTION
    let targetX = 0.0;
    let targetY = 0.0;

    // Responsive scaling and positioning for mobile devices
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    // On mobile, keep it centered. On desktop, push it to the right 
    const alignX = isMobile ? 0 : rightX * 1.5;
    const scaleFactor = isMobile ? 0.28 : 0.45; // Shrink geometries globally

    if (scroll < 0.16) {
      // Hero (Origin): Keep Right
      targetX = alignX;
      targetY = isMobile ? -1.0 : 0.0; // Push down slightly on mobile so it doesn't block hero text
    } else if (scroll < 0.35) {
      // About (Fracture): Keep Right
      targetX = alignX;
      const p = (scroll - 0.16) / (0.35 - 0.16);
      targetY = THREE.MathUtils.lerp(isMobile ? -1.0 : 0.0, -0.2, p);
    } else if (scroll < 0.55) {
      // Services (Network): Keep Right
      targetX = alignX;
      const p = (scroll - 0.35) / (0.55 - 0.35);
      targetY = THREE.MathUtils.lerp(-0.2, 0.2, p);
    } else if (scroll < 0.75) {
      // Projects (Crystallization): Keep Right
      targetX = alignX;
      const p = (scroll - 0.55) / (0.75 - 0.55);
      targetY = THREE.MathUtils.lerp(0.2, 0.0, p);
    } else if (scroll < 0.88) {
      // Process (Organic Fluid): Keep Right
      targetX = alignX;
      const p = (scroll - 0.75) / (0.88 - 0.75);
      targetY = THREE.MathUtils.lerp(0.0, -0.3, p);
    } else {
      // Contact (Transcendence): Return to Center
      const p = (scroll - 0.88) / (1.0 - 0.88);
      targetX = THREE.MathUtils.lerp(alignX, 0.0, p);
      targetY = THREE.MathUtils.lerp(-0.3, 0.5, p);
    }

    // Apply smooth linear interpolation to main container group
    if (groupRef.current) {
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.06);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.06);

      // Gentle floating levitation motion
      groupRef.current.position.y += Math.sin(t * 0.8) * 0.015;

      // Infinite minimal Y rotation
      groupRef.current.rotation.y = t * 0.05;
    }

    // 2. CONTINUOUS GAUSSIAN-STYLE MORPH WEIGHTS (PREVENTING SUDDEN SWAPPING POPPING)
    // Dynamic transition weights blending opacities and sizes between components
    const wHero = Math.max(0, 1 - scroll / 0.16);                     // Hero
    const wAbout = Math.max(0, 1 - Math.abs(scroll - 0.25) / 0.1);    // About
    const wServices = Math.max(0, 1 - Math.abs(scroll - 0.45) / 0.1); // Services
    const wProjects = Math.max(0, 1 - Math.abs(scroll - 0.65) / 0.1); // Projects
    const wProcess = Math.max(0, 1 - Math.abs(scroll - 0.8) / 0.1);   // Process
    const wContact = Math.max(0, 1 - Math.abs(scroll - 0.95) / 0.1);  // Contact

    // 3. SCALE GROUPS GRADUALLY TO PREVENT VISUAL ARTIFACTS
    if (sphereRef.current) sphereRef.current.scale.setScalar(wHero * 5.5 * scaleFactor);
    // Geode scales to exact same size as the glassy sphere for a seamless material morph
    if (geodeRef.current) geodeRef.current.scale.setScalar(wAbout * 5.5 * scaleFactor);
    // 3rd phase expands seamlessly into the space created by the 2nd phase explosion
    // TRANSITION: At the end of its phase, it blasts exponentially to kill the screen
    let scale3 = 0;
    if (scroll <= 0.45) {
      scale3 = wServices * 6.0 * scaleFactor;
    } else if (scroll < 0.58) {
      const pBlast = (scroll - 0.45) / 0.13; // 0.0 to 1.0
      scale3 = (6.0 + Math.pow(pBlast, 4) * 100.0) * scaleFactor; // Explode massive enough to engulf the camera
    } else {
      scale3 = 0;
    }
    if (shardsRef.current) shardsRef.current.scale.setScalar(scale3);
    // Use an ease-out curve for the diamond so it smoothly transitions out of the blast
    const smoothProjectsScale = wProjects * (2 - wProjects) * 9.0 * scaleFactor;
    if (cubeRef.current) cubeRef.current.scale.setScalar(smoothProjectsScale);
    // Transition 4 to 5: The glass crystal smoothly melts into the organic fluid blob
    if (fluidRef.current) fluidRef.current.scale.setScalar(wProcess * 9.0 * scaleFactor);
    // 6. FINALE: Transcendence Phase (Liquid Gold Meltdown)
    if (puddleRef.current) {
      // The liquid gold splash scales up as the 6th phase
      const baseScale = wContact * 9.0 * scaleFactor;

      // As the user scrolls deep into the 6th phase, it drops and stretches
      const meltProgress = Math.min(1.0, Math.max(0, (scroll - 0.85) / 0.15));
      const scaleY = baseScale * (0.2 + meltProgress * 0.8); // Drop stretches up
      const scaleXZ = baseScale * (1.0 + meltProgress * 3.0); // Puddle spreads wide

      puddleRef.current.scale.set(scaleXZ, scaleY, scaleXZ);
      puddleRef.current.position.y = -meltProgress * 5.5; // Gravity drop to bottom screen edge
    }

    // 4. ANIMATE SHARDS RADIAL ZERO-GRAVITY EXPLOSION (FRACTURING EFFECT)
    if (geodeRef.current) {
      const pFracture = Math.min(1.0, Math.max(0.0, (scroll - 0.16) / (0.35 - 0.16)));
      geodeRef.current.children.forEach((child: any) => {
        if (child.userData && child.userData.dir) {
          const dir = child.userData.dir;
          // Shards fly outwards dynamically
          child.position.x = dir.x * (1.0 + pFracture * 0.8);
          child.position.y = dir.y * (1.0 + pFracture * 0.8);
          child.position.z = dir.z * (1.0 + pFracture * 0.8);
          // Individually spin each chunk for realistic floating look
          child.rotation.x = t * 0.15 + dir.x * 2.0;
          child.rotation.y = t * 0.1 + dir.y * 2.0;
        }
      });
      geodeRef.current.rotation.y = t * 0.18;
    }

    // 5. ROTATE PLEXUS NETWORK
    if (shardsRef.current) {
      shardsRef.current.rotation.y = t * 0.22;
      shardsRef.current.rotation.x = Math.sin(t * 0.3) * 0.12;
    }

    // 6. ROTATE HIGHLY REFRACTIVE CRYSTAL DIAMOND
    if (cubeRef.current) {
      cubeRef.current.rotation.y = t * 0.65;
      cubeRef.current.rotation.x = t * 0.45;
    }

    // 7. HIGH-FIDELITY vertex wave displacement on the fluid silk mesh
    if (fluidRef.current) {
      const geo = fluidRef.current.geometry;
      const pos = geo.attributes.position;
      if (pos) {
        const count = pos.count;
        for (let i = 0; i < count; i++) {
          const x = pos.getX(i);
          const y = pos.getY(i);
          const z = pos.getZ(i);

          // Multi-frequency sine waves to simulate premium flowing liquid ribbon / silk fabric ripples
          const wave = Math.sin(x * 2.2 + t * 2.0) * 0.08 +
            Math.cos(y * 1.8 + t * 1.6) * 0.08 * 0.85 +
            Math.sin(z * 2.6 + t * 1.4) * 0.08 * 0.55;

          const vec = new THREE.Vector3(x, y, z).normalize();
          vec.multiplyScalar(1.0 + wave);
          pos.setXYZ(i, vec.x, vec.y, vec.z);
        }
        pos.needsUpdate = true;
        geo.computeVertexNormals();
      }
      fluidRef.current.rotation.y = t * 0.32;
    }

    // Cursor-tracking responsive spotlight angle
    const mouseX = state.pointer.x * 1.8;
    const mouseY = state.pointer.y * 1.8;
    if (dirLightRef.current) {
      dirLightRef.current.position.x = THREE.MathUtils.lerp(dirLightRef.current.position.x, -3.5 + mouseX, 0.06);
      dirLightRef.current.position.y = THREE.MathUtils.lerp(dirLightRef.current.position.y, 4.5 + mouseY, 0.06);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Premium Cinematic Studio Lighting setup */}
      <ambientLight intensity={1.2} />
      <directionalLight ref={dirLightRef} position={[-3.5, 4.5, 3.5]} intensity={8.0} color="#ffffff" />
      <directionalLight position={[3.5, -4.5, 2.5]} intensity={3.5} color="#ebd9c8" />
      {/* Volumetric center pointlight behind the sculpture for dramatic backlit glare */}
      <pointLight position={[0, 0, -2.2]} intensity={35} color="#c2a688" distance={50} />

      {/* 01. HERO ECLIPSE GLASS SPHERE */}
      <group ref={sphereRef} scale={0}>

        {/* Highly glossy refractive glass outer shell */}
        <mesh>
          <sphereGeometry args={[1.0, 64, 64]} />
          <MeshTransmissionMaterial
            transmission={1.0}
            thickness={1.5}
            roughness={0.05}
            clearcoat={1.0}
            clearcoatRoughness={0.1}
            ior={1.8}
            chromaticAberration={0.06}
            anisotropicBlur={0.1}
          />
        </mesh>

        {/* Custom Fresnel rim-light backing shell */}
        <mesh>
          <sphereGeometry args={[1.03, 64, 64]} />
          <shaderMaterial
            args={[FresnelShader]}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* 02. ABOUT SECTION — FRACTURED GEODE SHARDS */}
      <group ref={geodeRef} scale={0}>

        {/* The Solid Dark Core that solidifies inside the glass */}
        <mesh>
          <icosahedronGeometry args={[0.9, 2]} />
          <meshStandardMaterial color="#050505" roughness={0.7} metalness={0.5} />
        </mesh>

        {/* Glowing Cracks Overlaid on the core */}
        <mesh>
          <icosahedronGeometry args={[0.91, 2]} />
          <meshBasicMaterial color="#c2a688" wireframe transparent opacity={0.6} blending={THREE.AdditiveBlending} />
        </mesh>

        {/* Volumetric core light bleeding through the cracks */}
        <pointLight position={[0, 0, 0]} intensity={25} color="#ebd9c8" distance={6} />

        {/* Suspended Zero-Gravity Shards */}
        {[-1, 1].map((dirX, i) =>
          [-1, 1].map((dirY, j) =>
            [-1, 1].map((dirZ, k) => {
              if (dirX === 0 && dirY === 0 && dirZ === 0) return null;
              const key = `${i}-${j}-${k}`;
              const rx = dirX * 0.6;
              const ry = dirY * 0.6;
              const rz = dirZ * 0.6;

              return (
                <mesh
                  key={key}
                  position={[rx, ry, rz]}
                  rotation={[rx * 2, ry * 2, rz * 2]}
                  userData={{ dir: { x: rx, y: ry, z: rz } }}
                >
                  <dodecahedronGeometry args={[0.3]} />
                  <meshPhysicalMaterial
                    color="#141416"
                    roughness={0.2}
                    metalness={0.9}
                    clearcoat={1.0}
                  />
                </mesh>
              );
            })
          )
        )}
      </group>

      {/* 03. SERVICES — BLACK SHINING ROCKY SPHERE */}
      <group ref={shardsRef} scale={0}>
        <mesh>
          <icosahedronGeometry args={[1.5, 2]} />
          <meshPhysicalMaterial
            color="#1a1a1c"
            metalness={0.8}
            roughness={0.15}
            clearcoat={1.0}
            clearcoatRoughness={0.1}
            flatShading={true}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Golden Fresnel rim-light to dramatically outline the rock against the black background */}
        <mesh>
          <icosahedronGeometry args={[1.52, 2]} />
          <shaderMaterial
            args={[FresnelShader]}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* 04. PROJECTS — CRYSTALLIZATION DIAMOND */}
      <mesh ref={cubeRef} scale={0}>
        <octahedronGeometry args={[1.0]} />
        <MeshTransmissionMaterial
          transmission={1.0}
          thickness={1.5}
          roughness={0.0}
          clearcoat={1.0}
          ior={2.42} /* Exact Index of Refraction for a real Diamond */
          chromaticAberration={0.15}
          anisotropicBlur={0.1}
          color="#ffffff"
          attenuationColor="#ffffff"
          attenuationDistance={2.0}
          backside={true}
        />
        {/* Natural glowing inner core for refraction, no artificial borders */}
        <mesh scale={0.7}>
          <octahedronGeometry args={[1.0]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.0} />
        </mesh>
        {/* Intense internal point light */}
        <pointLight position={[0, 0, 0]} intensity={20} color="#ffffff" distance={5} />
      </mesh>

      {/* 05. PROCESS — ORGANIC WAVE SILK / FLUID */}
      <mesh ref={fluidRef} scale={0}>
        <sphereGeometry args={[1.0, 128, 128]} />
        <MeshDistortMaterial
          color="#050505"
          roughness={0.1}
          metalness={1.0}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
          distort={0.45}
          speed={2.5}
        />
        {/* Subtle internal glow matching the dark luxury theme */}
        <pointLight position={[0, 0, 0]} intensity={5} color="#ebd9c8" distance={4} />
      </mesh>

      {/* 06. FINALE — EXACT GOLD LIQUID CROWN SPLASH */}
      <group ref={puddleRef} scale={0}>
        {/* Base spreading golden puddle - ultra high poly for smooth waves */}
        <mesh position={[0, -0.5, 0]}>
          <cylinderGeometry args={[2.5, 2.5, 0.1, 128, 64]} />
          <MeshDistortMaterial color="#c2a688" roughness={0.0} metalness={1.0} clearcoat={1.0} distort={0.3} speed={2.5} />
        </mesh>

        {/* Central rising/falling drop column */}
        <mesh position={[0, 1.2, 0]} scale={[0.15, 2.5, 0.15]}>
          <sphereGeometry args={[1.0, 128, 128]} />
          <MeshDistortMaterial color="#c2a688" roughness={0.0} metalness={1.0} distort={0.2} speed={1.5} clearcoat={1.0} />
        </mesh>

        {/* Top spherical liquid droplet separating from the column */}
        <mesh position={[0, 3.8, 0]}>
          <sphereGeometry args={[0.3, 64, 64]} />
          <MeshDistortMaterial color="#c2a688" roughness={0.0} metalness={1.0} distort={0.2} speed={3.0} clearcoat={1.0} />
        </mesh>

        {/* The crown splash ring lifting up around the drop */}
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.2, 0.08, 64, 128]} />
          <MeshDistortMaterial color="#c2a688" roughness={0.0} metalness={1.0} distort={0.7} speed={4.0} clearcoat={1.0} />
        </mesh>

        {/* Small floating droplets dynamically splashing outward */}
        <mesh position={[1.5, 1.2, 0]}><sphereGeometry args={[0.08, 32, 32]} /><meshStandardMaterial color="#c2a688" roughness={0} metalness={1} /></mesh>
        <mesh position={[-1.2, 0.8, 1.0]}><sphereGeometry args={[0.05, 32, 32]} /><meshStandardMaterial color="#c2a688" roughness={0} metalness={1} /></mesh>
        <mesh position={[0.5, 1.5, -1.5]}><sphereGeometry args={[0.1, 32, 32]} /><meshStandardMaterial color="#c2a688" roughness={0} metalness={1} /></mesh>
        <mesh position={[-0.8, 2.0, -0.5]}><sphereGeometry args={[0.06, 32, 32]} /><meshStandardMaterial color="#c2a688" roughness={0} metalness={1} /></mesh>
      </group>
    </group>
  );
};

// 04. Selected Projects: Real 3D elements inside portfolio cards
const RotatingMesh = ({ index }: { index: number }) => {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ref.current) {
      ref.current.rotation.y = t * 0.25;
      ref.current.rotation.x = t * 0.1;
    }
  });

  return (
    <Float speed={2} floatIntensity={0.5}>
      <mesh ref={ref} scale={0.85}>
        {index === 0 && (
          <>
            <dodecahedronGeometry />
            <meshStandardMaterial color="#a58c77" roughness={0.1} metalness={0.9} />
            <mesh scale={1.02}>
              <dodecahedronGeometry />
              <meshStandardMaterial color="#ffffff" wireframe transparent opacity={0.2} />
            </mesh>
          </>
        )}
        {index === 1 && (
          <>
            <torusGeometry args={[0.7, 0.25, 16, 100]} />
            <meshStandardMaterial color="#1a1714" roughness={0.05} metalness={0.98} />
            <mesh scale={1.02}>
              <torusGeometry args={[0.7, 0.25, 8, 50]} />
              <meshStandardMaterial color="#a58c77" wireframe transparent opacity={0.4} />
            </mesh>
          </>
        )}
        {index === 2 && (
          <>
            <torusKnotGeometry args={[0.5, 0.16, 100, 16]} />
            <meshStandardMaterial color="#a58c77" roughness={0.1} metalness={0.9} />
            <mesh scale={1.02}>
              <torusKnotGeometry args={[0.5, 0.16, 50, 8]} />
              <meshStandardMaterial color="#ffffff" wireframe transparent opacity={0.25} />
            </mesh>
          </>
        )}
        {index === 3 && (
          <>
            <octahedronGeometry />
            <meshStandardMaterial color="#141210" roughness={0.05} metalness={0.95} />
            <mesh scale={1.02}>
              <octahedronGeometry />
              <meshStandardMaterial color="#a58c77" wireframe transparent opacity={0.35} />
            </mesh>
          </>
        )}
      </mesh>
    </Float>
  );
};

const PortfolioCard3D = ({ index, introState }: { index: number, introState: string }) => {
  return (
    <Canvas camera={{ position: [0, 0, 3] }} frameloop={introState === 'completed' ? 'always' : 'never'}>
      <ambientLight intensity={0.25} />
      <pointLight position={[2, 2, 2]} intensity={4} color="#d4c8be" />
      <RotatingMesh index={index} />
    </Canvas>
  );
};

// Far Left Vertical Navigation Rail


export default function App() {
  const { scrollYProgress } = useScroll();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [introState, setIntroState] = useState<'pending' | 'playing' | 'completed'>('pending');
  const introVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const handleGlobalClick = () => {
      initAudio();
    };
    window.addEventListener('click', handleGlobalClick, { once: true });
    window.addEventListener('touchstart', handleGlobalClick, { once: true });
    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('touchstart', handleGlobalClick);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      let phase = 1;
      if (latest >= 0.16 && latest < 0.35) phase = 2;
      else if (latest >= 0.35 && latest < 0.55) phase = 3;
      else if (latest >= 0.55 && latest < 0.75) phase = 4;
      else if (latest >= 0.75 && latest < 0.88) phase = 5;
      else if (latest >= 0.88) phase = 6;
      setPhaseSound(phase);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  return (
    <>
      <AnimatePresence>
        {introState !== 'completed' && (
          <motion.div
            key="intro"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden"
          >
            <video
              ref={introVideoRef}
              src={introVideo}
              className={`absolute inset-0 w-full h-full object-contain md:object-cover transition-opacity duration-1000 ${introState === 'playing' ? 'opacity-100' : 'opacity-0'}`}
              onEnded={() => setIntroState('completed')}
              playsInline
            />

            {introState === 'pending' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                <button
                  onClick={() => {
                    initAudio();
                    setIntroState('playing');
                    if (introVideoRef.current) {
                      introVideoRef.current.play().catch(e => console.error("Video play failed:", e));
                    }
                  }}
                  className="px-8 py-3 tracking-[0.3em] uppercase text-xs font-mono border border-white/20 text-white/70 hover:bg-white hover:text-black hover:border-white transition-all duration-500 rounded-sm"
                >
                  Enter Experience
                </button>
              </div>
            )}

            {introState === 'playing' && (
              <button
                onClick={() => setIntroState('completed')}
                className="absolute bottom-8 right-8 text-white/50 hover:text-white uppercase tracking-widest text-[10px] font-mono z-[10000] transition-colors"
              >
                Skip Intro
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`bg-luxury-black text-[#f5f2eb] relative font-sans selection:bg-luxury-gold/30 overflow-hidden ${introState !== 'completed' ? 'h-screen' : ''}`}>
        <div className="grain-overlay"></div>
        {/* SINGLE FIXED BACKGROUND FULL-SCREEN 3D SCENE */}
        <div className="fixed inset-0 z-0 pointer-events-none opacity-85">
          <Canvas camera={{ position: [0, 0, 6.5] }} frameloop={introState === 'completed' ? 'always' : 'never'}>
            <ambientLight intensity={0.25} />
            <CinematicSculpture3D scrollProgress={scrollYProgress} />
            <EffectComposer>
              <Bloom luminanceThreshold={0.1} mipmapBlur intensity={1.5} />
              <Noise opacity={0.04} />
            </EffectComposer>
          </Canvas>
        </div>

        {/* HEADER */}
        <header className="fixed top-0 w-full z-50 py-4 md:py-6 bg-transparent" style={{ mixBlendMode: 'screen' }}>
          <div className="max-w-7xl mx-auto px-6 md:px-16 flex justify-between items-center">
            <div className="relative flex items-center h-20 md:h-24">
              {/* Base image */}
              <img
                src={logoUrl}
                alt="Ping Deploy Logo"
                className="h-full w-auto object-contain"
              />
              {/* Screen blended copies to exponentially brighten the gold without lifting the black background */}
              <img
                src={logoUrl}
                alt=""
                className="absolute inset-y-0 left-0 h-full w-auto object-contain"
                style={{ mixBlendMode: 'screen' }}
              />
              <img
                src={logoUrl}
                alt=""
                className="absolute inset-y-0 left-0 h-full w-auto object-contain"
                style={{ mixBlendMode: 'screen' }}
              />
            </div>
            <div className="hidden md:flex gap-12 text-[10px] uppercase tracking-[0.3em] text-white/60 font-medium">
              {['ABOUT', 'CAPABILITIES', 'WORK', 'CREATIONS', 'PROCESS', 'CONTACT'].map((item) => (
                <a
                  key={item}
                  href={item === 'CONTACT' ? 'https://mail.google.com/mail/?view=cm&fs=1&to=pingxdeploy@gmail.com&su=Interested%20in%20website%20with%20us&body=Hi%20Pingxdeploy%20Team%2C%0A%0AWe%20are%20very%20impressed%20by%20your%20work%20and%20would%20love%20to%20discuss%20building%20a%20website%20with%20you.%0A%0AWe%20are%20looking%20for%20a%20premium%2C%20high-performance%20digital%20experience%20that%20can%20help%20drive%20growth%20for%20our%20business.%0A%0APlease%20let%20us%20know%20your%20availability%20for%20an%20initial%20consultation.%0A%0ALooking%20forward%20to%20hearing%20from%20you!' : `#${item.toLowerCase()}`}
                  target={item === 'CONTACT' ? '_blank' : undefined}
                  rel={item === 'CONTACT' ? 'noopener noreferrer' : undefined}
                  className="hover:text-luxury-gold transition-colors duration-300"
                >
                  {item}
                </a>
              ))}
            </div>
            <button
              className="md:hidden w-10 h-10 rounded-full border border-white/10 flex flex-col gap-1 items-center justify-center hover:border-luxury-gold hover:bg-white/[0.02] transition-all duration-300 pointer-events-auto"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className={`w-4 h-[1px] bg-white transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-[2.5px]' : ''}`}></span>
              <span className={`w-4 h-[1px] bg-white transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-[2.5px]' : ''}`}></span>
            </button>
          </div>
        </header>

        {/* MOBILE MENU OVERLAY */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-[#050505] flex flex-col items-center justify-center gap-10 md:hidden">
            {['ABOUT', 'CAPABILITIES', 'WORK', 'CREATIONS', 'PROCESS', 'CONTACT'].map((item) => (
              <a
                key={item}
                href={item === 'CONTACT' ? 'https://mail.google.com/mail/?view=cm&fs=1&to=pingxdeploy@gmail.com&su=Interested%20in%20website%20with%20us' : `#${item.toLowerCase()}`}
                target={item === 'CONTACT' ? '_blank' : undefined}
                rel={item === 'CONTACT' ? 'noopener noreferrer' : undefined}
                className="text-xl uppercase tracking-[0.3em] text-white/80 font-light hover:text-luxury-gold transition-colors duration-300"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item}
              </a>
            ))}
          </div>
        )}


        {/* 01. HERO SECTION — THE ORIGIN */}
        <section id="hero" className="relative min-h-screen flex items-center pt-32 pb-20">
          <div className="relative z-20 max-w-7xl mx-auto px-6 md:px-16 w-full flex justify-between items-center">
            <div className="max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
              >

                <h1 className="text-5xl md:text-[5.5rem] font-serif font-light leading-[1.05] tracking-tight mb-8 pb-2">
                  Premium digital <br />
                  experiences that <br />
                  drive <span className="text-luxury-gold italic font-normal pr-2">growth.</span>
                </h1>
                <p className="text-white/40 text-sm font-light leading-relaxed max-w-sm mb-10">
                  We build fully interactive, high-performance websites engineered to elevate your brand and scale your business.
                </p>

              </motion.div>
            </div>

            <div className="hidden lg:flex flex-col items-center gap-4 text-white/30 self-end mb-16 mr-10 font-mono text-[9px] tracking-[0.3em] uppercase">
              <span className="writing-mode-vertical">SCROLL TO TRIGGER</span>
              <div className="w-[1px] h-10 bg-white/20 relative">
                <span className="absolute bottom-0 left-0 w-1 h-1 rounded-full bg-luxury-gold -translate-x-[1.5px]"></span>
              </div>
            </div>
          </div>
        </section>

        {/* 02. ABOUT SECTION — FRACTURED AWAKENING */}
        <section id="about" className="relative py-24 md:py-32 px-6 md:px-16 border-t border-white/5">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-5">

              <h2 className="text-4xl md:text-6xl font-serif font-light leading-tight mb-8 pb-2">
                Shattering <br />
                traditional <span className="text-luxury-gold italic font-normal pr-2">web design.</span>
              </h2>
              <p className="text-white/40 text-base font-light leading-relaxed mb-10 max-w-md">
                We don't just build websites; we craft immersive digital platforms. By combining stunning aesthetics with seamless interactivity, we capture your audience's attention and convert them into loyal customers.
              </p>

            </div>

            {/* Reserved gap for geode sphere blast */}
            <div className="lg:col-span-4 h-[450px] relative overflow-hidden flex items-center justify-center"></div>

            {/* Right Steps list */}
            <div className="lg:col-span-3 space-y-12">
              {[
                { num: '01', title: 'ENGAGEMENT', desc: 'Interactive designs that keep users on your site longer.' },
                { num: '02', title: 'CONVERSION', desc: 'Strategically built to turn visitors into revenue.' },
                { num: '03', title: 'PREMIUM FEEL', desc: "Luxury aesthetics that elevate your brand's perceived value." }
              ].map((step) => (
                <div key={step.num} className="border-t border-white/5 pt-6 group">
                  <div className="flex gap-4 items-baseline mb-2">
                    <span className="text-[10px] font-mono text-luxury-gold">{step.num}</span>
                    <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-white/80 group-hover:text-luxury-gold transition-colors">{step.title}</h4>
                  </div>
                  <p className="text-white/40 text-xs font-light leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 03. SERVICES SECTION — NETWORK INTELLIGENCE */}
        <section id="capabilities" className="relative py-24 md:py-32 px-6 md:px-16 bg-[#201d18]/10 border-t border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-12 gap-16 items-center mb-16">
              <div className="lg:col-span-5">

                <h2 className="text-4xl md:text-6xl font-serif font-light mb-8 pb-2">
                  Engineered for <span className="text-luxury-gold italic font-normal pr-2">business scaling.</span>
                </h2>
                <p className="text-white/40 text-base font-light leading-relaxed max-w-md">
                  A beautiful website is only the beginning. We build intelligent digital ecosystems optimized for speed, SEO, and seamless user journeys.
                </p>
              </div>
              {/* Reserved gap for floating shards */}
              <div className="lg:col-span-7 h-[300px] relative overflow-hidden"></div>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                { title: 'INTERACTIVE UI', tag: 'Frontend', desc: 'Next-generation frontend development focused on immersive animations, smooth transitions, and dynamic user experiences that captivate visitors.' },
                { title: 'PERFORMANCE', tag: 'Optimization', desc: 'Lightning-fast load times through advanced caching, modern asset delivery, and code-splitting to ensure perfect retention and conversion rates.' },
                { title: 'SEO MASTERY', tag: 'Growth', desc: 'Built from the ground up with semantic HTML, structured data, and performance metrics to rank higher and drive sustainable organic traffic.' },
                { title: 'SCALABILITY', tag: 'Architecture', desc: 'Robust, future-proof technical architecture ready to handle massive traffic spikes and grow seamlessly alongside your business.' }
              ].map((service, idx) => (
                <div key={service.title} className="p-10 border border-white/5 rounded-xl bg-white/[0.01] hover:border-luxury-gold/25 hover:bg-white/[0.02] transition-all duration-700 group flex flex-col h-full">
                  <div className="flex justify-between items-center mb-8">
                    <span className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-[10px] text-luxury-gold font-mono">
                      {idx + 1}
                    </span>
                    <span className="text-[10px] tracking-widest text-white/30 uppercase font-mono group-hover:text-luxury-gold/70 transition-colors">{service.tag}</span>
                  </div>
                  <h3 className="text-sm uppercase tracking-[0.2em] font-semibold mb-4 group-hover:text-luxury-gold transition-colors">{service.title}</h3>
                  <p className="text-white/40 text-xs font-light leading-relaxed group-hover:text-white/60 transition-colors duration-300 flex-grow">{service.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 04. PROJECTS SECTION — CRYSTALLIZATION */}
        <section id="work" className="relative py-24 md:py-32 px-6 md:px-16 border-t border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-24">
              <div>

                <h2 className="text-4xl md:text-6xl font-serif font-light leading-none pb-2">
                  Solidifying your <br />
                  digital <span className="text-luxury-gold italic font-normal pr-2">presence.</span>
                </h2>
                <p className="text-white/40 text-base font-light leading-relaxed max-w-md mt-6">
                  From high-converting e-commerce storefronts to visually stunning corporate portfolios, we engineer digital experiences that leave a lasting impact and drive measurable results.
                </p>
              </div>
              <button className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:border-luxury-gold hover:text-luxury-gold transition-all duration-300">
                <ArrowRight size={16} />
              </button>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                { title: 'ECOMMERCE', type: 'High Conversion', desc: 'Scalable storefronts engineered to maximize sales and streamline the buying journey.' },
                { title: 'SAAS PLATFORM', type: 'Interactive Dashboard', desc: 'Powerful, intuitive web applications designed for deep user engagement and retention.' },
                { title: 'CORPORATE SITE', type: 'Brand Authority', desc: 'Premium digital footprints that establish industry leadership and trust.' },
                { title: 'PORTFOLIO', type: 'Creative Showcase', desc: 'Visually stunning displays crafted to highlight your best work in unparalleled style.' }
              ].map((p, idx) => (
                <div key={p.title} className="group cursor-pointer">
                  <div className="aspect-[3/4] relative mb-6">
                    <PortfolioCard3D index={idx} introState={introState} />
                  </div>
                  <div className="flex flex-col gap-3 px-1">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold tracking-widest group-hover:text-luxury-gold transition-colors">{p.title}</h3>
                    </div>
                    <p className="text-xs text-white/50 font-light leading-relaxed group-hover:text-white/80 transition-colors duration-300">
                      {p.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* OUR CREATIONS SECTION */}
        <section id="creations" className="relative py-20 md:py-24 px-6 md:px-16 border-t border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-16">
              <div>
                <span className="text-[10px] tracking-[0.3em] text-luxury-gold uppercase font-mono mb-6 block">LIVE DEMOS</span>
                <h2 className="text-4xl md:text-6xl font-serif font-light leading-none">
                  Our <span className="text-luxury-gold italic font-normal">Creations.</span>
                </h2>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="group cursor-pointer">
                <div className="relative overflow-hidden rounded-xl border border-white/10 aspect-video mb-6">
                  {introState === 'completed' && <video src={manacVideo} autoPlay loop muted playsInline className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500"></div>
                </div>
                <div className="px-2">
                  <h3 className="text-xl font-serif tracking-wide group-hover:text-luxury-gold transition-colors">Manac Infotech</h3>
                  <p className="text-sm text-white/40 font-light mt-2">A comprehensive digital solution built to scale operations and enhance client engagement.</p>
                </div>
              </div>

              <div className="group cursor-pointer">
                <div className="relative overflow-hidden rounded-xl border border-white/10 aspect-video mb-6">
                  {introState === 'completed' && <video src={restaurantVideo} autoPlay loop muted playsInline className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500"></div>
                </div>
                <div className="px-2">
                  <h3 className="text-xl font-serif tracking-wide group-hover:text-luxury-gold transition-colors">Premium Restaurant</h3>
                  <p className="text-sm text-white/40 font-light mt-2">An immersive, high-end booking and menu platform designed for luxury dining experiences.</p>
                </div>
              </div>

              <div className="group cursor-pointer">
                <div className="relative overflow-hidden rounded-xl border border-white/10 aspect-video mb-6">
                  {introState === 'completed' && <video src={manacVideo2} autoPlay loop muted playsInline className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500"></div>
                </div>
                <div className="px-2">
                  <h3 className="text-xl font-serif tracking-wide group-hover:text-luxury-gold transition-colors">Manac App</h3>
                  <p className="text-sm text-white/40 font-light mt-2">A sleek, powerful mobile-first interface optimized for seamless user interactions.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 05. PROCESS SECTION — ORGANIC FLOW */}
        <section id="process" className="relative py-16 md:py-20 px-6 md:px-16 bg-[#201d18]/10 border-t border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-12 gap-16 items-center mb-16">
              <div className="lg:col-span-5">

                <h2 className="text-4xl md:text-6xl font-serif font-light mb-8 pb-2">
                  A seamless, tailored <span className="text-luxury-gold italic font-normal pr-2">process.</span>
                </h2>
                <p className="text-white/40 text-base font-light leading-relaxed max-w-md">
                  We adapt to your business needs. Our workflow is fluid and transparent, ensuring that the final product perfectly aligns with your vision and growth targets.
                </p>
              </div>
              {/* Reserved gap for the fluid blob */}
              <div className="lg:col-span-7 h-[100px] relative overflow-hidden flex items-center justify-center"></div>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                { num: '01', title: 'DISCOVER', desc: 'Deep diving into your business goals and audience.' },
                { num: '02', title: 'STRATEGIZE', desc: 'Defining the UX and conversion funnels.' },
                { num: '03', title: 'DEVELOP', desc: 'Engineering interactive, pixel-perfect experiences.' },
                { num: '04', title: 'LAUNCH', desc: 'Deploying and optimizing for immediate impact.' }
              ].map((step) => (
                <div key={step.num} className="p-8 border border-white/5 rounded-xl bg-white/[0.01] group">
                  <span className="text-[10px] font-mono text-luxury-gold block mb-6">{step.num}</span>
                  <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-white/80 group-hover:text-luxury-gold transition-colors mb-4">{step.title}</h4>
                  <p className="text-white/40 text-xs font-light leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 06. CONTACT & FOOTER — TRANSCENDENCE */}
        <section id="contact" className="relative pt-16 pb-32 px-6 md:px-16 border-t border-white/5 text-center bg-transparent">
          {/* Soft volumetric glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-luxury-gold/5 rounded-full blur-[120px] pointer-events-none"></div>

          <div className="max-w-4xl mx-auto relative z-10 mt-32">

            <h2 className="text-4xl md:text-7xl font-serif font-light leading-none mb-12 pb-2">
              Ready to elevate <br />
              your <span className="text-luxury-gold italic font-normal pr-2">business?</span>
            </h2>
            <MagneticButton
              onClick={() => window.open('https://mail.google.com/mail/?view=cm&fs=1&to=pingxdeploy@gmail.com&su=Interested%20in%20website%20with%20us&body=Hi%20Pingxdeploy%20Team%2C%0A%0AWe%20are%20very%20impressed%20by%20your%20work%20and%20would%20love%20to%20discuss%20building%20a%20website%20with%20you.%0A%0AWe%20are%20looking%20for%20a%20premium%2C%20high-performance%20digital%20experience%20that%20can%20help%20drive%20growth%20for%20our%20business.%0A%0APlease%20let%20us%20know%20your%20availability%20for%20an%20initial%20consultation.%0A%0ALooking%20forward%20to%20hearing%20from%20you!', '_blank')}
              className="group flex items-center gap-4 px-10 py-4 border border-white/10 rounded-full hover:bg-luxury-gold hover:text-black hover:border-luxury-gold transition-all duration-500 bg-white/[0.01] mx-auto"
            >
              <span className="text-[10px] uppercase tracking-widest font-semibold">Let's Talk</span>
              <ArrowRight size={12} className="group-hover:translate-x-2 transition-transform duration-300" />
            </MagneticButton>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="relative z-50 py-16 px-6 md:px-16 border-t border-white/5 bg-transparent">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-center items-center gap-8 text-sm tracking-[0.2em] text-white uppercase font-semibold drop-shadow-md">
            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=pingxdeploy@gmail.com&su=Interested%20in%20website%20with%20us&body=Hi%20Pingxdeploy%20Team%2C%0A%0AWe%20are%20very%20impressed%20by%20your%20work%20and%20would%20love%20to%20discuss%20building%20a%20website%20with%20you.%0A%0AWe%20are%20looking%20for%20a%20premium%2C%20high-performance%20digital%20experience%20that%20can%20help%20drive%20growth%20for%20our%20business.%0A%0APlease%20let%20us%20know%20your%20availability%20for%20an%20initial%20consultation.%0A%0ALooking%20forward%20to%20hearing%20from%20you!"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-luxury-gold transition-colors duration-300"
            >
              pingxdeploy@gmail.com
            </a>
            <span className="hidden md:block w-1.5 h-1.5 rounded-full bg-luxury-gold shadow-[0_0_8px_#c2a688]"></span>
            <a
              href="https://www.instagram.com/pingxdeploy/?utm_source=ig_web_button_share_sheet"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-luxury-gold transition-colors duration-300"
            >
              Instagram
            </a>
          </div>
        </footer>
      </div>
    </>
  );
}
