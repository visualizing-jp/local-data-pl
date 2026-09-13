/**
 * データ取得・構築の共通 CLI。
 *
 *   --pref=群馬県   その県だけ処理する（既存の data/raw を取り直さない）
 *   --pref 群馬県
 */

export function cliPrefecture(): string | undefined {
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i] ?? "";
    if (a === "--pref" || a === "--prefecture") {
      const v = argv[i + 1];
      if (v == null || v.startsWith("-")) throw new Error(`${a} の値がありません`);
      return v;
    }
    if (a.startsWith("--pref=")) return a.slice("--pref=".length);
    if (a.startsWith("--prefecture=")) return a.slice("--prefecture=".length);
  }
  return undefined;
}

export function requireCatalogPrefecture(pref: string | undefined, known: readonly string[]): string | undefined {
  if (pref == null || pref === "") return undefined;
  if (!known.includes(pref)) {
    const list = [...new Set(known)].join("、");
    throw new Error(`未知の県: ${pref}（収録は ${list}）`);
  }
  return pref;
}
