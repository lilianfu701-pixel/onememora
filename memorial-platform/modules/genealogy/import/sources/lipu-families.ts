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
import lipu_liziyun from "./liziyun.lipu.data.json";
import lipu_liyousong from "./liyousong.lipu.data.json";
import lipu_liyingyuan from "./liyingyuan.lipu.data.json";
import lipu_liyingfang from "./liyingfang.lipu.data.json";
import lipu_lizhanlong from "./lizhanlong.lipu.data.json";
import lipu_liyingchu from "./liyingchu.lipu.data.json";
import lipu_lixinchun from "./lixinchun.lipu.data.json";
import lipu_lizongyuan from "./lizongyuan.lipu.data.json";
import lipu_limeichun from "./limeichun.lipu.data.json";
import lipu_lijinlong from "./lijinlong.lipu.data.json";
import lipu_lishiliang from "./lishiliang.lipu.data.json";
import lipu_lichunhong from "./lichunhong.lipu.data.json";
import lipu_likexian from "./likexian.lipu.data.json";
import lipu_liziqing from "./liziqing.lipu.data.json";
import lipu_lixinchunbn from "./lixinchunbn.lipu.data.json";
import lipu_liyingke from "./liyingke.lipu.data.json";
import lipu_liboshou from "./liboshou.lipu.data.json";
import lipu_lixuewu from "./lixuewu.lipu.data.json";
import lipu_lihongshunlh from "./lihongshunlh.lipu.data.json";
import lipu_liyuanfu from "./liyuanfu.lipu.data.json";
import lipu_lichaofeng from "./lichaofeng.lipu.data.json";
import lipu_lishiyu from "./lishiyu.lipu.data.json";
import lipu_lihongcheng from "./lihongcheng.lipu.data.json";
import lipu_liyinghua from "./liyinghua.lipu.data.json";
import lipu_liyingzhen from "./liyingzhen.lipu.data.json";
import lipu_liyongxiang from "./liyongxiang.lipu.data.json";
import lipu_liguangshun from "./liguangshun.lipu.data.json";
import lipu_lidacheng from "./lidacheng.lipu.data.json";
import lipu_lizhihe from "./lizhihe.lipu.data.json";

/** 支系键 → 人类可读标签（数据文件本身只存 key）。 */
const LABELS: Record<string, string> = {
  lishiyuan: "李氏·李世元一支（陇西贵州李代龙支系谱·桂果镇马场村）",
  liziyun: "李氏·李子云一支（李代龙支系谱·城关镇新华南路）",
  liyousong: "李氏·李友松一支（李代龙支系谱·八步镇）",
  liyingyuan: "李氏·李应元一支（李代龙支系谱·八步镇新场牛角冲）",
  liyingfang: "李氏·李应芳一支（李代龙支系谱·三塘镇布窝头）",
  lizhanlong: "李氏·李占隆支（李代龙支系谱·三塘镇石牛圈·续应芳支）",
  liyingchu: "李氏·李应初一支（李代龙支系谱·牛场镇鱼网河村）",
  lixinchun: "李氏·李新春一支（李代龙支系谱·马场乡马场坝）",
  lizongyuan: "李氏·李宗元一支（李代龙支系谱·纳雍昆寨乡红岩脚）",
  limeichun: "李氏·李美春一支（李代龙支系谱·以那镇砂王庙村）",
  lijinlong: "李氏·李进龙一支（李代龙支系谱·白泥乡先锋村）",
  lishiliang: "李氏·李士良一支（李代龙支系谱·白泥乡联合村）",
  lichunhong: "李氏·李春洪一支（李代龙支系谱·白泥乡大树脚村）",
  likexian: "李氏·李克贤一支（李代龙支系谱·白泥乡喻家坝村）",
  liziqing: "李氏·李子清一支（李代龙支系谱·白泥乡大树脚村）",
  lixinchunbn: "李氏·李新春一支（李代龙支系谱·白泥乡大树脚）",
  liyingke: "李氏·李应科一支（李代龙支系谱·白泥乡前进村卢家坝）",
  liboshou: "李氏·李伯寿一支（李代龙支系谱·白泥乡白泥村）",
  lixuewu: "李氏·李学武一支（李代龙支系谱·白泥乡三合村）",
  lihongshunlh: "李氏·李洪顺一支（李代龙支系谱·白泥联合村）",
  liyuanfu: "李氏·李元富一支（李代龙支系谱·白泥乡三合村）",
  lichaofeng: "李氏·李朝凤一支（李代龙支系谱·白泥乡那台联合村）",
  lishiyu: "李氏·李士玉一支（李代龙支系谱·白泥乡云碧村）",
  lihongcheng: "李氏·李洪成一支（李代龙支系谱·白泥乡白泥村）",
  liyinghua: "李氏·李应华一支（李代龙支系谱·熊家长乡干坝村）",
  liyingzhen: "李氏·李应祯一支（李代龙支系谱·珠长镇中部村）",
  liyongxiang: "李氏·李永相一支（李代龙支系谱·珠长镇木汪村蒙棋）",
  liguangshun: "李氏·李光顺一支（李代龙支系谱·珠藏镇龙河村）",
  lidacheng: "李氏·李大成一支（李代龙支系谱·织金阿弓镇吊井村）",
  lizhihe: "李氏·李志和一支（李代龙支系谱·织金阿弓镇以麦村）",
};

const DATASETS = new Map<string, GenealogyDataset>([
  ["lishiyuan", lipu_lishiyuan as GenealogyDataset],
  ["liziyun", lipu_liziyun as GenealogyDataset],
  ["liyousong", lipu_liyousong as GenealogyDataset],
  ["liyingyuan", lipu_liyingyuan as GenealogyDataset],
  ["liyingfang", lipu_liyingfang as GenealogyDataset],
  ["lizhanlong", lipu_lizhanlong as GenealogyDataset],
  ["liyingchu", lipu_liyingchu as GenealogyDataset],
  ["lixinchun", lipu_lixinchun as GenealogyDataset],
  ["lizongyuan", lipu_lizongyuan as GenealogyDataset],
  ["limeichun", lipu_limeichun as GenealogyDataset],
  ["lijinlong", lipu_lijinlong as GenealogyDataset],
  ["lishiliang", lipu_lishiliang as GenealogyDataset],
  ["lichunhong", lipu_lichunhong as GenealogyDataset],
  ["likexian", lipu_likexian as GenealogyDataset],
  ["liziqing", lipu_liziqing as GenealogyDataset],
  ["lixinchunbn", lipu_lixinchunbn as GenealogyDataset],
  ["liyingke", lipu_liyingke as GenealogyDataset],
  ["liboshou", lipu_liboshou as GenealogyDataset],
  ["lixuewu", lipu_lixuewu as GenealogyDataset],
  ["lihongshunlh", lipu_lihongshunlh as GenealogyDataset],
  ["liyuanfu", lipu_liyuanfu as GenealogyDataset],
  ["lichaofeng", lipu_lichaofeng as GenealogyDataset],
  ["lishiyu", lipu_lishiyu as GenealogyDataset],
  ["lihongcheng", lipu_lihongcheng as GenealogyDataset],
  ["liyinghua", lipu_liyinghua as GenealogyDataset],
  ["liyingzhen", lipu_liyingzhen as GenealogyDataset],
  ["liyongxiang", lipu_liyongxiang as GenealogyDataset],
  ["liguangshun", lipu_liguangshun as GenealogyDataset],
  ["lidacheng", lipu_lidacheng as GenealogyDataset],
  ["lizhihe", lipu_lizhihe as GenealogyDataset],
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
