/** コンテナ幅から SVG の表示サイズを決める。
 * 高さは幅との比率だけから出す。viewBox はこのサイズに一致させる。
 * https://visualizing.jp/responsive-d3/
 */
export function chartFrame(containerWidth: number): { width: number; height: number } {
  const width = Math.max(0, Math.floor(containerWidth));
  if (width === 0) return { width: 0, height: 0 };
  const ratio = width <= 480 ? 3 / 4 : width <= 768 ? 4 / 3 : 960 / 560;
  return { width, height: Math.max(1, Math.round(width / ratio)) };
}

export function estimateTextWidth(text: string, fontSize: number): number {
  let width = 0;
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    width += code <= 0x7f ? fontSize * 0.56 : fontSize;
  }
  return width;
}

export function tipPoint(
  event: { clientX: number; clientY: number },
  box: DOMRect,
): { x: number; y: number } {
  const tipW = 220;
  const tipH = 52;
  let x = event.clientX - box.left + 12;
  let y = event.clientY - box.top - tipH;
  if (x + tipW > box.width - 4) x = event.clientX - box.left - tipW - 12;
  if (x < 4) x = 4;
  if (y < 4) y = event.clientY - box.top + 16;
  if (y + tipH > box.height - 4) y = Math.max(4, box.height - tipH - 4);
  return { x, y };
}
