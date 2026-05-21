'use client';

import { useState, useTransition, useMemo, useEffect, useRef } from 'react';
import type { Sound } from '@/types/database';
import { saveSound, deleteSound, toggleSoundActive } from '@/app/admin/actions';
import { Plus, Edit2, Trash2, X, Play, Pause, Search, Music, Sparkles, Clock, Globe } from 'lucide-react';
import styles from '../admin.module.css';

type Props = {
  initialSounds: Sound[];
};

export default function SoundsClient({ initialSounds }: Props) {
  const [sounds, setSounds] = useState(initialSounds);
  const [isOpen, setIsOpen] = useState(false);
  const [editingSound, setEditingSound] = useState<Sound | null>(null);
  
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const [isPending, startTransition] = useTransition();

  // Unified audio preview player
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync state if initialSounds changes (RSC page update)
  useMemo(() => {
    setSounds(initialSounds);
  }, [initialSounds]);

  // Cleanup audio player on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(sounds.map((s) => s.category).filter(Boolean));
    return ['all', ...Array.from(cats)];
  }, [sounds]);

  const visibleSounds = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sounds.filter((s) => {
      const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter;
      const matchesSearch = 
        !query ||
        s.name.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query) ||
        (s.mood && s.mood.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [sounds, search, categoryFilter]);

  // Audio Play Toggle
  const handlePlayToggle = (sound: Sound) => {
    if (playingId === sound.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const url = sound.audio_url?.trim();
      if (!url || (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/'))) {
        alert('Đường dẫn âm thanh (Audio URL) trống hoặc không hợp lệ.');
        return;
      }

      try {
        const audio = new Audio(url);
        audioRef.current = audio;
        
        let hasAlerted = false;
        const triggerAlert = (message: string) => {
          if (hasAlerted) return;
          hasAlerted = true;
          alert(message);
          setPlayingId(null);
        };
        
        audio.onerror = (e) => {
          console.error('Audio load error:', e);
          triggerAlert(
            'Không thể tải tệp âm thanh này.\n\n' +
            'Lưu ý: Một số dịch vụ (như Pixabay) có lớp bảo vệ chống liên kết trực tiếp (Hotlink Protection) ' +
            'hoặc chặn CORS để bảo vệ tài nguyên, ngăn cản trình duyệt phát thử trực tiếp. ' +
            'Vui lòng sử dụng một liên kết tệp âm thanh trực tiếp công khai khác.'
          );
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.error('Audio play failed:', err);
            triggerAlert(
              'Không thể phát thử tệp âm thanh này.\n\n' +
              'Định dạng tệp âm thanh không được hỗ trợ bởi trình duyệt, hoặc liên kết bị lỗi chặn truy cập (CORS/Hotlink).'
            );
          });
        }
        
        audio.onended = () => {
          setPlayingId(null);
        };
        setPlayingId(sound.id);
      } catch (err) {
        console.error('Failed to create Audio instance:', err);
        alert('Trình duyệt của bạn không hỗ trợ định dạng âm thanh này.');
        setPlayingId(null);
      }
    }
  };

  // Open modal for adding
  const handleAddClick = () => {
    setEditingSound(null);
    setImageUrl('');
    setIsOpen(true);
  };

  // Open modal for editing
  const handleEditClick = (sound: Sound) => {
    setEditingSound(sound);
    setImageUrl(sound.image_url ?? '');
    setIsOpen(true);
  };

  // Handle delete
  const handleDeleteClick = (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa track âm thanh "${name}"?`)) {
      return;
    }
    
    // Stop audio if playing deleted item
    if (playingId === id) {
      if (audioRef.current) audioRef.current.pause();
      setPlayingId(null);
    }

    startTransition(async () => {
      try {
        await deleteSound(id);
        setSounds((prev) => prev.filter((s) => s.id !== id));
      } catch (err) {
        alert('Không thể xóa track âm thanh.');
      }
    });
  };

  // Instant active toggling
  const handleActiveToggle = (sound: Sound) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set('id', sound.id);
      formData.set('is_active', String(sound.is_active));
      
      try {
        await toggleSoundActive(formData);
        setSounds((prev) =>
          prev.map((s) => (s.id === sound.id ? { ...s, is_active: !s.is_active } : s))
        );
      } catch (err) {
        alert('Không thể thay đổi trạng thái track.');
      }
    });
  };

  // ImgBB Upload Flow
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const file = files[0];
      const body = new FormData();
      body.append('file', file);
      
      const res = await fetch('/api/upload', { method: 'POST', body });
      const json = await res.json();
      
      if (json.url) {
        setImageUrl(json.url);
      } else {
        alert('Không nhận được URL ảnh từ máy chủ.');
      }
    } catch (err) {
      alert('Không thể tải ảnh lên ImgBB.');
    } finally {
      setIsUploading(false);
    }
  };

  // Modal Form Submit
  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    // Synchronize ImgBB URL
    formData.set('image_url', imageUrl);

    startTransition(async () => {
      if (editingSound) {
        formData.set('id', editingSound.id);
        formData.set('sort_order', String(editingSound.sort_order));
      } else {
        // Calculate sort order for new items
        const maxSort = sounds.reduce((max, s) => Math.max(max, s.sort_order), 0);
        formData.set('sort_order', String(maxSort + 1));
      }
      
      await saveSound(formData);
      setIsOpen(false);
    });
  };

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1>Quản lý âm thanh</h1>
          <p>Thêm, sửa và quản lý các track nhạc nền/ASMR của hệ thống.</p>
        </div>
        <button 
          onClick={handleAddClick} 
          className={styles.button}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} />
          Thêm track
        </button>
      </header>

      <section className={styles.panel} style={{ marginTop: '20px' }}>
        <div className={styles.panelHeader}>
          <h2>Danh sách track âm thanh</h2>
          <span className={styles.muted}>{visibleSounds.length} mục</span>
        </div>

        <nav className={styles.filterNav} aria-label="Bộ lọc và tìm kiếm track âm thanh">
          <div className={styles.filterTabs}>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`${styles.filterTab} ${categoryFilter === cat ? styles.filterTabActive : ''}`}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat === 'all' ? 'Tất cả' : cat}
              </button>
            ))}
          </div>
          <label className={styles.orderSearch}>
            <Search size={16} />
            <input
              type="search"
              value={search}
              placeholder="Tìm theo tên, mood..."
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </nav>

        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: '80px' }}>Ảnh</th>
              <th>Tên track</th>
              <th>Danh mục</th>
              <th>Mood</th>
              <th>Thời lượng</th>
              <th style={{ textAlign: 'center' }}>Nghe thử</th>
              <th>Trạng thái</th>
              <th style={{ width: '120px' }}></th>
            </tr>
          </thead>
          <tbody>
            {visibleSounds.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#75667e' }}>
                  Không tìm thấy track âm thanh nào phù hợp.
                </td>
              </tr>
            )}
            {visibleSounds.map((sound) => {
              const isPlaying = playingId === sound.id;
              
              return (
                <tr key={sound.id}>
                  <td>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      background: '#f6eff7',
                      border: '1px solid #eadeee',
                      display: 'grid',
                      placeItems: 'center',
                      color: '#a084bc'
                    }}>
                      {sound.image_url ? (
                        <img src={sound.image_url} alt={sound.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Music size={18} />
                      )}
                    </div>
                  </td>
                  <td>
                    <strong>{sound.name}</strong>
                  </td>
                  <td>
                    <span style={{
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: 800,
                      borderRadius: '999px',
                      background: '#f2e8f5',
                      color: '#82659b',
                      border: '1px solid #e1d1e7'
                    }}>
                      {sound.category}
                    </span>
                  </td>
                  <td>
                    {sound.mood ? (
                      <span style={{ fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#5f5069' }}>
                        <Sparkles size={12} className={styles.muted} />
                        {sound.mood}
                      </span>
                    ) : (
                      <span className={styles.muted}>-</span>
                    )}
                  </td>
                  <td>
                    {sound.duration ? (
                      <span style={{ fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#5f5069' }}>
                        <Clock size={12} className={styles.muted} />
                        {sound.duration}
                      </span>
                    ) : (
                      <span className={styles.muted}>-</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => handlePlayToggle(sound)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: isPlaying ? '#ffe8ed' : '#f0ebf5',
                        color: isPlaying ? '#c94a6d' : '#8164a2',
                        border: 'none',
                        display: 'inline-grid',
                        placeItems: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        padding: 0
                      }}
                      title={isPlaying ? 'Tạm dừng' : 'Phát nhạc thử'}
                    >
                      {isPlaying ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: '1px' }} />}
                    </button>
                  </td>
                  <td>
                    <button
                      onClick={() => handleActiveToggle(sound)}
                      className={`${styles.status} ${!sound.is_active ? styles.statusOff : ''}`}
                      style={{ border: 'none', cursor: 'pointer' }}
                    >
                      {sound.is_active ? 'Đang hiện' : 'Đã ẩn'}
                    </button>
                  </td>
                  <td>
                    <div className={styles.actions} style={{ justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => handleEditClick(sound)} 
                        className={styles.ghostButton}
                        style={{ padding: '6px', minHeight: '30px' }}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(sound.id, sound.name)} 
                        className={styles.dangerButton}
                        style={{ padding: '6px', minHeight: '30px' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* CRUD Modal Dialog */}
      {isOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '600px' }}>
            <div className={styles.modalHeader}>
              <h3>{editingSound ? 'Chỉnh sửa track' : 'Thêm track âm thanh mới'}</h3>
              <button onClick={() => setIsOpen(false)} className={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit}>
              <div className={styles.modalBody} style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  
                  <label style={{ display: 'grid', gap: '6px', color: '#5f5069', fontSize: '13px', fontWeight: 800 }}>
                    Tên track
                    <input 
                      name="name" 
                      required 
                      defaultValue={editingSound?.name ?? ''} 
                      className={styles.inlineSelect}
                      style={{ padding: '8px 12px' }}
                    />
                  </label>

                  <label style={{ display: 'grid', gap: '6px', color: '#5f5069', fontSize: '13px', fontWeight: 800 }}>
                    Danh mục
                    <input 
                      name="category" 
                      required 
                      placeholder="ASMR, Nhạc thiền, Thư giãn..."
                      defaultValue={editingSound?.category ?? ''} 
                      className={styles.inlineSelect}
                      style={{ padding: '8px 12px' }}
                    />
                  </label>

                  <label style={{ display: 'grid', gap: '6px', color: '#5f5069', fontSize: '13px', fontWeight: 800 }}>
                    Mood (Cảm xúc phù hợp)
                    <input 
                      name="mood" 
                      placeholder="Tập trung, Ngủ ngon, Bình yên..."
                      defaultValue={editingSound?.mood ?? ''} 
                      className={styles.inlineSelect}
                      style={{ padding: '8px 12px' }}
                    />
                  </label>

                  <label style={{ display: 'grid', gap: '6px', color: '#5f5069', fontSize: '13px', fontWeight: 800 }}>
                    Thời lượng (định dạng mm:ss)
                    <input 
                      name="duration" 
                      placeholder="10:00"
                      defaultValue={editingSound?.duration ?? ''} 
                      className={styles.inlineSelect}
                      style={{ padding: '8px 12px' }}
                    />
                  </label>

                  <label style={{ display: 'grid', gap: '6px', color: '#5f5069', fontSize: '13px', fontWeight: 800 }}>
                    Tên Icon
                    <input 
                      name="icon" 
                      placeholder="rain, forest, music, wind..."
                      defaultValue={editingSound?.icon ?? ''} 
                      className={styles.inlineSelect}
                      style={{ padding: '8px 12px' }}
                    />
                  </label>

                  <div style={{ display: 'grid', gap: '6px', color: '#5f5069', fontSize: '13px', fontWeight: 800 }}>
                    <span>Ảnh nền (Upload lên ImgBB)</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
                      {imageUrl && (
                        <div style={{ position: 'relative', width: '36px', height: '36px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #eae1ec', flexShrink: 0 }}>
                          <img src={imageUrl} alt="Thumbnail preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button 
                            type="button" 
                            onClick={() => setImageUrl('')}
                            style={{ position: 'absolute', top: '1px', right: '1px', background: 'rgba(255, 255, 255, 0.8)', border: 'none', borderRadius: '50%', color: '#88223f', width: '14px', height: '14px', display: 'grid', placeItems: 'center', cursor: 'pointer', padding: 0 }}
                          >
                            <X size={9} />
                          </button>
                        </div>
                      )}
                      
                      <label style={{
                        flexGrow: 1,
                        height: '36px',
                        border: '2px dashed #ece3ee',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isUploading ? 'not-allowed' : 'pointer',
                        color: '#8a7a94',
                        background: '#faf6fc',
                        fontSize: '12px',
                        opacity: isUploading ? 0.6 : 1,
                        padding: '0 8px'
                      }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {isUploading ? 'Đang tải ảnh...' : imageUrl ? 'Thay đổi ảnh' : 'Chọn tệp ảnh từ máy'}
                        </span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageUpload} 
                          disabled={isUploading}
                          style={{ display: 'none' }} 
                        />
                      </label>
                    </div>
                  </div>

                  <label style={{ display: 'grid', gap: '6px', color: '#5f5069', fontSize: '13px', fontWeight: 800, gridColumn: 'span 2' }}>
                    Audio URL (Đường dẫn tệp âm thanh)
                    <input 
                      name="audio_url" 
                      required 
                      placeholder="https://cdn.pixabay.com/download/audio/..."
                      defaultValue={editingSound?.audio_url ?? ''} 
                      className={styles.inlineSelect}
                      style={{ padding: '8px 12px' }}
                    />
                  </label>

                  <label className={styles.checkbox} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5f5069', fontSize: '13px', fontWeight: 800, cursor: 'pointer', gridColumn: 'span 2', marginTop: '6px' }}>
                    <input 
                      name="is_active" 
                      type="checkbox" 
                      defaultChecked={editingSound ? editingSound.is_active : true} 
                    />
                    Cho phép phát track này trên ứng dụng
                  </label>

                </div>
              </div>
              
              <div className={styles.modalFooter}>
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)} 
                  className={styles.ghostButton}
                  disabled={isPending || isUploading}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className={styles.button}
                  disabled={isPending || isUploading}
                >
                  {isPending ? 'Đang lưu...' : 'Lưu track'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
