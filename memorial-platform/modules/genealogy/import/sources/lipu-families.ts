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
import lipu_liyingshi from "./liyingshi.lipu.data.json";
import lipu_lichengjun from "./lichengjun.lipu.data.json";
import lipu_lishenghua from "./lishenghua.lipu.data.json";
import lipu_liruyuan from "./liruyuan.lipu.data.json";
import lipu_lichaogui from "./lichaogui.lipu.data.json";
import lipu_lishengfan from "./lishengfan.lipu.data.json";
import lipu_lizongwen from "./lizongwen.lipu.data.json";
import lipu_litengmei from "./litengmei.lipu.data.json";
import lipu_lishitan from "./lishitan.lipu.data.json";
import lipu_lijiwenxianyin from "./lijiwenxianyin.lipu.data.json";
import lipu_litianfu from "./litianfu.lipu.data.json";
import lipu_lishifangzihao from "./lishifangzihao.lipu.data.json";
import lipu_litianshun from "./litianshun.lipu.data.json";
import lipu_lideishun from "./lideishun.lipu.data.json";
import lipu_litianxiang from "./litianxiang.lipu.data.json";
import lipu_lishixiong from "./lishixiong.lipu.data.json";
import lipu_liruyunqb from "./liruyunqb.lipu.data.json";
import lipu_liminglong from "./liminglong.lipu.data.json";
import lipu_lishifangzimei from "./lishifangzimei.lipu.data.json";
import lipu_lichongguang from "./lichongguang.lipu.data.json";
import lipu_lixingzheng from "./lixingzheng.lipu.data.json";
import lipu_lijinhuai from "./lijinhuai.lipu.data.json";
import lipu_lijinhuaizongqing from "./lijinhuaizongqing.lipu.data.json";
import lipu_lijinhuaizongxuan from "./lijinhuaizongxuan.lipu.data.json";
import lipu_lijinhuaizongshun from "./lijinhuaizongshun.lipu.data.json";
import lipu_lidayong from "./lidayong.lipu.data.json";
import lipu_lidayongzongxue from "./lidayongzongxue.lipu.data.json";
import lipu_lidayongzongchao from "./lidayongzongchao.lipu.data.json";
import lipu_lidayongzongxiang from "./lidayongzongxiang.lipu.data.json";
import lipu_lidayongothers from "./lidayongothers.lipu.data.json";
import lipu_lizaixue from "./lizaixue.lipu.data.json";
import lipu_lijinrong from "./lijinrong.lipu.data.json";
import lipu_liRugold from "./liRugold.lipu.data.json";
import lipu_litianjin from "./litianjin.lipu.data.json";
import lipu_litianlang from "./litianlang.lipu.data.json";
import lipu_litianming from "./litianming.lipu.data.json";
import lipu_litianyuan from "./litianyuan.lipu.data.json";
import lipu_lijinzhong from "./lijinzhong.lipu.data.json";
import lipu_lijinzhongdegui from "./lijinzhongdegui.lipu.data.json";
import lipu_lijinzhongdelong from "./lijinzhongdelong.lipu.data.json";
import lipu_lijinzhongruxian from "./lijinzhongruxian.lipu.data.json";
import lipu_lijinrongnc from "./lijinrongnc.lipu.data.json";
import lipu_lijinrongnc2 from "./lijinrongnc2.lipu.data.json";
import lipu_lizongbao from "./lizongbao.lipu.data.json";
import lipu_lizaichen from "./lizaichen.lipu.data.json";
import lipu_lijiyongfu from "./lijiyongfu.lipu.data.json";
import lipu_lijiyongfu2 from "./lijiyongfu2.lipu.data.json";
import lipu_lipengchen from "./lipengchen.lipu.data.json";
import lipu_lipengchen2 from "./lipengchen2.lipu.data.json";
import lipu_limanyong from "./limanyong.lipu.data.json";
import lipu_limanfu from "./limanfu.lipu.data.json";
import lipu_lichaochen from "./lichaochen.lipu.data.json";
import lipu_lijianyou from "./lijianyou.lipu.data.json";
import lipu_lijianyouzl from "./lijianyouzl.lipu.data.json";
import lipu_lijianyouzm from "./lijianyouzm.lipu.data.json";
import lipu_lizhenghai from "./lizhenghai.lipu.data.json";
import lipu_lizhenghai2 from "./lizhenghai2.lipu.data.json";
import lipu_lizongwu from "./lizongwu.lipu.data.json";
import lipu_lihongshun from "./lihongshun.lipu.data.json";
import lipu_lihonglian from "./lihonglian.lipu.data.json";
import lipu_liziquan from "./liziquan.lipu.data.json";

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
  liyingshi: "李氏·李应实一支（李代龙支系谱·织金县板桥乡白果村）",
  lichengjun: "李氏·李成俊一支（李代龙支系谱·织金县板桥乡白果村）",
  lishenghua: "李氏·李盛华一支（李代龙支系谱·织金县板桥乡魁书村）",
  liruyuan: "李氏·李如元一支（李代龙支系谱·织金县茶店乡安氏村）",
  lichaogui: "李氏·李朝贵一支（李代龙支系谱·织金县板桥乡白果树大寨）",
  lishengfan: "李氏·李盛藩一支（李代龙支系谱·织金县板桥乡龙井村魁书）",
  lizongwen: "李氏·李宗文一支（李代龙支系谱·织金县龙场镇阳光村）",
  litengmei: "李氏·李腾美一支（李代龙支系谱·织金县阿弓镇以麦村）",
  lishitan: "李氏·李仕坛一支（李代龙支系谱·织金县板桥乡白果树大寨）",
  lijiwenxianyin: "李氏·李吉文/先银一支（李代龙支系谱·织金县阿弓镇屯上）",
  litianfu: "李氏·李天复一支（李代龙支系谱·织金县平寨乡大荒坡母鸡井）",
  lishifangzihao: "李氏·李世芳一支·自好支（李代龙支系谱·织金县波云乡包云乡小冲田）",
  litianshun: "李氏·李天顺一支（李代龙支系谱·织金县化起镇下坝田）",
  lideishun: "李氏·李德顺一支（李代龙支系谱·织金县化起镇鱼塘大平子果者面）",
  litianxiang: "李氏·李天祥一支（李代龙支系谱·织金县茶店乡吴家寨）",
  lishixiong: "李氏·李世雄一支（李代龙支系谱·织金县茶店乡安乐村）",
  liruyunqb: "李氏·李如云一支（李代龙支系谱·织金县茶店乡茶店桥边）",
  liminglong: "李氏·李明龙一支（李代龙支系谱·织金县波云乡小冲田）",
  lishifangzimei: "李氏·李世芳一支·自美支（李代龙支系谱·织金县波云乡小冲田）",
  lichongguang: "李氏·李崇光一支（李代龙支系谱·织金县茶店乡安乐村）",
  lixingzheng: "李氏·李兴正一支（李代龙支系谱·织金县波云乡小冲田）",
  lijinhuai: "李氏·李进槐一支·上承应璋支系（李代龙支系谱·化起镇化起村下坝田村·十一至十七代）",
  lijinhuaizongqing: "李氏·李进槐支·宗清分支（李代龙支系谱·化起村下坝田村·十七至二十代）",
  lijinhuaizongxuan: "李氏·李进槐支·宗选分支（李代龙支系谱·化起村下坝田村·十七至二十代）",
  lijinhuaizongshun: "李氏·李进槐支·宗顺宗新分支（李代龙支系谱·化起村下坝田村·十七至二十代）",
  lidayong: "李氏·李大勇一支（李代龙支系谱·化起镇庙上田坝·十三至十七代）",
  lidayongzongxue: "李氏·李大勇支·宗学分支（李代龙支系谱·化起镇庙上田坝·十七至二十代）",
  lidayongzongchao: "李氏·李大勇支·宗朝分支（李代龙支系谱·化起镇庙上田坝·十七至二十一代）",
  lidayongzongxiang: "李氏·李大勇支·宗相分支（李代龙支系谱·化起镇庙上田坝·十七至二十代）",
  lidayongothers: "李氏·李大勇支·其他分支（李代龙支系谱·化起镇庙上田坝·十七至二十代）",
  lizaixue: "李氏·李再学一支（李代龙支系谱·化起镇水港堤·十三至十九代）",
  lijinrong: "李氏·李进荣一支（李代龙支系谱·化起镇罗家寨·十一至十八代）",
  liRugold: "李氏·李如金一支（李代龙支系谱·化起镇九甲大山脚·十四至十九代）",
  litianjin: "李氏·李天锦一支（李代龙支系谱·化起镇罗家寨·十六至二十二代）",
  litianlang: "李氏·李天朗一支（李代龙支系谱·化起镇罗家寨·十六至二十代）",
  litianming: "李氏·李天铭一支（李代龙支系谱·化起镇罗家寨·十六至二十二代）",
  litianyuan: "李氏·李天元一支（李代龙支系谱·猫场镇勾腰岩·十六至二十二代）",
  lijinzhong: "李氏·李进忠一支（李代龙支系谱·牛场镇千二系·主干及德盛德富房·十至二十代）",
  lijinzhongdegui: "李氏·李进忠一支·宗元德贵房（李代龙支系谱·牛场镇千二系·十七至二十代）",
  lijinzhongdelong: "李氏·李进忠一支·宗元德龙房及崇富崇义（李代龙支系谱·牛场镇千二系·十七至二十代）",
  lijinzhongruxian: "李氏·李进忠一支·上承15代李如先分支·李天伦房（李代龙支系谱·牛场镇千二系·十六至十九代）",
  lijinrongnc: "李氏·李进荣一支·主干及宗相房（李代龙支系谱·牛场镇千二系·十一至二十代）",
  lijinrongnc2: "李氏·李进荣一支·天福宗辅房及宗元房（李代龙支系谱·牛场镇千二系·十六至十九代）",
  lizongbao: "李氏·李宗保一支（李代龙支系谱·牛场乡大鱼塘·十七至二十代）",
  lizaichen: "李氏·李在臣一支·凹河岩脚寨李隆文分支（李代龙支系谱·牛场乡凹河大秋村·十三至二十代）",
  lijiyongfu: "李氏·李永富一支·主干及崇发房（李代龙支系谱·牛场镇沙坝水银上·十二至二十一代）",
  lijiyongfu2: "李氏·李永富一支·崇富房（李代龙支系谱·牛场镇沙坝水银上·十八至二十一代）",
  lipengchen: "李氏·李鹏臣一支·主干及宗友房（李代龙支系谱·实兴乡李家寨·十一至二十代）",
  lipengchen2: "李氏·李鹏臣一支·宗奎房（李代龙支系谱·实兴乡李家寨·十六至二十代）",
  limanyong: "李氏·李万用一支（李代龙支系谱·实兴乡王家寨·十一至二十代）",
  limanfu: "李氏·李万富一支（李代龙支系谱·实兴乡王家寨·十一至二十代）",
  lichaochen: "李氏·李朝臣一支（李代龙支系谱·实兴乡大干坝·十一至二十代）",
  lijianyou: "李氏·李进中一支·建犹建明房主干（李代龙支系谱·桂果干河老蒙寨·十三至十七代）",
  lijianyouzl: "李氏·李进中一支·天恩宗亮房（李代龙支系谱·桂果干河老蒙寨·十六至十九代）",
  lijianyouzm: "李氏·李进中一支·天恩宗明房（李代龙支系谱·桂果干河老蒙寨·十六至十九代）",
  lizhenghai: "李氏·李正海一支·主干及崇志房（李代龙支系谱·实兴乡干河上坝·十五至二十二代）",
  lizhenghai2: "李氏·李正海一支·崇应房（李代龙支系谱·实兴乡干河上坝·十八至二十二代）",
  lizongwu: "李氏·李宗武一支（李代龙支系谱·自强乡自强张寨脚村·十七至二十二代）",
  lihongshun: "李氏·李洪顺一支（李代龙支系谱·纳雍乡鼠场三苍土·十五至二十代）",
  lihonglian: "李氏·李洪连一支（李代龙支系谱·纳雍乡千二系·十八至二十一代）",
  liziquan: "李氏·李自全一支（李代龙支系谱·纳雍乡八耳岩脚·十七至二十代）",
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
  ["liyingshi", lipu_liyingshi as GenealogyDataset],
  ["lichengjun", lipu_lichengjun as GenealogyDataset],
  ["lishenghua", lipu_lishenghua as GenealogyDataset],
  ["liruyuan", lipu_liruyuan as GenealogyDataset],
  ["lichaogui", lipu_lichaogui as GenealogyDataset],
  ["lishengfan", lipu_lishengfan as GenealogyDataset],
  ["lizongwen", lipu_lizongwen as GenealogyDataset],
  ["litengmei", lipu_litengmei as GenealogyDataset],
  ["lishitan", lipu_lishitan as GenealogyDataset],
  ["lijiwenxianyin", lipu_lijiwenxianyin as GenealogyDataset],
  ["litianfu", lipu_litianfu as GenealogyDataset],
  ["lishifangzihao", lipu_lishifangzihao as GenealogyDataset],
  ["litianshun", lipu_litianshun as GenealogyDataset],
  ["lideishun", lipu_lideishun as GenealogyDataset],
  ["litianxiang", lipu_litianxiang as GenealogyDataset],
  ["lishixiong", lipu_lishixiong as GenealogyDataset],
  ["liruyunqb", lipu_liruyunqb as GenealogyDataset],
  ["liminglong", lipu_liminglong as GenealogyDataset],
  ["lishifangzimei", lipu_lishifangzimei as GenealogyDataset],
  ["lichongguang", lipu_lichongguang as GenealogyDataset],
  ["lixingzheng", lipu_lixingzheng as GenealogyDataset],
  ["lijinhuai", lipu_lijinhuai as GenealogyDataset],
  ["lijinhuaizongqing", lipu_lijinhuaizongqing as GenealogyDataset],
  ["lijinhuaizongxuan", lipu_lijinhuaizongxuan as GenealogyDataset],
  ["lijinhuaizongshun", lipu_lijinhuaizongshun as GenealogyDataset],
  ["lidayong", lipu_lidayong as GenealogyDataset],
  ["lidayongzongxue", lipu_lidayongzongxue as GenealogyDataset],
  ["lidayongzongchao", lipu_lidayongzongchao as GenealogyDataset],
  ["lidayongzongxiang", lipu_lidayongzongxiang as GenealogyDataset],
  ["lidayongothers", lipu_lidayongothers as GenealogyDataset],
  ["lizaixue", lipu_lizaixue as GenealogyDataset],
  ["lijinrong", lipu_lijinrong as GenealogyDataset],
  ["liRugold", lipu_liRugold as GenealogyDataset],
  ["litianjin", lipu_litianjin as GenealogyDataset],
  ["litianlang", lipu_litianlang as GenealogyDataset],
  ["litianming", lipu_litianming as GenealogyDataset],
  ["litianyuan", lipu_litianyuan as GenealogyDataset],
  ["lijinzhong", lipu_lijinzhong as GenealogyDataset],
  ["lijinzhongdegui", lipu_lijinzhongdegui as GenealogyDataset],
  ["lijinzhongdelong", lipu_lijinzhongdelong as GenealogyDataset],
  ["lijinzhongruxian", lipu_lijinzhongruxian as GenealogyDataset],
  ["lijinrongnc", lipu_lijinrongnc as GenealogyDataset],
  ["lijinrongnc2", lipu_lijinrongnc2 as GenealogyDataset],
  ["lizongbao", lipu_lizongbao as GenealogyDataset],
  ["lizaichen", lipu_lizaichen as GenealogyDataset],
  ["lijiyongfu", lipu_lijiyongfu as GenealogyDataset],
  ["lijiyongfu2", lipu_lijiyongfu2 as GenealogyDataset],
  ["lipengchen", lipu_lipengchen as GenealogyDataset],
  ["lipengchen2", lipu_lipengchen2 as GenealogyDataset],
  ["limanyong", lipu_limanyong as GenealogyDataset],
  ["limanfu", lipu_limanfu as GenealogyDataset],
  ["lichaochen", lipu_lichaochen as GenealogyDataset],
  ["lijianyou", lipu_lijianyou as GenealogyDataset],
  ["lijianyouzl", lipu_lijianyouzl as GenealogyDataset],
  ["lijianyouzm", lipu_lijianyouzm as GenealogyDataset],
  ["lizhenghai", lipu_lizhenghai as GenealogyDataset],
  ["lizhenghai2", lipu_lizhenghai2 as GenealogyDataset],
  ["lizongwu", lipu_lizongwu as GenealogyDataset],
  ["lihongshun", lipu_lihongshun as GenealogyDataset],
  ["lihonglian", lipu_lihonglian as GenealogyDataset],
  ["liziquan", lipu_liziquan as GenealogyDataset],
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
