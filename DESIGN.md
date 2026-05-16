# 🎨 TRẠM ÊM — Design System

> Tài liệu thiết kế chính thức được trích xuất từ mockups. Mọi implementation **BẮT BUỘC** tuân thủ tài liệu này.

---

## 1. Thương hiệu (Brand Identity)

### 1.1 Tên & Logo
- **Tên:** TRẠM ÊM
- **Logo:** Icon đám mây dễ thương (kawaii cloud) màu trắng/tím nhạt, có mặt cười
- **Tagline:** "Nơi cảm xúc được lắng nghe, thấu hiểu và chữa lành mỗi ngày 💜"

### 1.2 Giọng điệu (Tone of Voice)
- Nhẹ nhàng, ấm áp, gần gũi
- Dùng "bạn" thay vì "quý khách" — cảm giác như người bạn thân
- Emoji sử dụng tiết chế: 💜 💚 ❤️ (heart-based)

---

## 2. Bảng màu (Color Palette)

### 2.1 Màu chính (Primary)

| Token | Hex | Mô tả | Sử dụng |
|---|---|---|---|
| `--color-primary` | `#8B6AAD` | Tím lavender chủ đạo | CTA buttons, active states, links |
| `--color-primary-light` | `#C4A8E0` | Tím nhạt | Hover states, sidebar active bg |
| `--color-primary-soft` | `#E8D5F5` | Tím rất nhạt | Tag backgrounds, pill buttons |
| `--color-primary-bg` | `#F5EEFA` | Tím pastel nền | Card backgrounds, section tints |

### 2.2 Màu nền (Background)

| Token | Hex | Mô tả |
|---|---|---|
| `--color-bg-page` | `#FAF7FC` | Nền trang chính — tím hồng rất nhạt |
| `--color-bg-sidebar` | `#F3EDF8` | Nền sidebar — nhỉnh hơn 1 shade |
| `--color-bg-card` | `#FFFFFF` | Nền card — trắng tinh |
| `--color-bg-input` | `#FFFFFF` | Nền input field |
| `--color-bg-player` | `#F8F4FB` | Nền audio player bar |

### 2.3 Màu chữ (Typography Colors)

| Token | Hex | Sử dụng |
|---|---|---|
| `--color-text-primary` | `#2D1B4E` | Heading chính, tiêu đề lớn |
| `--color-text-secondary` | `#5C4A72` | Body text, mô tả |
| `--color-text-muted` | `#9B8AAF` | Caption, thời lượng, metadata |
| `--color-text-on-primary` | `#FFFFFF` | Chữ trên nền tím (CTA buttons) |

### 2.4 Màu phụ trợ (Accent)

| Token | Hex | Sử dụng |
|---|---|---|
| `--color-accent-pink` | `#E8A0BF` | Heart icon, notification dot |
| `--color-accent-green` | `#A8D5BA` | Success states, wellness indicators |
| `--color-accent-warm` | `#F2D4A7` | Badge backgrounds, star ratings |
| `--color-border` | `#E8DFF0` | Viền card, divider lines |

### 2.5 Dark Mode

| Token Light | Token Dark | Hex Dark |
|---|---|---|
| `--color-bg-page` | `--color-bg-page-dark` | `#1A1225` |
| `--color-bg-sidebar` | `--color-bg-sidebar-dark` | `#231832` |
| `--color-bg-card` | `--color-bg-card-dark` | `#2A1F3D` |
| `--color-text-primary` | `--color-text-primary-dark` | `#E8DFF0` |
| `--color-text-secondary` | `--color-text-secondary-dark` | `#C4A8E0` |
| `--color-primary` | `--color-primary-dark` | `#A78BCA` |

> **Quy tắc Dark Mode:** Auto-switch dựa vào `prefers-color-scheme` hoặc giờ hệ thống (19:00–06:00). Toggle thủ công luôn có sẵn.

---

## 3. Typography

### 3.1 Font Family
- **Heading:** `'Be Vietnam Pro', sans-serif` — weight 600–700
- **Body:** `'Be Vietnam Pro', sans-serif` — weight 400–500
- **Fallback:** `'Inter', 'Segoe UI', system-ui, sans-serif`

### 3.2 Scale

| Token | Size | Weight | Line Height | Sử dụng |
|---|---|---|---|---|
| `--text-hero` | 40px | 700 | 1.2 | "TRẠM ÊM" hero heading |
| `--text-h1` | 32px | 700 | 1.3 | Page titles ("Âm thanh thư giãn") |
| `--text-h2` | 24px | 600 | 1.3 | Section titles ("Hôm nay bạn muốn làm gì?") |
| `--text-h3` | 18px | 600 | 1.4 | Card titles, subsection |
| `--text-body` | 15px | 400 | 1.6 | Paragraph, descriptions |
| `--text-small` | 13px | 400 | 1.5 | Captions, metadata, timestamps |
| `--text-tiny` | 11px | 500 | 1.4 | Tags, badges |

### 3.3 Phong cách chữ Heading
- Page titles sử dụng style **italic** nhẹ hoặc chữ viết tay tùy trang
- Tagline dưới heading dùng weight 400, color `--color-text-secondary`

---

## 4. Layout

### 4.1 Cấu trúc tổng thể

```
┌─────────────────────────────────────────────────┐
│  Top Navigation Bar (fixed)                      │
├──────────┬──────────────────────────────────────┤
│          │                                       │
│ Sidebar  │          Main Content                 │
│ (fixed)  │          (scrollable)                 │
│ ~220px   │                                       │
│          │                                       │
├──────────┴──────────────────────────────────────┤
│  Audio Player Bar (fixed bottom) — chỉ ở Âm thanh│
└─────────────────────────────────────────────────┘
```

### 4.2 Top Navigation Bar
- **Chiều cao:** 64px
- **Nền:** `--color-bg-card` (trắng) hoặc `--color-bg-page` với blur
- **Logo:** Bên trái — icon cloud + "TRẠM ÊM"
- **Menu items:** Giữa — `Trang chủ | Âm thanh | Mini game | Viết cảm xúc | Cộng đồng | AI đồng hành`
- **Actions:** Bên phải — Search icon, Notification bell, Avatar + Tên
- **Font menu:** `--text-body`, weight 500
- **Active state:** Font weight 600 + underline tím hoặc highlight background

### 4.3 Sidebar (Left)
- **Chiều rộng:** 220px (desktop), collapsed on mobile
- **Nền:** `--color-bg-sidebar`
- **Border-right:** `1px solid --color-border`
- **Menu items:**
  - Icon (outline style, 20px) + Label
  - Padding: 12px 16px
  - Border-radius: 12px (cho active item)
  - Active: nền `--color-primary-soft`, text `--color-primary`
  - Hover: nền `--color-primary-bg`
- **Menu chính:** Trang chủ, Âm thanh, Mini game, Viết cảm xúc, Cộng đồng, AI đồng hành, Cửa hàng
- **Admin Sidebar:** Tổng quan, Âm thanh, Sản phẩm, Đơn hàng, Người dùng, Thống kê

### 4.4 Spacing System

| Token | Value | Sử dụng |
|---|---|---|
| `--space-xs` | 4px | Gaps nhỏ bên trong component |
| `--space-sm` | 8px | Padding nhỏ, icon gaps |
| `--space-md` | 16px | Card padding, list gaps |
| `--space-lg` | 24px | Section spacing |
| `--space-xl` | 32px | Major section dividers |
| `--space-2xl` | 48px | Page top/bottom padding |

### 4.5 Grid
- **Content cards (Âm thanh):** 4 columns, gap 24px
- **Game cards (Mini game):** 4 columns, gap 20px
- **Suggestion cards (Trang chủ):** 4 columns horizontal scroll
- **Responsive:** 4 → 3 → 2 → 1 columns (breakpoints below)

### 4.6 Breakpoints

| Token | Value | Layout |
|---|---|---|
| `--bp-desktop` | ≥1200px | Sidebar + 4-col content |
| `--bp-tablet` | 768–1199px | Collapsed sidebar + 2-3 col |
| `--bp-mobile` | <768px | No sidebar + 1-2 col, bottom nav |

---

## 5. Components

### 5.1 Cards

#### Audio/Sound Card
```
┌──────────────────────┐
│  ┌──────────────────┐ │
│  │   Thumbnail      │ │
│  │   (16:9 ratio)   │ │
│  │       ▶ (play)   │ │
│  └──────────────────┘ │
│  Title (--text-h3)    │
│  Duration (--text-small, muted) │
└──────────────────────┘
```
- Border-radius: **16px**
- Background: `--color-bg-card`
- Box-shadow: `0 2px 12px rgba(139, 106, 173, 0.08)`
- Hover: shadow tăng lên + translateY(-2px)
- Play button: circle 40px, nền trắng semi-transparent, icon ▶

#### Game Card
```
┌──────────────────────┐
│  ┌──────────────────┐ │
│  │   Game Preview   │ │
│  │   (1:1 ratio)    │ │
│  │       ▶          │ │
│  └──────────────────┘ │
│  Game Name             │
│  ⭐⭐⭐⭐☆ (rating)   │
│  Mô tả ngắn           │
└──────────────────────┘
```
- Border-radius: **16px**
- Thumbnail ratio: **1:1** (vuông)
- Rating: Star icons, màu `--color-accent-warm`

#### Feature Card (Trang chủ — "Hôm nay bạn muốn làm gì?")
```
┌────────────────┐
│    🎵 (icon)   │
│  Nghe nhạc     │
│  thư giãn      │
│  Mô tả ngắn   │
└────────────────┘
```
- Border: `1px solid --color-border`
- Border-radius: **16px**
- Icon: 40px, màu `--color-primary`
- Padding: 24px
- Hover: border-color → `--color-primary-light`

### 5.2 Buttons

| Variant | Background | Text | Border | Border-radius |
|---|---|---|---|---|
| **Primary** | `--color-primary` | white | none | 24px (pill) |
| **Secondary** | transparent | `--color-text-primary` | `1px solid --color-border` | 24px (pill) |
| **Filter/Tag** | `--color-primary-soft` (active) / transparent | `--color-primary` (active) / `--color-text-secondary` | `1px solid --color-border` | 20px (pill) |
| **Ghost** | transparent | `--color-primary` | none | 8px |

- **Padding:** 10px 24px (primary/secondary), 8px 20px (filter)
- **Font:** `--text-body`, weight 500
- **Hover transition:** 0.2s ease
- **Primary hover:** brightness tăng nhẹ, shadow nhẹ
- **CTA chính trên hero:** gradient tím nhạt → tím hoặc solid `--color-primary`

### 5.3 Audio Player Bar (Fixed Bottom)
- **Vị trí:** Fixed bottom, full-width content area
- **Chiều cao:** 80px
- **Nền:** `--color-bg-player` với `backdrop-filter: blur(10px)`
- **Elements:**
  - Thumbnail nhỏ (48x48, border-radius 8px)
  - Tên bài + progress bar (tím)
  - Controls: Shuffle, Previous, Play/Pause (lớn nhất, circle 56px tím), Next, Repeat
- **Border-top:** `1px solid --color-border`

### 5.4 Community Post Card
```
┌──────────────────────────────────────┐
│  [Avatar] Name              ···      │
│           Timestamp                  │
│                                      │
│  Post content text...                │
│                                      │
│  ┌──────────────────────────────┐    │
│  │    Attached Image            │    │
│  └──────────────────────────────┘    │
│                                      │
│  ❤️ 16K  💬 24         #hashtag      │
└──────────────────────────────────────┘
```
- Border-radius: **12px**
- Nền: `--color-bg-card`
- Avatar: 44px circle
- Heart icon: `--color-accent-pink`
- Hashtag: `--color-primary`

### 5.5 AI Chatbot Interface
- **Mascot:** Robot tròn dễ thương, màu tím nhạt + trắng
- **Chat bubbles:**
  - AI (bên trái): nền `--color-bg-card`, border `--color-border`, border-radius 16px
  - User (bên phải): nền `--color-primary`, text trắng, border-radius 16px
- **Suggested prompts:** Pill buttons hàng ngang dưới chat
- **Input bar:** Fixed bottom, border-radius 28px, nền trắng, shadow nhẹ
- **Voice button:** Circle, nền `--color-primary`, icon microphone trắng
- **Right sidebar:** Danh sách chủ đề trò chuyện (text links)

### 5.6 Profile / Hồ sơ
- **Avatar:** 96px circle, có badge "+" để đổi ảnh
- **Stats cards:** 4 cards ngang, border-radius 16px, nền trắng
  - Số lớn (--text-hero, --color-primary)
  - Label nhỏ bên dưới
- **Badges/Huy hiệu:** Grid 4 columns, mỗi badge có:
  - Illustration tròn dễ thương
  - Tên badge (bold)
  - Mô tả ngắn (muted)

### 5.7 Shop & Product Components

#### Product Card
```
┌──────────────────────┐
│  ┌──────────────────┐ │
│  │   Product Image  │ │
│  │   (3:2 ratio)    │ │
│  └──────────────────┘ │
│  Product Name         │
│  Description (short)  │
│  ⭐⭐⭐⭐☆ (rating)   │
│  Price (VND)          │
└──────────────────────┘
```
- Border-radius: **16px**
- Background: `--color-bg-card`
- Hover: Shadow tăng, translateY(-4px)
- Price: Bold, màu `--color-text-primary`

#### Cart Icon (Top Nav)
- Icon giỏ hàng với badge số lượng màu `--color-accent-pink`.

### 5.8 Admin Dashboard Components

#### Statistic Card
- Nền trắng, border nhạt, icon màu pastel.
- Biểu đồ đường (Line chart) mượt mà cho thấy xu hướng stress/truy cập.

#### Admin Data Table
- Tối giản, không viền dọc, xen kẽ màu nền `--color-bg-page`.

### 5.9 Form Inputs
- **Border:** `1px solid --color-border`
- **Border-radius:** 12px (text input), 28px (search input pill)
- **Padding:** 12px 16px
- **Focus:** border-color `--color-primary`, box-shadow `0 0 0 3px --color-primary-bg`
- **Placeholder:** `--color-text-muted`, italic

### 5.8 Icons
- **Style:** Outline (không filled), stroke-width 1.5–2px
- **Size:** 20px (sidebar), 24px (actions), 40px (feature cards)
- **Color:** `--color-text-secondary` (default), `--color-primary` (active)
- **Recommended library:** Lucide Icons hoặc Phosphor Icons

---

## 6. Hiệu ứng & Animation

### 6.1 Transitions
- **Default:** `all 0.3s ease`
- **Hover cards:** `transform 0.3s ease, box-shadow 0.3s ease`
- **Page transitions:** Fade-in `0.4s ease`
- **Sidebar active:** Background color `0.2s ease`

### 6.2 Hover Effects
- **Cards:** `translateY(-2px)` + shadow tăng
- **Buttons:** Brightness tăng nhẹ hoặc scale(1.02)
- **Menu items:** Background color fade-in
- **Không bao giờ:** Bounce, shake, flash — giữ mọi thứ calm

### 6.3 Scroll Behavior
- `scroll-behavior: smooth`
- Lazy load images với fade-in khi xuất hiện trong viewport

### 6.4 Quy tắc tuyệt đối
- ❌ KHÔNG dùng animation nhanh (<0.2s)
- ❌ KHÔNG dùng hiệu ứng nhấp nháy (blink, flash)
- ❌ KHÔNG dùng parallax mạnh hoặc scroll hijacking
- ❌ KHÔNG dùng pop-up bất ngờ
- ✅ Mọi chuyển động phải nhẹ nhàng, dự đoán được

---

## 7. Illustrations & Imagery

### 7.1 Phong cách hình ảnh
- **Thumbnails âm thanh/game:** Tranh phong cảnh thiên nhiên, tông pastel, dreamy
  - Hoàng hôn, rừng cây, sông nước, bầu trời đêm
  - Palette ấm: tím, hồng, xanh dương đậm, vàng cam nhạt
- **Game art:** Vector/pixel dễ thương, flat illustration
- **Badge illustrations:** Nhân vật chibi/kawaii, vẽ tay style

### 7.2 Thumbnail Specs
- **Âm thanh:** 16:9 ratio, border-radius 12px
- **Mini game:** 1:1 ratio (vuông), border-radius 12px
- **Community attached image:** Tự do ratio, border-radius 8px, max-height 400px

---

## 8. Sitemap & Navigation Structure

```
Trang chủ ─────────── Hero + Quick Actions + Gợi ý hôm nay
Âm thanh ──────────── Filter tabs + Grid cards + Player bar
Mini game ─────────── Filter tabs + Grid cards + Rating
Viết cảm xúc ─────── (Emotion journal / writing space)
Cộng đồng ─────────── Feed posts + Sidebar "Chủ đề nổi bật"
AI đồng hành ──────── Chat interface + Topic sidebar
Cửa hàng ──────────── Banner + Product Grid + Story section
Hồ sơ ─────────────── Stats + Badges + Settings
Admin Dashboard ───── Charts + Management Tables
```

### Navigation Items (chính xác theo mockup)
1. 🏠 Trang chủ
2. 🎵 Âm thanh
3. 🎮 Mini game
4. ✏️ Viết cảm xúc
5. 👥 Cộng đồng
6. 🤖 AI đồng hành
7. 🛒 Cửa hàng

---

## 9. Tham chiếu Mockup

| Trang | File | Ghi chú |
|---|---|---|
| Trang chủ | `mockups/trangchu.jpg` | Hero banner, quick actions grid, suggestion carousel |
| Âm thanh | `mockups/amthanh.jpg` | Filter tabs, audio grid, fixed player bar |
| Mini game | `mockups/minigame.jpg` | Game grid vuông, star ratings |
| AI đồng hành | `mockups/ai.jpg` | Chat bubbles, robot mascot, topic sidebar |
| Hồ sơ | `mockups/hoso.jpg` | Stats cards, badge collection |
| Cộng đồng | `mockups/vietcamxuc.jpg` | Post feed, trending sidebar |
| Cửa hàng | `mockups/cuahang.jpg` | Product grid, healing store theme |
