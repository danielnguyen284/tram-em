'use client';

import Shell from '@/components/layout/Shell';
import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trash2 } from 'lucide-react';
import styles from './sand-draw.module.css';

const COLORS = ['#a8c8f0', '#a8d8b9', '#c8a4e8', '#f4a8c0', '#f7c59f', '#7ec8a8'];
const DEFAULT_COLOR = COLORS[0];
const DEFAULT_SIZE = 12;

function playSandSound(audioCtx: AudioContext, gainNodeRef: React.MutableRefObject<GainNode | null>) {
  if (gainNodeRef.current) return;
  const bufferSize = 4096;
  const node = audioCtx.createScriptProcessor(bufferSize, 1, 1);
  node.onaudioprocess = (e) => {
    const output = e.outputBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.08;
    }
  };
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0.6, audioCtx.currentTime + 0.05);
  node.connect(gain);
  gain.connect(audioCtx.destination);
  gainNodeRef.current = gain;
}

function stopSandSound(audioCtx: AudioContext, gainNodeRef: React.MutableRefObject<GainNode | null>) {
  if (!gainNodeRef.current) return;
  gainNodeRef.current.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.08);
  setTimeout(() => {
    gainNodeRef.current?.disconnect();
    gainNodeRef.current = null;
  }, 100);
}

export default function SandDrawPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [size, setSize] = useState(DEFAULT_SIZE);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const ambientRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Ambient beach/wind sound
    const audio = new Audio('https://cdn.pixabay.com/download/audio/2022/03/15/audio_6c3b8d0d90.mp3?filename=ocean-waves-112186.mp3');
    audio.loop = true;
    audio.volume = 0.2;
    audio.play().catch(() => {});
    ambientRef.current = audio;
    return () => { audio.pause(); };
  }, []);

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
    return audioCtxRef.current;
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const touch = e.touches[0];
      return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    isDrawing.current = true;
    lastPos.current = getPos(e, canvas);
    playSandSound(getAudioCtx(), gainNodeRef);
  }, [getAudioCtx]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e, canvas);
    if (!lastPos.current) { lastPos.current = pos; return; }

    ctx.strokeStyle = color;
    ctx.lineWidth = size + Math.random() * 2; // slight variation for sand feel
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    // Sand scatter dots
    for (let i = 0; i < 3; i++) {
      const dx = (Math.random() - 0.5) * size * 1.5;
      const dy = (Math.random() - 0.5) * size * 1.5;
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(pos.x + dx, pos.y + dy, Math.random() * 2 + 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    lastPos.current = pos;
  }, [color, size]);

  const stopDraw = useCallback(() => {
    isDrawing.current = false;
    lastPos.current = null;
    if (audioCtxRef.current) stopSandSound(audioCtxRef.current, gainNodeRef);
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  return (
    <Shell>
      <div className={styles.container}>
        <div className={styles.topBar}>
          <Link href="/games" className={styles.backBtn}>
            <ArrowLeft size={18} /> Quay lại
          </Link>
          <h2 className={styles.pageTitle}>Vẽ trên cát</h2>
          <div style={{ width: 80 }} />
        </div>

        <div className={styles.toolbar}>
          <div className={styles.colorPicker}>
            {COLORS.map(c => (
              <button
                key={c}
                className={`${styles.colorDot} ${color === c ? styles.selectedColor : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
                aria-label={`Chọn màu ${c}`}
              />
            ))}
          </div>
          <div className={styles.sizeControl}>
            <span className={styles.sizeLabel}>Cỡ bút</span>
            <input
              type="range"
              min={4}
              max={30}
              value={size}
              onChange={e => setSize(Number(e.target.value))}
              className={styles.slider}
            />
            <div
              className={styles.sizePreview}
              style={{ width: size, height: size, backgroundColor: color }}
            />
          </div>
          <button className={styles.clearBtn} onClick={clearCanvas}>
            <Trash2 size={15} /> Xóa
          </button>
        </div>

        <div className={styles.canvasWrapper}>
          <canvas
            ref={canvasRef}
            width={900}
            height={520}
            className={styles.canvas}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
          />
        </div>

        <p className={styles.hint}>Vẽ tự do trên cát — xóa đi mọi lo âu theo từng nét bút ✨</p>
      </div>
    </Shell>
  );
}
