'use client';

import Shell from '@/components/layout/Shell';
import { RefreshCw, Volume2, VolumeX } from 'lucide-react';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './twenty-forty-eight.module.css';

const SIZE = 4;
const CELLS = SIZE * SIZE;
const WIN_TILE = 2048;

type Direction = 'up' | 'down' | 'left' | 'right';
type Status = 'playing' | 'won' | 'lost';
type Tile = {
  id: number;
  value: number;
};
type Board = Array<Tile | null>;
type GameState = {
  board: Board;
  score: number;
  status: Status;
};

function createTile(value = Math.random() < 0.9 ? 2 : 4, id = Date.now() + Math.random()): Tile {
  return {
    id,
    value,
  };
}

function emptyIndexes(board: Board) {
  return board
    .map((tile, index) => (tile ? -1 : index))
    .filter((index) => index >= 0);
}

function addRandomTile(board: Board) {
  const empty = emptyIndexes(board);
  if (empty.length === 0) return board;
  const next = [...board];
  const index = empty[Math.floor(Math.random() * empty.length)];
  next[index] = createTile();
  return next;
}

function createInitialState(randomize = false): GameState {
  if (!randomize) {
    const board = Array<Tile | null>(CELLS).fill(null);
    board[5] = createTile(2, 1);
    board[10] = createTile(2, 2);

    return {
      board,
      score: 0,
      status: 'playing',
    };
  }

  return {
    board: addRandomTile(addRandomTile(Array<Tile | null>(CELLS).fill(null))),
    score: 0,
    status: 'playing',
  };
}

function sameBoard(a: Board, b: Board) {
  return a.every((tile, index) => tile?.value === b[index]?.value);
}

function hasAvailableMove(board: Board) {
  if (emptyIndexes(board).length > 0) return true;

  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const value = board[row * SIZE + col]?.value;
      const right = col < SIZE - 1 ? board[row * SIZE + col + 1]?.value : null;
      const down = row < SIZE - 1 ? board[(row + 1) * SIZE + col]?.value : null;
      if (value === right || value === down) return true;
    }
  }

  return false;
}

function slideLine(line: Array<Tile | null>) {
  const compact = line.filter(Boolean) as Tile[];
  const result: Array<Tile | null> = [];
  let gained = 0;

  for (let index = 0; index < compact.length; index += 1) {
    const current = compact[index];
    const next = compact[index + 1];

    if (next && current.value === next.value) {
      const value = current.value * 2;
      result.push(createTile(value));
      gained += value;
      index += 1;
    } else {
      result.push(current);
    }
  }

  while (result.length < SIZE) {
    result.push(null);
  }

  return { line: result, gained };
}

function getLineIndexes(direction: Direction, line: number) {
  const indexes: number[] = [];

  for (let offset = 0; offset < SIZE; offset += 1) {
    if (direction === 'left') indexes.push(line * SIZE + offset);
    if (direction === 'right') indexes.push(line * SIZE + (SIZE - 1 - offset));
    if (direction === 'up') indexes.push(offset * SIZE + line);
    if (direction === 'down') indexes.push((SIZE - 1 - offset) * SIZE + line);
  }

  return indexes;
}

function moveBoard(board: Board, direction: Direction) {
  const next = [...board];
  let gained = 0;

  for (let line = 0; line < SIZE; line += 1) {
    const indexes = getLineIndexes(direction, line);
    const moved = slideLine(indexes.map((index) => board[index]));
    gained += moved.gained;
    indexes.forEach((index, offset) => {
      next[index] = moved.line[offset];
    });
  }

  return {
    board: next,
    gained,
    moved: !sameBoard(board, next),
  };
}

function applyMove(state: GameState, direction: Direction): GameState {
  if (state.status !== 'playing') return state;

  const moved = moveBoard(state.board, direction);
  if (!moved.moved) return state;

  const board = addRandomTile(moved.board);
  const score = state.score + moved.gained;
  const reachedGoal = board.some((tile) => tile?.value === WIN_TILE);

  return {
    board,
    score,
    status: reachedGoal ? 'won' : hasAvailableMove(board) ? 'playing' : 'lost',
  };
}

function tileStyle(value: number): React.CSSProperties {
  const palette: Record<number, { bg: string; color: string }> = {
    2: { bg: '#eee4da', color: '#675f58' },
    4: { bg: '#ede0c8', color: '#675f58' },
    8: { bg: '#f2b179', color: '#ffffff' },
    16: { bg: '#f59563', color: '#ffffff' },
    32: { bg: '#f67c5f', color: '#ffffff' },
    64: { bg: '#f65e3b', color: '#ffffff' },
    128: { bg: '#edcf72', color: '#ffffff' },
    256: { bg: '#edcc61', color: '#ffffff' },
    512: { bg: '#edc850', color: '#ffffff' },
    1024: { bg: '#edc53f', color: '#ffffff' },
    2048: { bg: '#edc22e', color: '#ffffff' },
  };
  const color = palette[value] ?? { bg: '#6f8f72', color: '#ffffff' };
  return {
    '--tile-bg': color.bg,
    '--tile-color': color.color,
  } as React.CSSProperties;
}

function directionFromKey(key: string): Direction | null {
  const map: Record<string, Direction> = {
    ArrowUp: 'up',
    w: 'up',
    W: 'up',
    ArrowDown: 'down',
    s: 'down',
    S: 'down',
    ArrowLeft: 'left',
    a: 'left',
    A: 'left',
    ArrowRight: 'right',
    d: 'right',
    D: 'right',
  };
  return map[key] ?? null;
}

export default function TwentyFortyEightPage() {
  const [game, setGame] = useState(() => createInitialState());
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  const move = useCallback((direction: Direction) => {
    setGame((current) => applyMove(current, direction));
  }, []);

  const reset = useCallback(() => {
    setGame(createInitialState(true));
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const direction = directionFromKey(event.key);
      if (!direction) return;
      event.preventDefault();
      move(direction);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [move]);

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerStart.current) return;

    const dx = event.clientX - pointerStart.current.x;
    const dy = event.clientY - pointerStart.current.y;
    pointerStart.current = null;

    if (Math.max(Math.abs(dx), Math.abs(dy)) < 32) return;
    move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
  }, [move]);

  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const ambientRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Ambient background music for 2048
    const audio = new Audio('https://cdn.pixabay.com/download/audio/2022/08/02/audio_884fe92c21.mp3?filename=relaxing-145038.mp3');
    audio.loop = true;
    audio.volume = isAudioMuted ? 0 : 0.18;
    audio.play().catch(() => {});
    ambientRef.current = audio;
    return () => { audio.pause(); };
  }, []);

  useEffect(() => {
    if (ambientRef.current) {
      ambientRef.current.volume = isAudioMuted ? 0 : 0.18;
    }
  }, [isAudioMuted]);

  return (
    <Shell>
      <div className={styles.page}>
        <header className={styles.hero}>
          <Breadcrumb items={[{ label: 'Games', href: '/games' }, { label: 'Xếp Số 2048' }]} />
          <div className={styles.titleBlock}>
            <div className={styles.mascot} aria-hidden="true">
              <span className={styles.mascotFace}>•ᴗ•</span>
            </div>
            <div>
              <span className={styles.category}>Giải đố / Thư giãn</span>
              <h1>Xếp Số 2048</h1>
              <p>Gạt để gộp các ô số giống nhau, từ từ tạo ra con số 2048 trong nền nhạc êm dịu.</p>
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

        <section
          className={styles.board}
          aria-label="Bàn chơi 2048"
          onPointerDown={(event) => {
            pointerStart.current = { x: event.clientX, y: event.clientY };
          }}
          onPointerUp={handlePointerUp}
        >
          {game.board.map((tile, index) => (
            <div key={tile?.id ?? `empty-${index}`} className={styles.cell}>
              {tile && (
                <div
                  className={styles.tile}
                  style={tileStyle(tile.value)}
                  data-large={tile.value >= 1024}
                >
                  {tile.value}
                </div>
              )}
            </div>
          ))}

          {game.status !== 'playing' && (
            <div className={styles.overlay}>
              <strong>{game.status === 'won' ? 'Bạn đã tạo được 2048' : 'Không còn nước đi'}</strong>
              <button type="button" onClick={reset}>
                Chơi lại
              </button>
            </div>
          )}
        </section>

          </div>
          <div className={styles.sidePanel}>
            <div className={styles.sideCard}>
              <h3 className={styles.cardTitle}>Thành tích</h3>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Điểm số</span>
                <strong className={styles.statValue}>{game.score}</strong>
              </div>
            </div>
            <div className={styles.sideCard}>
              <h3 className={styles.cardTitle}>Hướng dẫn</h3>
              <ul className={styles.instructionList}>
                <li>Dùng phím mũi tên hoặc vuốt trên màn hình để gạt các ô.</li>
                <li>Hai ô có cùng số sẽ gộp lại thành một.</li>
                <li>Mục tiêu là tạo ra ô có số 2048.</li>
              </ul>
              <div className={styles.actionGroup}>
                <button type="button" className={styles.resetBtn} onClick={reset}>
                  <RefreshCw size={16} />
                  Chơi lại
                </button>
              </div>
            </div>
            <div className={styles.sideCard}>
              <img src="/images/ai-mascot.svg" alt="Mascot" className={styles.mascotImage} />
              <div className={styles.mascotSpeechBubble}>
                "Cứ bình tĩnh gộp từng ô một nhé! Không cần vội đâu, hãy tận hưởng nền nhạc thư giãn!"
              </div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
