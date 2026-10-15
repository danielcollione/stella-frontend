"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

// Tons claros da paleta da Stella (creme, areia, pedra), com poucos grãos mais escuros só para dar profundidade
const COLORS = ["#FFFFFF", "#F5EEE2", "#E9D9BF", "#D6C3A1", "#C8B79A", "#B8A684", "#A8A29E"];
const DEEP = "#8A7F72";
const MAX_PARTICLES = 3000;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  phase: number;
  speed: number;
}

/**
 * Poeira fina em movimento, como nos geradores de imagem (Meta AI, Midjourney) enquanto a imagem se forma:
 * milhares de partículas que flutuam devagar e cintilam. Canvas puro, sem biblioteca; ocupa o elemento pai inteiro
 * e para de desenhar quando sai da tela. Com "reduzir movimento" ligado no sistema, fica parada.
 */
export function DustField({ density = 1, className = "" }: { density?: number; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    let particles: Particle[] = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let visible = true;

    const seed = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      // Uma partícula a cada ~40 px²: grão bem fino e denso, como névoa. O teto protege celulares mais simples
      // (vários cards com poeira ao mesmo tempo)
      const count = Math.min(MAX_PARTICLES, Math.round(((width * height) / 40) * density));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18 - 0.05,
        size: Math.random() < 0.95 ? 0.3 + Math.random() * 0.55 : 0.9 + Math.random() * 0.6,
        color: Math.random() < 0.06 ? DEEP : COLORS[Math.floor(Math.random() * COLORS.length)],
        phase: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 1.6,
      }));
    };

    const draw = (time: number) => {
      context.clearRect(0, 0, width, height);
      for (const particle of particles) {
        if (!reducedMotion) {
          // Deriva lenta com um pouco de "respiração" (movimento browniano suave)
          particle.vx += (Math.random() - 0.5) * 0.02;
          particle.vy += (Math.random() - 0.5) * 0.02;
          particle.vx = Math.max(-0.35, Math.min(0.35, particle.vx));
          particle.vy = Math.max(-0.35, Math.min(0.35, particle.vy));
          particle.x = (particle.x + particle.vx + width) % width;
          particle.y = (particle.y + particle.vy + height) % height;
        }
        const twinkle = reducedMotion ? 0.55 : 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(time / 1000 * particle.speed + particle.phase));
        context.globalAlpha = twinkle * 0.7;
        context.fillStyle = particle.color;
        if (particle.size < 1.2) {
          // Grão fino: um quadradinho é bem mais barato de desenhar e, nesse tamanho, parece um ponto
          context.fillRect(particle.x, particle.y, particle.size * 1.6, particle.size * 1.6);
        } else {
          context.beginPath();
          context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          context.fill();
        }
      }
      context.globalAlpha = 1;
    };

    const loop = (time: number) => {
      if (visible) draw(time);
      if (!reducedMotion) frame = requestAnimationFrame(loop);
    };

    seed();
    frame = requestAnimationFrame(loop);
    const resize = new ResizeObserver(() => seed());
    resize.observe(canvas);
    const onScreen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    onScreen.observe(canvas);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      onScreen.disconnect();
    };
  }, [density, reducedMotion]);

  return <canvas ref={canvasRef} aria-hidden="true" className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} />;
}
