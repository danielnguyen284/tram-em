import { getCurrentRole } from '@/lib/admin/auth';
import { createAdminSupabaseClient } from '@/lib/admin/supabase';

const AUDIO_BUCKET = process.env.SUPABASE_AUDIO_BUCKET || 'soundscape-audio';
const MAX_AUDIO_SIZE_MB = Number(process.env.SUPABASE_MAX_AUDIO_UPLOAD_MB ?? 100);
const MAX_AUDIO_SIZE = MAX_AUDIO_SIZE_MB * 1024 * 1024;

const ALLOWED_AUDIO_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/webm',
  'audio/mp4',
  'audio/aac',
]);

const extensionByType: Record<string, string> = {
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/ogg': 'ogg',
  'audio/webm': 'webm',
  'audio/mp4': 'm4a',
  'audio/aac': 'aac',
};

const allowedAudioTypes = Array.from(ALLOWED_AUDIO_TYPES);

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 80);
}

function getExtension(file: File) {
  const fromType = extensionByType[file.type];
  if (fromType) return fromType;

  const namePart = file.name.split('.').pop()?.toLowerCase();
  if (namePart && /^[a-z0-9]{2,5}$/.test(namePart)) return namePart;

  return 'mp3';
}

async function ensureAudioBucket(supabase: ReturnType<typeof createAdminSupabaseClient>) {
  const { data } = await supabase.storage.getBucket(AUDIO_BUCKET);

  if (data) return;

  const { error } = await supabase.storage.createBucket(AUDIO_BUCKET, {
    public: true,
    fileSizeLimit: `${MAX_AUDIO_SIZE_MB}MB`,
    allowedMimeTypes: allowedAudioTypes,
  });

  if (error && !error.message.toLowerCase().includes('already exists')) {
    throw new Error(`Không thể tạo bucket "${AUDIO_BUCKET}": ${error.message}`);
  }
}

async function uploadAudioObject(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  objectName: string,
  body: ArrayBuffer,
  contentType: string,
) {
  return supabase.storage.from(AUDIO_BUCKET).upload(objectName, body, {
    cacheControl: '31536000',
    contentType,
    upsert: false,
  });
}

export async function POST(request: Request) {
  const identity = await getCurrentRole();

  if (!identity.user) {
    return Response.json({ error: 'Ban can dang nhap de upload audio.' }, { status: 401 });
  }

  if (identity.role !== 'admin') {
    return Response.json({ error: 'Ban khong co quyen upload audio.' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') || formData.get('audio');

    if (!(file instanceof File)) {
      return Response.json({ error: 'Vui long chon mot file audio.' }, { status: 400 });
    }

    if (!ALLOWED_AUDIO_TYPES.has(file.type)) {
      return Response.json(
        { error: 'Audio chi ho tro MP3, WAV, OGG, WebM, M4A hoac AAC.' },
        { status: 400 },
      );
    }

    if (file.size > MAX_AUDIO_SIZE) {
      return Response.json({ error: `Dung luong audio toi da la ${MAX_AUDIO_SIZE_MB}MB.` }, { status: 400 });
    }

    const soundName = String(formData.get('soundName') ?? file.name).trim();
    const soundId = String(formData.get('soundId') ?? '').trim();
    const folder = slugify(soundName || soundId || 'sound');
    const extension = getExtension(file);
    const objectName = `${folder}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const supabase = createAdminSupabaseClient();
    await ensureAudioBucket(supabase);

    const body = await file.arrayBuffer();
    let { error } = await uploadAudioObject(supabase, objectName, body, file.type);

    if (error && error.message.toLowerCase().includes('bucket not found')) {
      await ensureAudioBucket(supabase);
      const retry = await uploadAudioObject(supabase, objectName, body, file.type);
      error = retry.error;
    }

    if (error) {
      return Response.json(
        {
          error: `Không thể upload audio lên Supabase Storage: ${error.message}`,
          bucket: AUDIO_BUCKET,
        },
        { status: 502 },
      );
    }

    const { data } = supabase.storage.from(AUDIO_BUCKET).getPublicUrl(objectName);

    return Response.json({
      url: data.publicUrl,
      path: objectName,
      bucket: AUDIO_BUCKET,
      contentType: file.type,
      size: file.size,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Loi he thong khi upload audio.';
    return Response.json({ error: message }, { status: 500 });
  }
}
