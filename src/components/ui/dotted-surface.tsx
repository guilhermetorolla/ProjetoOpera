'use client';
import { cn } from '../../lib/utils';
import { useTheme } from 'next-themes';
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

type DottedSurfaceProps = Omit<React.ComponentProps<'div'>, 'ref'> & {
	isAnimated?: boolean;
};

export function DottedSurface({ className, isAnimated = true, ...props }: DottedSurfaceProps) {
	// Fallback to 'light' if useTheme is used outside of ThemeProvider
	const themeContext = useTheme();
	const theme = themeContext?.theme || 'light';

	const containerRef = useRef<HTMLDivElement>(null);
	const sceneRef = useRef<{
		scene: THREE.Scene;
		camera: THREE.PerspectiveCamera;
		renderer: THREE.WebGLRenderer;
		particles: THREE.Points[];
		animationId: number;
		count: number;
	} | null>(null);

	useEffect(() => {
		let isMounted = true;
		if (!containerRef.current) return;

		// Clean up any existing canvas just in case
		containerRef.current.innerHTML = '';

		const SEPARATION = 100; // Closer dots
		const AMOUNTX = 50;
		const AMOUNTY = 50;

		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
		camera.position.set(0, 400, 800);
		camera.lookAt(0, 0, 0);

		try {
			const renderer = new THREE.WebGLRenderer({ 
				alpha: true, 
				antialias: true,
				powerPreference: "high-performance"
			});
			renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
			renderer.setSize(window.innerWidth, window.innerHeight);
			
			const canvas = renderer.domElement;
			containerRef.current.appendChild(canvas);

			const numPoints = AMOUNTX * AMOUNTY;
			const positions = new Float32Array(numPoints * 3);
			const colors = new Float32Array(numPoints * 3);

			// Consistent colors that work in both light and dark backgrounds
			const r = theme === 'dark' ? 1.0 : 0.0;
			const g = theme === 'dark' ? 1.0 : 0.0;
			const b = theme === 'dark' ? 1.0 : 0.0;

			for (let i = 0; i < numPoints; i++) {
				const i3 = i * 3;
				const ix = Math.floor(i / AMOUNTY);
				const iy = i % AMOUNTY;

				positions[i3] = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2;
				positions[i3 + 1] = 0;
				positions[i3 + 2] = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2;

				colors[i3] = r;
				colors[i3 + 1] = g;
				colors[i3 + 2] = b;
			}

			const geometry = new THREE.BufferGeometry();
			geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
			geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

			const material = new THREE.PointsMaterial({
				size: 4, // Slightly smaller but more dots
				vertexColors: true,
				transparent: true,
				opacity: 0.4,
				sizeAttenuation: true,
			});

			const points = new THREE.Points(geometry, material);
			scene.add(points);

			let animationId: number;
			let count = 0;

			const animate = () => {
				if (!isMounted) return;
				animationId = requestAnimationFrame(animate);

				const posAttr = geometry.attributes.position;
				const posArray = posAttr.array as Float32Array;
				
				for (let i = 0; i < numPoints; i++) {
					const ix = Math.floor(i / AMOUNTY);
					const iy = i % AMOUNTY;
					
					// Smoother, slower wave
					const y = (Math.sin((ix + count) * 0.25) * 50) + 
							  (Math.cos((iy + count) * 0.4) * 50);
					posArray[i * 3 + 1] = y;
				}

				posAttr.needsUpdate = true;
				renderer.render(scene, camera);
				if (isAnimated) {
					count += 0.035; // Reduced speed for a calmer wave
				}
			};

			const handleResize = () => {
				if (!isMounted) return;
				camera.aspect = window.innerWidth / window.innerHeight;
				camera.updateProjectionMatrix();
				renderer.setSize(window.innerWidth, window.innerHeight);
			};

			window.addEventListener('resize', handleResize);
			animate();

			return () => {
				isMounted = false;
				window.removeEventListener('resize', handleResize);
				cancelAnimationFrame(animationId);
				
				geometry.dispose();
				material.dispose();
				renderer.dispose();
				if (containerRef.current && canvas.parentNode === containerRef.current) {
					containerRef.current.removeChild(canvas);
				}
			};
		} catch (error) {
			console.warn("WebGL not supported, falling back to empty surface", error);
			return () => {};
		}
	}, [theme, isAnimated]);

	return (
		<div
			ref={containerRef}
			className={cn('pointer-events-none fixed inset-0 z-0', className)}
			{...props}
		/>
	);
}
