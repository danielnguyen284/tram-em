import { createClient } from '@/utils/supabase/server';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

type ImgBbResponse = {
  data?: {
    url?: string;
    display_url?: string;
  };
  error?: {
    message?: string;
  };
  success?: boolean;
};

export async function POST(request: Request) {
  const apiKey = process.env.IMGBB_API_KEY;

  if (!apiKey) {
    return Response.json({ error: 'Thiếu IMGBB_API_KEY trong .env.' }, { status: 500 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Bạn cần đăng nhập để tải ảnh lên.' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') || formData.get('image');

    if (!(file instanceof File)) {
      return Response.json({ error: 'Vui lòng chọn một file ảnh.' }, { status: 400 });
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return Response.json({ error: 'Ảnh chỉ hỗ trợ định dạng PNG, JPG, GIF hoặc WebP.' }, { status: 400 });
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return Response.json({ error: 'Dung lượng ảnh tối đa là 10MB.' }, { status: 400 });
    }

    const uploadForm = new FormData();
    uploadForm.append('image', file);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: uploadForm,
    });

    const payload = (await response.json()) as ImgBbResponse;
    const imageUrl = payload.data?.display_url ?? payload.data?.url;

    if (!response.ok || !imageUrl) {
      return Response.json(
        { error: payload.error?.message ?? 'Không thể upload ảnh lên ImgBB.' },
        { status: response.status || 502 },
      );
    }

    return Response.json({ url: imageUrl });
  } catch (err: any) {
    return Response.json({ error: err.message || 'Lỗi hệ thống khi tải ảnh lên.' }, { status: 500 });
  }
}
