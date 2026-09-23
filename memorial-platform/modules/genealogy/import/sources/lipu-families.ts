/**
 * 纸质家谱录入的族谱数据 — 从扫描出版物 OCR + 结构化而来。
 *
 * 首部：《李氏族谱·陇西贵州李代龙支系谱》第二卷（公开出版物，谱内族人授权上线）。
 * 每支一个 `*.lipu.data.json`（由 scripts/lipu/build_lipu_dataset.py 生成），
 * 静态 import 以便 Vercel serverless 打包（运行时 readdir 不会被追踪）。
 *
 * 后台键带 `lipu:` 前缀，seed 路由据此与 wikidata/zhwiki 源区分。
 */
import type { GenealogyDataset, GenealogySource } from "../types";
import lipu_lishiyuan from "./lishiyuan.lipu.data.json";

/** 支系键 → 人类可读标签（数据文件本身只存 key）。 */
const LABELS: Record<string, string> = {
  lishiyuan: "李氏·李世元一支（陇西贵州李代龙支系谱·桂果镇马场村）",
};

const DATASETS = new Map<string, GenealogyDataset>([
  ["lishiyuan", lipu_lishiyuan as GenealogyDataset],
]);

export type LipuFamilyMeta = {
  key: string;
  label: string;
  people: number;
  deceased: number;
  photos: number;
};

export const lipuFamilyList: LipuFamilyMeta[] = [...DATASETS.entries()]
  .map(([key, ds]) => ({
    key: `lipu:${key}`,
    label: `${LABELS[key] ?? key}（${ds.people.length}人）`,
    people: ds.people.length,
    deceased: ds.people.filter((p) => !p.living).length,
    photos: 0,
  }))
  .sort((a, b) => b.people - a.people);

/** 一支家谱的源（前缀键），未知则 undefined。 */
export function lipuFamilySource(prefixedKey: string): GenealogySource | undefined {
  if (!prefixedKey.startsWith("lipu:")) return undefined;
  const baseKey = prefixedKey.slice("lipu:".length);
  const dataset = DATASETS.get(baseKey);
  if (!dataset) return undefined;
  return { key: dataset.key, load: async () => dataset };
}

export function lipuImportedCounts(
  importedIds: Set<string>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, ds] of DATASETS) {
    out[`lipu:${key}`] = ds.people.filter(
      (p) => !p.living && importedIds.has(p.externalId),
    ).length;
  }
  return out;
}

/** Per-family most-recent import time (epoch ms), for newest-first sorting. */
export function lipuImportedRecency(
  times: Map<string, number>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, ds] of DATASETS) {
    let max = 0;
    for (const p of ds.people) {
      const t = times.get(p.externalId);
      if (t && t > max) max = t;
    }
    out[`lipu:${key}`] = max;
  }
  return out;
}
