import { createClient } from '@/utils/supabase/server';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

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
    return Response.json({ error: 'Bạn cần đăng nhập để đổi avatar.' }, { status: 401 });
  }

  const formData = await request.formData();
  const avatar = formData.get('avatar');

  if (!(avatar instanceof File)) {
    return Response.json({ error: 'Vui lòng chọn một ảnh avatar.' }, { status: 400 });
  }

  if (!ALLOWED_AVATAR_TYPES.has(avatar.type)) {
    return Response.json({ error: 'Avatar chỉ hỗ trợ PNG, JPG hoặc WebP.' }, { status: 400 });
  }

  if (avatar.size > MAX_AVATAR_SIZE) {
    return Response.json({ error: 'Avatar tối đa 5MB.' }, { status: 400 });
  }

  const uploadForm = new FormData();
  uploadForm.append('image', avatar);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body: uploadForm,
  });

  const payload = (await response.json()) as ImgBbResponse;
  const avatarUrl = payload.data?.display_url ?? payload.data?.url;

  if (!response.ok || !avatarUrl) {
    return Response.json(
      { error: payload.error?.message ?? 'ImgBB không nhận ảnh này.' },
      { status: response.status || 502 },
    );
  }

  const { error } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      display_name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? null,
      avatar_url: avatarUrl,
    },
    { onConflict: 'id' },
  );

  if (error) {
    return Response.json({ error: 'Đã upload ảnh nhưng chưa lưu được hồ sơ.' }, { status: 500 });
  }

  return Response.json({ avatarUrl });
}
