'use client';

import Shell from '@/components/layout/Shell';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronLeft,
  Pause,
  Play,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './snake.module.css';

const BOARD_SIZE = 18;
const CELL_COUNT = BOARD_SIZE * BOARD_SIZE;

type Direction = 'up' | 'down' | 'left' | 'right';
type Status = 'ready' | 'playing' | 'paused' | 'lost';
type Point = {
  x: number;
  y: number;
};
type SnakeState = {
  snake: Point[];
  food: Point;
  direction: Direction;
  nextDirection: Direction;
  score: number;
  status: Status;
};

const vectors: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function samePoint(a: Point, b: Point) {
  return a.x === b.x && a.y === b.y;
}

function isOpposite(a: Direction, b: Direction) {
  return (
    (a === 'up' && b === 'down') ||
    (a === 'down' && b === 'up') ||
    (a === 'left' && b === 'right') ||
    (a === 'right' && b === 'left')
  );
}

function randomFood(snake: Point[]) {
  const occupied = new Set(snake.map((point) => `${point.x}:${point.y}`));
  const empty = Array.from({ length: CELL_COUNT }, (_, index) => ({
    x: index % BOARD_SIZE,
    y: Math.floor(index / BOARD_SIZE),
  })).filter((point) => !occupied.has(`${point.x}:${point.y}`));

  return empty[Math.floor(Math.random() * empty.length)] ?? { x: 3, y: 3 };
}

function createInitialState(randomizeFood = false): SnakeState {
  const snake = [
    { x: 8, y: 9 },
    { x: 7, y: 9 },
    { x: 6, y: 9 },
  ];

  return {
    snake,
    food: randomizeFood ? randomFood(snake) : { x: 12, y: 9 },
    direction: 'right',
    nextDirection: 'right',
    score: 0,
    status: 'ready',
  };
}

function applyTick(state: SnakeState): SnakeState {
  if (state.status !== 'playing') return state;

  const direction = isOpposite(state.direction, state.nextDirection)
    ? state.direction
    : state.nextDirection;
  const head = state.snake[0];
  const vector = vectors[direction];
  const nextHead = { x: head.x + vector.x, y: head.y + vector.y };
  const eatsFood = samePoint(nextHead, state.food);
  const collisionBody = eatsFood ? state.snake : state.snake.slice(0, -1);
  const hitsWall =
    nextHead.x < 0 ||
    nextHead.x >= BOARD_SIZE ||
    nextHead.y < 0 ||
    nextHead.y >= BOARD_SIZE;
  const hitsSelf = collisionBody.some((segment) => samePoint(segment, nextHead));

  if (hitsWall || hitsSelf) {
    return { ...state, direction, status: 'lost' };
  }

  const snake = eatsFood
    ? [nextHead, ...state.snake]
    : [nextHead, ...state.snake.slice(0, -1)];

  return {
    ...state,
    snake,
    direction,
    nextDirection: direction,
    score: eatsFood ? state.score + 1 : state.score,
    food: eatsFood ? randomFood(snake) : state.food,
  };
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

export default function SnakePage() {
  const [game, setGame] = useState(() => createInitialState());
  const pointerStart = useRef<Point | null>(null);
  const speed = Math.max(85, 170 - game.score * 5);

  const snakeMap = useMemo(() => {
    const map = new Map<string, number>();
    game.snake.forEach((segment, index) => map.set(`${segment.x}:${segment.y}`, index));
    return map;
  }, [game.snake]);

  const setDirection = useCallback((direction: Direction) => {
    setGame((current) => {
      if (isOpposite(current.direction, direction)) return current;
      return {
        ...current,
        nextDirection: direction,
        status: current.status === 'ready' || current.status === 'paused' ? 'playing' : current.status,
      };
    });
  }, []);

  const reset = useCallback(() => {
    setGame(createInitialState(true));
  }, []);

  const togglePlay = useCallback(() => {
    setGame((current) => {
      if (current.status === 'lost') return createInitialState(true);
      if (current.status === 'playing') return { ...current, status: 'paused' };
      return { ...current, status: 'playing' };
    });
  }, []);

  useEffect(() => {
    if (game.status !== 'playing') return;

    const timer = window.setInterval(() => {
      setGame((current) => applyTick(current));
    }, speed);

    return () => window.clearInterval(timer);
  }, [game.status, speed]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === ' ') {
        event.preventDefault();
        togglePlay();
        return;
      }

      const direction = directionFromKey(event.key);
      if (!direction) return;
      event.preventDefault();
      setDirection(direction);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setDirection, togglePlay]);

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerStart.current) return;
    const dx = event.clientX - pointerStart.current.x;
    const dy = event.clientY - pointerStart.current.y;
    pointerStart.current = null;

    if (Math.max(Math.abs(dx), Math.abs(dy)) < 28) return;
    setDirection(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
  }, [setDirection]);

  return (
    <Shell>
      <div className={styles.page}>
        <div className={styles.topBar}>
          <Link href="/games" className={styles.backLink}>
            <ChevronLeft size={18} />
            Quay lại
          </Link>
          <div className={styles.actions}>
            <button type="button" onClick={togglePlay}>
              {game.status === 'playing' ? <Pause size={16} /> : <Play size={16} />}
              {game.status === 'playing' ? 'Tạm dừng' : 'Bắt đầu'}
            </button>
            <button type="button" onClick={reset}>
              <RefreshCw size={16} />
              Chơi lại
            </button>
          </div>
        </div>

        <header className={styles.header}>
          <div>
            <h1>Rắn săn mồi</h1>
            <p>Dùng phím mũi tên, WASD hoặc vuốt để điều hướng. Ăn mồi để dài hơn và tăng tốc.</p>
          </div>
          <div className={styles.scoreBox}>
            <span>Điểm</span>
            <strong>{game.score}</strong>
          </div>
        </header>

        <section
          className={styles.board}
          aria-label="Bàn chơi rắn săn mồi"
          onPointerDown={(event) => {
            pointerStart.current = { x: event.clientX, y: event.clientY };
          }}
          onPointerUp={handlePointerUp}
        >
          {Array.from({ length: CELL_COUNT }, (_, index) => {
            const point = { x: index % BOARD_SIZE, y: Math.floor(index / BOARD_SIZE) };
            const snakeIndex = snakeMap.get(`${point.x}:${point.y}`);
            const isFood = samePoint(point, game.food);
            const isSnake = snakeIndex !== undefined;

            return (
              <div
                key={`${point.x}:${point.y}`}
                className={`${styles.cell} ${isFood ? styles.food : ''} ${isSnake ? styles.snake : ''} ${snakeIndex === 0 ? styles.head : ''}`}
              />
            );
          })}

          {game.status !== 'playing' && (
            <div className={styles.overlay}>
              <strong>
                {game.status === 'lost'
                  ? 'Rắn đã va chạm'
                  : game.status === 'paused'
                    ? 'Đang tạm dừng'
                    : 'Sẵn sàng chơi'}
              </strong>
              <button type="button" onClick={togglePlay}>
                {game.status === 'lost' ? 'Chơi lại' : 'Bắt đầu'}
              </button>
            </div>
          )}
        </section>

        <div className={styles.dpad} aria-label="Điều khiển rắn">
          <button type="button" className={styles.up} onClick={() => setDirection('up')} aria-label="Đi lên">
            <ArrowUp size={20} />
          </button>
          <button type="button" className={styles.left} onClick={() => setDirection('left')} aria-label="Đi trái">
            <ArrowLeft size={20} />
          </button>
          <button type="button" className={styles.down} onClick={() => setDirection('down')} aria-label="Đi xuống">
            <ArrowDown size={20} />
          </button>
          <button type="button" className={styles.right} onClick={() => setDirection('right')} aria-label="Đi phải">
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </Shell>
  );
}
