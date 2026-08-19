import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

export interface ClaudeResult {
  answer: string;
  confidence: "高" | "中" | "低";
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
必ず以下のJSON形式のみを返してください。前後に余分なテキストを含めないでください。

{
  "answer": "回答文（敬語で丁寧に）",
  "confidence": "高" | "中" | "低"
}

confidenceの判定基準:
- 高: FAQの内容だけで自信を持って正確に答えられる
- 中: FAQに関連情報はあるが断定できない、または補足が必要
- 低: FAQに該当情報がなく一般論でしか答えられない`,
    messages: [
      {
        role: "user",
        content: `## FAQ一覧\n${faqText}\n\n## ユーザーの質問\n${userMessage}`,
      },
    ],
  });

  const block = message.content[0];
  if (block.type !== "text") throw new Error("Unexpected Claude response type");

  // マークダウンコードブロックやテキストに囲まれていても抽出できるようにする
  const jsonMatch = block.text.match(/\{[\s\S]*?\}/);
  if (!jsonMatch) throw new Error(`JSON not found in Claude response: ${block.text}`);

  const parsed = JSON.parse(jsonMatch[0]) as ClaudeResult;
  if (!parsed.answer || !["高", "中", "低"].includes(parsed.confidence)) {
    throw new Error(`Invalid Claude response format: ${jsonMatch[0]}`);
  }

  return parsed;
}
