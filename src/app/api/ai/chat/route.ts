import Groq from 'groq-sdk';
import type { ChatMessage, Product } from '@/types/database';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

type ChatPayload = {
  message: string;
  history: Pick<ChatMessage, 'role' | 'content'>[];
};

type ProductPromptItem = Pick<Product, 'name' | 'slug' | 'category' | 'price' | 'description' | 'tags'>;

function isChatPayload(value: unknown): value is ChatPayload {
  if (!value || typeof value !== 'object') return false;

  const payload = value as Record<string, unknown>;
  if (typeof payload.message !== 'string') return false;
  if (!Array.isArray(payload.history)) return false;

  return payload.history.every((item) => {
    if (!item || typeof item !== 'object') return false;
    const message = item as Record<string, unknown>;
    return (
      (message.role === 'user' || message.role === 'assistant') &&
      typeof message.content === 'string'
    );
  });
}

function formatVnd(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

function buildProductContext(products: ProductPromptItem[]) {
  if (products.length === 0) return 'Hiện chưa có sản phẩm khả dụng để gợi ý.';

  return products
    .map((product) => {
      const tags = product.tags.length > 0 ? `; tags: ${product.tags.join(', ')}` : '';
      return `- ${product.name} (${product.category}, ${formatVnd(product.price)}): ${product.description}${tags}. Link: /shop/${product.slug}`;
    })
    .join('\n');
}

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY?.trim();

  if (!apiKey) {
    return Response.json({ error: 'Thiếu GROQ_API_KEY trong .env.' }, { status: 500 });
  }

  if (apiKey === 'your-groq-api-key' || !apiKey.startsWith('gsk_')) {
    return Response.json(
      { error: 'GROQ_API_KEY trong .env chưa hợp lệ. Hãy thay bằng API key thật từ Groq và restart dev server.' },
      { status: 401 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Bạn cần đăng nhập để trò chuyện với Em AI.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!isChatPayload(body)) {
    return Response.json({ error: 'Dữ liệu chat không hợp lệ.' }, { status: 400 });
  }

  const text = body.message.trim();
  if (!text) {
    return Response.json({ error: 'Tin nhắn không được để trống.' }, { status: 400 });
  }

  const { data: products } = await supabase
    .from('products')
    .select('name, slug, category, price, description, tags')
    .eq('is_active', true)
    .gt('stock', 0)
    .order('created_at', { ascending: false })
    .limit(6);

  const productContext = buildProductContext((products ?? []) as ProductPromptItem[]);
  const groq = new Groq({ apiKey });

  try {
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL ?? 'llama-3.1-8b-instant',
      temperature: 0.72,
      max_completion_tokens: 180,
      messages: [
        {
          role: 'system',
          content: [
            'Bạn là Em AI của Trạm Êm, một người đồng hành cảm xúc bằng tiếng Việt.',
            'Bạn LUÔN LUÔN lắng nghe và phản hồi với sự đồng cảm về MỌI chủ đề cảm xúc mà người dùng chia sẻ: ngoại hình, cân nặng, hình thể, tự ti, lo âu, căng thẳng, các mối quan hệ, công việc, gia đình, cô đơn, buồn bã, v.v. KHÔNG từ chối, KHÔNG chuyển hướng sang chuyên gia trừ khi có dấu hiệu khủng hoảng thật sự.',
            'Luôn xưng là "mình" và gọi người dùng là "bạn" trong mọi câu trả lời. Không dùng "tôi", "em", "anh", "chị" hay bất kỳ đại từ nào khác.',
            'Trả lời ngắn gọn trong 2-4 câu, ấm áp, tập trung vào cảm xúc và tâm lý của người dùng.',
            'Không chẩn đoán y khoa, không nói dài, không liệt kê nhiều bước.',
            'Kết thúc bằng tối đa 1 câu hỏi gợi mở nhẹ nhàng nếu phù hợp.',
            'CHỈ gợi ý sản phẩm khi chủ đề TRỰC TIẾP liên quan đến công dụng sản phẩm đó (ví dụ: mất ngủ → sản phẩm hỗ trợ giấc ngủ; lo âu → tinh dầu thư giãn). Tối đa 1 sản phẩm, nêu tên, lý do ngắn và đường dẫn như /shop/ten-san-pham. KHÔNG gợi ý sản phẩm khi chủ đề chỉ là trò chuyện thông thường về cảm xúc.',
            'TUYỆT ĐỐI KHÔNG thêm bất kỳ ghi chú nội bộ, chú thích hay nhận xét về hành động của mình vào câu trả lời (ví dụ: không viết "(Chưa gợi ý sản phẩm)", "(Đang lắng nghe)" hay bất kỳ nội dung trong ngoặc tương tự). Chỉ viết câu trả lời dành cho người dùng.',
            'Nếu người dùng có dấu hiệu tự hại rõ ràng hoặc nguy hiểm tức thời, ưu tiên khuyên họ liên hệ người thân/chuyên gia/dịch vụ khẩn cấp.',
            `Danh sách sản phẩm (chỉ dùng khi hợp ngữ cảnh):\n${productContext}`,
          ].join('\n'),
        },
        ...body.history.slice(-12).map((message) => ({
          role: message.role,
          content: message.content.slice(0, 600),
        })),
        {
          role: 'user',
          content: text.slice(0, 800),
        },
      ],
    });

    const reply = completion.choices[0]?.message.content?.trim();
    if (!reply) {
      return Response.json({ error: 'Groq không trả về nội dung phản hồi.' }, { status: 502 });
    }

    return Response.json({ reply });
  } catch (error) {
    console.error('Groq chat error:', error);
    return Response.json({ error: 'Không gọi được Groq API. Kiểm tra GROQ_API_KEY/GROQ_MODEL và restart dev server nếu vừa đổi .env.' }, { status: 502 });
  }
}
