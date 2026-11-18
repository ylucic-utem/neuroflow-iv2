import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { audioEngine } from '../services/audioEngine';
import { DETERMINE_BAND } from '../constants';
import { BrainwaveBand } from '../types';

interface ParticleVisualizerProps {
  beatFreq: number;
  isPlaying: boolean;
  className?: string;
}

const ParticleVisualizer: React.FC<ParticleVisualizerProps> = ({ beatFreq, isPlaying, className }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const beatFreqRef = useRef(beatFreq);

  // Soft Pastel Palettes for Brainwaves
  const PALETTES: Record<BrainwaveBand, THREE.Color> = {
    [BrainwaveBand.Delta]: new THREE.Color(0x22d3ee), // Cyan
    [BrainwaveBand.Theta]: new THREE.Color(0x34d399), // Emerald
    [BrainwaveBand.Alpha]: new THREE.Color(0xa78bfa), // Violet
    [BrainwaveBand.Beta]:  new THREE.Color(0xfb923c), // Orange
    [BrainwaveBand.Gamma]: new THREE.Color(0xf472b6), // Pink
  };

  useEffect(() => {
    beatFreqRef.current = beatFreq;
  }, [beatFreq]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // --- THREE.JS SETUP ---
    const scene = new THREE.Scene();
    
    // Camera
    const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 2000);
    camera.position.z = 400;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio for performance
    mount.appendChild(renderer.domElement);

    // --- PARTICLES (INSTANCED MESH) ---
    const particleCount = 4000;
    const geometry = new THREE.CircleGeometry(1, 6); // Low poly circle
    const material = new THREE.MeshBasicMaterial({ 
        color: 0xffffff,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });

    const mesh = new THREE.InstancedMesh(geometry, material, particleCount);
    scene.add(mesh);

    // Particle Data
    const dummy = new THREE.Object3D();
    const positions = new Float32Array(particleCount * 3);
    const angles = new Float32Array(particleCount);
    const radii = new Float32Array(particleCount);
    const speeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
        // Initial Spherical Distribution
        const r = 100 + Math.random() * 300;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
        
        angles[i] = Math.random() * Math.PI * 2;
        radii[i] = r;
        speeds[i] = 0.002 + Math.random() * 0.005;
        
        dummy.position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;

    // Audio Analyzer
    const analyser = audioEngine.getAnalyser();
    const dataArray = new Uint8Array(analyser ? analyser.frequencyBinCount : 0);

    // Color Lerp State
    const currentColor = new THREE.Color(PALETTES[DETERMINE_BAND(beatFreqRef.current)]);

    // --- ANIMATION LOOP ---
    let frameId = 0;
    let time = 0;

    const animate = () => {
        frameId = requestAnimationFrame(animate);
        time += 0.005;

        // Audio Reactive Data
        let bass = 0;
        if (analyser && isPlaying) {
            analyser.getByteFrequencyData(dataArray);
            // Sample bass frequencies
            for(let k=0; k<20; k++) bass += dataArray[k];
            bass = (bass / 20) / 255;
        }

        // Color Transition
        const targetColor = PALETTES[DETERMINE_BAND(beatFreqRef.current)];
        currentColor.lerp(targetColor, 0.05);
        material.color.copy(currentColor);
        // Pulse opacity with bass
        material.opacity = 0.3 + (bass * 0.5);

        // Rotate System
        mesh.rotation.y = time * 0.1;
        mesh.rotation.z = time * 0.05;

        // Update Particles
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Movement Logic
            angles[i] += speeds[i] * (1 + bass * 5); // Speed up with bass
            
            // Orbit calculation
            const r = radii[i] + Math.sin(time + i) * 20 * bass;
            
            // Simple orbital mechanics for visual flair
            const x = Math.cos(angles[i]) * r;
            const y = positions[i3 + 1] + Math.sin(time * 2 + i) * 0.5; // Bobbing
            const z = Math.sin(angles[i]) * r;

            dummy.position.set(x, y, z);
            
            // Scale pulse
            const s = 1 + (bass * 2);
            dummy.scale.set(s, s, s);
            
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;

        renderer.render(scene, camera);
    };

    animate();

    // --- RESIZE HANDLER ---
    const handleResize = () => {
        if (!mount) return;
        camera.aspect = mount.clientWidth / mount.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // --- CLEANUP ---
    return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(frameId);
        mount.removeChild(renderer.domElement);
        // Disposal to prevent memory leaks
        geometry.dispose();
        material.dispose();
        renderer.dispose();
    };
  }, [isPlaying]); // Re-init on play toggle to ensure context is fresh

  return <div ref={mountRef} className={`block ${className}`} />;
};

export default ParticleVisualizer;