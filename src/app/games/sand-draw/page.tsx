'use client';

import Shell from '@/components/layout/Shell';
import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { Eraser, Trash2, Volume2, VolumeX } from 'lucide-react';
import Breadcrumb from '@/components/ui/Breadcrumb';
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
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const ambientRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Ambient beach/wind sound
    const audio = new Audio('https://cdn.pixabay.com/download/audio/2022/03/15/audio_6c3b8d0d90.mp3?filename=ocean-waves-112186.mp3');
    audio.loop = true;
    audio.volume = isAudioMuted ? 0 : 0.2;
    audio.play().catch(() => {});
    ambientRef.current = audio;
    return () => { audio.pause(); };
  }, []);

  useEffect(() => {
    if (ambientRef.current) {
      ambientRef.current.volume = isAudioMuted ? 0 : 0.2;
    }
  }, [isAudioMuted]);

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
    if (!isAudioMuted) {
      playSandSound(getAudioCtx(), gainNodeRef);
    }
  }, [getAudioCtx, isAudioMuted]);

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
      <div className={styles.page}>
        <header className={styles.hero}>
          <Breadcrumb items={[{ label: 'Games', href: '/games' }, { label: 'Vẽ Trên Cát' }]} />
          <div className={styles.titleBlock}>
            <div className={styles.mascot} aria-hidden="true">
              <span className={styles.mascotFace}>•ᴗ•</span>
            </div>
            <div>
              <span className={styles.category}>Sáng tạo / Thư giãn</span>
              <h1>Vẽ Trên Cát</h1>
              <p>Thư giãn bằng cách vẽ những đường nét mềm mại trên mặt cát êm đềm.</p>
            </div>
            
            <button
              onClick={() => setIsAudioMuted(!isAudioMuted)}
              className={styles.muteBtn}
              title={isAudioMuted ? 'Mở âm thanh' : 'Tắt âm thanh'}
              type="button"
            >
              {isAudioMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              <span>{isAudioMuted ? 'Tắt tiếng' : 'Mở tiếng'}</span>
            </button>
          </div>
        </header>

        <div className={styles.layout}>
          <div className={styles.gamePanel}>
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
                onTouchCancel={stopDraw}
              />
            </div>
          </div>

          <div className={styles.sidePanel}>
            <div className={styles.sideCard}>
            <h3 className={styles.cardTitle}>Công cụ</h3>
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
                <span className={styles.sizeLabel}>Cỡ nét:</span>
                <input
                  type="range"
                  min="4"
                  max="40"
                  value={size}
                  onChange={e => setSize(Number(e.target.value))}
                  className={styles.slider}
                />
                <div
                  className={styles.sizePreview}
                  style={{ backgroundColor: color, width: size, height: size }}
                />
              </div>
            </div>
            <button className={styles.clearBtn} onClick={clearCanvas}>
              <Trash2 size={16} /> Xóa nét vẽ
            </button>
          </div>

          <div className={styles.sideCard}>
            <h3 className={styles.cardTitle}>Cách chơi</h3>
            <div className={styles.instructionsList}>
              <div className={styles.instructionItem}>
                <div className={styles.instructionNum}>1</div>
                <span>Chọn màu sắc và kích cỡ nét vẽ ở trên.</span>
              </div>
              <div className={styles.instructionItem}>
                <div className={styles.instructionNum}>2</div>
                <span>Chạm và di chuyển trên mặt cát để vẽ tự do.</span>
              </div>
              <div className={styles.instructionItem}>
                <div className={styles.instructionNum}>3</div>
                <span>Lắng nghe âm thanh xào xạc của cát biển.</span>
              </div>
            </div>
          </div>


        </div>
        </div>
      </div>
    </Shell>
  );
}
