import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

export interface ClaudeResult {
  answer: string;
  confidence: number; // 0〜10の整数
}

export async function askClaude(
  userMessage: string,
  faqs: FaqItem[]
): Promise<ClaudeResult> {
  const faqText = faqs
    .map((f) => `Q: ${f.question}\nA: ${f.answer}（カテゴリ: ${f.category}）`)
    .join("\n\n");

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: `あなたは美容室のLINE Botアシスタントです。
提供されたFAQ情報をもとにユーザーの質問に日本語で丁寧に回答してください。
質問・問い合わせ（例：営業時間は？駐車場は？）には前置きなしで直接答えてください。「かしこまりました」「承知いたしました」は、予約・変更などの依頼に対する返答の場合のみ使ってください。
必ず以下のJSON形式のみを返してください。前後に余分なテキストを含めないでください。

{
  "answer": "回答文（敬語で丁寧に）",
  "confidence": 0〜10の整数
}

confidenceの判定基準（厳守）:
- 8〜10: FAQに直接該当する記述があり、断定できる
- 6〜7: FAQに関連する情報はあるが、断定はできない
- 5以下: FAQに直接該当する記述がない場合は必ず5以下にすること`,
    messages: [
      {
        role: "user",
        content: `## FAQ一覧\n${faqText}\n\n## ユーザーの質問\n${userMessage}`,
      },
    ],
  });

  const block = message.content[0];
  if (block.type !== "text") throw new Error("Unexpected Claude response type");

  const jsonMatch = block.text.match(/\{[\s\S]*?\}/);
  if (!jsonMatch) throw new Error(`JSON not found in Claude response: ${block.text}`);

  const parsed = JSON.parse(jsonMatch[0]) as ClaudeResult;
  const c = parsed.confidence;
  if (!parsed.answer || typeof c !== "number" || !Number.isInteger(c) || c < 0 || c > 10) {
    throw new Error(`Invalid Claude response format: ${jsonMatch[0]}`);
  }

  return parsed;
}
