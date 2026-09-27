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
import lipu_liruyan from "./liruyan.lipu.data.json";
import lipu_liruyanfeng from "./liruyanfeng.lipu.data.json";
import lipu_litiancai from "./litiancai.lipu.data.json";
import lipu_lifuting from "./lifuting.lipu.data.json";
import lipu_lifuting2 from "./lifuting2.lipu.data.json";
import lipu_lishide from "./lishide.lipu.data.json";
import lipu_lishidechongyuan from "./lishidechongyuan.lipu.data.json";
import lipu_lichongzhen from "./lichongzhen.lipu.data.json";
import lipu_lidrong from "./lidrong.lipu.data.json";
import lipu_lizongyun from "./lizongyun.lipu.data.json";
import lipu_lichongyu from "./lichongyu.lipu.data.json";
import lipu_lishixian from "./lishixian.lipu.data.json";
import lipu_lishixian2 from "./lishixian2.lipu.data.json";
import lipu_lizongfu from "./lizongfu.lipu.data.json";
import lipu_liwen from "./liwen.lipu.data.json";
import lipu_lizongbaohm from "./lizongbaohm.lipu.data.json";
import lipu_lizongxiu from "./lizongxiu.lipu.data.json";
import lipu_lizongxiu2 from "./lizongxiu2.lipu.data.json";
import lipu_lizhilong from "./lizhilong.lipu.data.json";
import lipu_lishichen from "./lishichen.lipu.data.json";
import lipu_lishichen2 from "./lishichen2.lipu.data.json";
import lipu_lishichen3 from "./lishichen3.lipu.data.json";
import lipu_lishizheng from "./lishizheng.lipu.data.json";
import lipu_lishixianqm from "./lishixianqm.lipu.data.json";
import lipu_lishixianqm2 from "./lishixianqm2.lipu.data.json";
import lipu_lishixianqm3 from "./lishixianqm3.lipu.data.json";
import lipu_lishixianqm4 from "./lishixianqm4.lipu.data.json";
import lipu_lishixianqm5 from "./lishixianqm5.lipu.data.json";
import lipu_lishicheng from "./lishicheng.lipu.data.json";
import lipu_lishicheng2 from "./lishicheng2.lipu.data.json";
import lipu_lishicheng3 from "./lishicheng3.lipu.data.json";
import lipu_lichengcong from "./lichengcong.lipu.data.json";
import lipu_lichengcong2 from "./lichengcong2.lipu.data.json";
import lipu_lidelong from "./lidelong.lipu.data.json";
import lipu_lidelong2 from "./lidelong2.lipu.data.json";
import lipu_lidesheng from "./lidesheng.lipu.data.json";
import lipu_lideyun from "./lideyun.lipu.data.json";
import lipu_lideyue from "./lideyue.lipu.data.json";
import lipu_lichaoyong from "./lichaoyong.lipu.data.json";
import lipu_lishicaifh from "./lishicaifh.lipu.data.json";
import lipu_lishiyuanag from "./lishiyuanag.lipu.data.json";
import lipu_lishaoyu from "./lishaoyu.lipu.data.json";
import lipu_lifengqing from "./lifengqing.lipu.data.json";
import lipu_lichaotian from "./lichaotian.lipu.data.json";
import lipu_liqiongzhen from "./liqiongzhen.lipu.data.json";
import lipu_liqionghui from "./liqionghui.lipu.data.json";
import lipu_lichengzhi from "./lichengzhi.lipu.data.json";
import lipu_lichengzhi2 from "./lichengzhi2.lipu.data.json";
import lipu_lichengzhi3 from "./lichengzhi3.lipu.data.json";
import lipu_lichengzhi4 from "./lichengzhi4.lipu.data.json";
import lipu_lichengzhi5 from "./lichengzhi5.lipu.data.json";
import lipu_lichengzhi6 from "./lichengzhi6.lipu.data.json";
import lipu_lichengzhi7 from "./lichengzhi7.lipu.data.json";
import lipu_lichengzhi8 from "./lichengzhi8.lipu.data.json";
import lipu_lichengzhi9 from "./lichengzhi9.lipu.data.json";
import lipu_lichengzhi10 from "./lichengzhi10.lipu.data.json";
import lipu_lichengzhi11 from "./lichengzhi11.lipu.data.json";
import lipu_litianmeinl from "./litianmeinl.lipu.data.json";
import lipu_liyongfubn from "./liyongfubn.lipu.data.json";
import lipu_lijinbang from "./lijinbang.lipu.data.json";
import lipu_lichongchangxq from "./lichongchangxq.lipu.data.json";
import lipu_lixitai from "./lixitai.lipu.data.json";
import lipu_lihaiting from "./lihaiting.lipu.data.json";
import lipu_lichongzhouxq from "./lichongzhouxq.lipu.data.json";
import lipu_lidezhousy from "./lidezhousy.lipu.data.json";
import lipu_lixinglian from "./lixinglian.lipu.data.json";
import lipu_lideyang from "./lideyang.lipu.data.json";
import lipu_litianmeilh from "./litianmeilh.lipu.data.json";
import lipu_lizhengguilh from "./lizhengguilh.lipu.data.json";
import lipu_lishaozhou from "./lishaozhou.lipu.data.json";
import lipu_lishenglong from "./lishenglong.lipu.data.json";
import lipu_lilongchangsh from "./lilongchangsh.lipu.data.json";
import lipu_lijinhai from "./lijinhai.lipu.data.json";
import lipu_litingyan from "./litingyan.lipu.data.json";
import lipu_lizhengtang from "./lizhengtang.lipu.data.json";
import lipu_liwenxian from "./liwenxian.lipu.data.json";
import lipu_lihongzhen from "./lihongzhen.lipu.data.json";
import lipu_liyingxue from "./liyingxue.lipu.data.json";
import lipu_lishifubsb from "./lishifubsb.lipu.data.json";
import lipu_liqimingyjb from "./liqimingyjb.lipu.data.json";
import lipu_lirongzhi from "./lirongzhi.lipu.data.json";
import lipu_lirongzhi3 from "./lirongzhi3.lipu.data.json";
import lipu_lirongzhi2 from "./lirongzhi2.lipu.data.json";
import lipu_lishiqiangbsb from "./lishiqiangbsb.lipu.data.json";
import lipu_lizhengqiyb from "./lizhengqiyb.lipu.data.json";
import lipu_lidengtang from "./lidengtang.lipu.data.json";
import lipu_lihongxiang from "./lihongxiang.lipu.data.json";
import lipu_liliangshan from "./liliangshan.lipu.data.json";
import lipu_lihongyu from "./lihongyu.lipu.data.json";
import lipu_lizongqi from "./lizongqi.lipu.data.json";
import lipu_lishunqing from "./lishunqing.lipu.data.json";
import lipu_litianxingxjc from "./litianxingxjc.lipu.data.json";
import lipu_litingjie from "./litingjie.lipu.data.json";
import lipu_liyungui from "./liyungui.lipu.data.json";
import lipu_liyungui2 from "./liyungui2.lipu.data.json";
import lipu_liyungui3 from "./liyungui3.lipu.data.json";
import lipu_lishixiansp from "./lishixiansp.lipu.data.json";
import lipu_lishixiansp2 from "./lishixiansp2.lipu.data.json";
import lipu_lishixiansp3 from "./lishixiansp3.lipu.data.json";
import lipu_lidaming from "./lidaming.lipu.data.json";
import lipu_lizailong from "./lizailong.lipu.data.json";
import lipu_lizailong2 from "./lizailong2.lipu.data.json";
import lipu_lizailong3 from "./lizailong3.lipu.data.json";
import lipu_lizailong4 from "./lizailong4.lipu.data.json";
import lipu_liguoliang from "./liguoliang.lipu.data.json";
import lipu_liguoliang3 from "./liguoliang3.lipu.data.json";
import lipu_liguoliang2 from "./liguoliang2.lipu.data.json";
import lipu_lishimeixh from "./lishimeixh.lipu.data.json";
import lipu_lishimeixh2 from "./lishimeixh2.lipu.data.json";
import lipu_lishifulm from "./lishifulm.lipu.data.json";
import lipu_lizhengguixhg from "./lizhengguixhg.lipu.data.json";
import lipu_lizhengguixhg2 from "./lizhengguixhg2.lipu.data.json";
import lipu_liqiongdian from "./liqiongdian.lipu.data.json";
import lipu_lihongxiangmc from "./lihongxiangmc.lipu.data.json";
import lipu_likaihua from "./likaihua.lipu.data.json";
import lipu_likaihua2 from "./likaihua2.lipu.data.json";
import lipu_lizongrongtjd from "./lizongrongtjd.lipu.data.json";
import lipu_lizongrongtjd2 from "./lizongrongtjd2.lipu.data.json";
import lipu_lizongwenbj from "./lizongwenbj.lipu.data.json";
import lipu_lichaoyangsk from "./lichaoyangsk.lipu.data.json";
import lipu_lichaoyangsk2 from "./lichaoyangsk2.lipu.data.json";
import lipu_litianqing from "./litianqing.lipu.data.json";
import lipu_lijunheng from "./lijunheng.lipu.data.json";
import lipu_lijunheng2 from "./lijunheng2.lipu.data.json";
import lipu_lizongfa from "./lizongfa.lipu.data.json";
import lipu_lideshenglw from "./lideshenglw.lipu.data.json";
import lipu_lizongwenlw from "./lizongwenlw.lipu.data.json";
import lipu_lishiju from "./lishiju.lipu.data.json";
import lipu_lishiju2 from "./lishiju2.lipu.data.json";
import lipu_lishiju3 from "./lishiju3.lipu.data.json";
import lipu_litianpei from "./litianpei.lipu.data.json";
import lipu_litianyuanqx from "./litianyuanqx.lipu.data.json";
import lipu_lizongqiong from "./lizongqiong.lipu.data.json";
import lipu_lichaolong from "./lichaolong.lipu.data.json";
import lipu_lichaolong2 from "./lichaolong2.lipu.data.json";
import lipu_lichaolong3 from "./lichaolong3.lipu.data.json";
import lipu_lichaolong4 from "./lichaolong4.lipu.data.json";
import lipu_liwengui from "./liwengui.lipu.data.json";
import lipu_liwengui5 from "./liwengui5.lipu.data.json";
import lipu_liwengui2 from "./liwengui2.lipu.data.json";
import lipu_liwengui7 from "./liwengui7.lipu.data.json";
import lipu_liwengui3 from "./liwengui3.lipu.data.json";
import lipu_liwengui6 from "./liwengui6.lipu.data.json";
import lipu_liwengui4 from "./liwengui4.lipu.data.json";
import lipu_liguochen from "./liguochen.lipu.data.json";
import lipu_lishilun from "./lishilun.lipu.data.json";
import lipu_lishijienjc from "./lishijienjc.lipu.data.json";
import lipu_lishijienjc2 from "./lishijienjc2.lipu.data.json";
import lipu_lishiyuanxc from "./lishiyuanxc.lipu.data.json";
import lipu_lishiyuanxc2 from "./lishiyuanxc2.lipu.data.json";
import lipu_lishiyuanxc3 from "./lishiyuanxc3.lipu.data.json";
import lipu_lishijiedmz from "./lishijiedmz.lipu.data.json";
import lipu_lishijiedmz2 from "./lishijiedmz2.lipu.data.json";
import lipu_lishijiedmz3 from "./lishijiedmz3.lipu.data.json";
import lipu_lishixionglbz from "./lishixionglbz.lipu.data.json";
import lipu_liwenying from "./liwenying.lipu.data.json";
import lipu_liwenying2 from "./liwenying2.lipu.data.json";
import lipu_lixuegui from "./lixuegui.lipu.data.json";
import lipu_lishichenhsz from "./lishichenhsz.lipu.data.json";
import lipu_lishijiao from "./lishijiao.lipu.data.json";
import lipu_lishijiao2 from "./lishijiao2.lipu.data.json";
import lipu_lishijiejs from "./lishijiejs.lipu.data.json";
import lipu_lizongfulbz from "./lizongfulbz.lipu.data.json";
import lipu_lizongfulbz2 from "./lizongfulbz2.lipu.data.json";
import lipu_lishizhenghn from "./lishizhenghn.lipu.data.json";
import lipu_liruxinyk from "./liruxinyk.lipu.data.json";
import lipu_lishijiao3 from "./lishijiao3.lipu.data.json";
import lipu_lizuochen from "./lizuochen.lipu.data.json";
import lipu_liziwen from "./liziwen.lipu.data.json";
import lipu_lishijing from "./lishijing.lipu.data.json";
import lipu_liruji from "./liruji.lipu.data.json";
import lipu_liruji2 from "./liruji2.lipu.data.json";
import lipu_lizijingls from "./lizijingls.lipu.data.json";
import lipu_lizijingls2 from "./lizijingls2.lipu.data.json";
import lipu_lishiruddz from "./lishiruddz.lipu.data.json";
import lipu_lishijiao4 from "./lishijiao4.lipu.data.json";
import lipu_lidelinhn from "./lidelinhn.lipu.data.json";
import lipu_lidachengsl from "./lidachengsl.lipu.data.json";
import lipu_lishijiaoml from "./lishijiaoml.lipu.data.json";
import lipu_lishiqing from "./lishiqing.lipu.data.json";
import lipu_lishichents from "./lishichents.lipu.data.json";
import lipu_lifengbei from "./lifengbei.lipu.data.json";
import lipu_lishixiongcl from "./lishixiongcl.lipu.data.json";
import lipu_lishixiongcl2 from "./lishixiongcl2.lipu.data.json";
import lipu_lishixiongcl3 from "./lishixiongcl3.lipu.data.json";
import lipu_lishiqing2 from "./lishiqing2.lipu.data.json";
import lipu_lishixiongcl4 from "./lishixiongcl4.lipu.data.json";
import lipu_lishaoren from "./lishaoren.lipu.data.json";
import lipu_lilongyinghsz from "./lilongyinghsz.lipu.data.json";
import lipu_lishiwan from "./lishiwan.lipu.data.json";
import lipu_lizongkuihh from "./lizongkuihh.lipu.data.json";
import lipu_lichongzhihn from "./lichongzhihn.lipu.data.json";
import lipu_lizongcaigsk from "./lizongcaigsk.lipu.data.json";
import lipu_lizide from "./lizide.lipu.data.json";
import lipu_lizide2 from "./lizide2.lipu.data.json";
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
  liruyan: "李氏·李儒彦一支·文龙房（李代龙支系谱·桂果新华冒龙井·十五至二十代）",
  liruyanfeng: "李氏·李儒彦一支·文凤房（李代龙支系谱·桂果新华冒龙井·十五至十七代）",
  litiancai: "李氏·李天才一支（李代龙支系谱·桂果新华箐脚·十六至二十二代）",
  lifuting: "李氏·李辅廷一支·主干（李代龙支系谱·桂果乡克窝村·十一至十六代）",
  lifuting2: "李氏·李辅廷一支·宗先房（李代龙支系谱·桂果乡克窝村·十六至二十一代）",
  lishide: "李氏·李世德一支·主干（李代龙支系谱·桂果乡克窝大乔地·十一至十九代）",
  lishidechongyuan: "李氏·李世德一支·崇元房（李代龙支系谱·桂果乡克窝大乔地·十九至二十一代）",
  lichongzhen: "李氏·李崇珍一支（李代龙支系谱·桂果镇克窝大荞地·十八至二十一代）",
  lidrong: "李氏·李德荣一支（李代龙支系谱·桂果镇克窝大荞地·十七至二十代）",
  lizongyun: "李氏·李宗云一支（李代龙支系谱·桂果克窝讨煤冲·十六至二十代）",
  lichongyu: "李氏·李崇羽一支（李代龙支系谱·克窝大荞地·十六至十八代）",
  lishixian: "李氏·李世先一支·主干（李代龙支系谱·桂果克窝村下寨·十一至十八代）",
  lishixian2: "李氏·李世先一支·德屏德模房（李代龙支系谱·桂果克窝村下寨·十八至二十代）",
  lizongfu: "李氏·李宗富一支（李代龙支系谱·桂果小马场·十六至二十代）",
  liwen: "李氏·李文一支（李代龙支系谱·桂果毛坪·十三至二十代）",
  lizongbaohm: "李氏·李宗保一支·后麻窝宗保宗育房（李代龙支系谱·桂果新华后麻窝·十六至二十代）",
  lizongxiu: "李氏·李宗秀房·德怀德润（李代龙支系谱·桂果新华后麻窝·十六至二十代）",
  lizongxiu2: "李氏·李宗秀房·德方德佩德安（李代龙支系谱·桂果新华后麻窝·十七至二十代）",
  lizhilong: "李氏·李之龙一支（李代龙支系谱·桂果毛坪小岩上·十一至十九代）",
  lishichen: "李氏·李士臣一支·主干及德昌房（李代龙支系谱·桂果乡马路脚·十三至二十代）",
  lishichen2: "李氏·李士臣一支·德梦德荣房（李代龙支系谱·桂果乡马路脚·十七至二十代）",
  lishichen3: "李氏·李士臣一支·宗保房（李代龙支系谱·桂果乡马路脚·十六至二十代）",
  lishizheng: "李氏·李世政一支（李代龙支系谱·桂果乡花竹寨·十一至二十一代）",
  lishixianqm: "李氏·李世先一支·主干及德荣房（李代龙支系谱·桂果绮陌村李家寨·十一至二十一代）",
  lishixianqm2: "李氏·李世先一支·崇恩崇贵房（李代龙支系谱·桂果绮陌村李家寨·十八至二十一代）",
  lishixianqm3: "李氏·李世先一支·崇杰崇模崇典房（李代龙支系谱·桂果绮陌村李家寨·十八至二十一代）",
  lishixianqm4: "李氏·李世先一支·崇配房（李代龙支系谱·桂果绮陌村李家寨·十八至二十一代）",
  lishixianqm5: "李氏·李世先一支·德文房（李代龙支系谱·桂果绮陌村李家寨·十七至二十一代）",
  lishicheng: "李氏·李世成一支·主干及崇发房（李代龙支系谱·桂果镇核桃寨·十三至二十一代）",
  lishicheng2: "李氏·李世成一支·隆贵隆华房（李代龙支系谱·桂果镇核桃寨·十九至二十一代）",
  lishicheng3: "李氏·李世成一支·崇清崇明崇顺房（李代龙支系谱·桂果镇核桃寨·十八至二十一代）",
  lichengcong: "李氏·李成琮一支·主干（李代龙支系谱·桂果镇戈仲坞葫芦井·十二至十七代）",
  lichengcong2: "李氏·李成琮一支·宗儒宗文宗筠宗勋房（李代龙支系谱·桂果镇戈仲坞葫芦井·十六至十八代）",
  lidelong: "李氏·李德隆一支·德隆德祥房（李代龙支系谱·戈仲场葫芦井树林脚·十七至二十代）",
  lidelong2: "李氏·李德隆一支·德升房（李代龙支系谱·戈仲场葫芦井树林脚·十七至二十代）",
  lidesheng: "李氏·李德胜一支（李代龙支系谱·戈仲场树林脚·十七至二十代）",
  lideyun: "李氏·李德云一支（李代龙支系谱·桂果镇新化箐脚·十七至十九代）",
  lideyue: "李氏·李德跃一支（李代龙支系谱·桂果镇新华小平寨·十七至二十代）",
  lichaoyong: "李氏·李朝用一支（李代龙支系谱·以那分支名不详·十三至二十代）",
  lishicaifh: "李氏·李世才一支（李代龙支系谱·珠藏镇凤凰村·十三至二十二代）",
  lishiyuanag: "李氏·李世元一支·阿弓天香房（李代龙支系谱·阿弓镇屯上村新田·十六至二十二代）",
  lishaoyu: "李氏·李绍禹一支（李代龙支系谱·阿弓镇吊井村·十四至二十二代）",
  lifengqing: "李氏·李凤卿一支（李代龙支系谱·阿弓镇大田村菜子地·十二至二十一代）",
  lichaotian: "李氏·李朝天一支（李代龙支系谱·阿弓镇吹聋吹头·十一至二十一代）",
  liqiongzhen: "李氏·李琼贞一支（李代龙支系谱·阿弓镇大寨村黄泥硐·十八至二十一代）",
  liqionghui: "李氏·李琼辉一支（李代龙支系谱·阿弓镇联合村小岩上·十八至二十三代）",
  lichengzhi: "李氏·李成枝一支·主干（李代龙支系谱·白泥乡云碧村中寨·十一至十七代）",
  lichengzhi2: "李氏·李成枝一支·子成等五房（李代龙支系谱·白泥乡云碧村中寨·十一至十三代）",
  lichengzhi3: "李氏·李成枝一支·在清在明房（李代龙支系谱·白泥乡云碧村中寨·十七至二十一代）",
  lichengzhi4: "李氏·李成枝一支·在文房（李代龙支系谱·白泥乡云碧村中寨·十七至二十一代）",
  lichengzhi5: "李氏·李成枝一支·在武房（李代龙支系谱·白泥乡云碧村中寨·十七至二十一代）",
  lichengzhi6: "李氏·李成枝一支·正祥房主干（李代龙支系谱·白泥乡云碧村中寨·十二至十八代）",
  lichengzhi7: "李氏·李成枝一支·在祥房（李代龙支系谱·白泥乡云碧村中寨·十八至二十一代）",
  lichengzhi8: "李氏·李成枝一支·在田房（李代龙支系谱·白泥乡云碧村中寨·十八至二十一代）",
  lichengzhi9: "李氏·李成枝一支·朝荣房（李代龙支系谱·白泥乡云碧村中寨·十三至二十二代）",
  lichengzhi10: "李氏·李成枝一支·正乾房（李代龙支系谱·白泥乡云碧村中寨·十二至十五代·乾隆年间）",
  lichengzhi11: "李氏·李成枝一支·正位正相正玉房（李代龙支系谱·白泥乡云碧村中寨·十二至十七代）",
  litianmeinl: "李氏·李天美一支（李代龙支系谱·白泥乡白泥村那拢·十五至二十一代）",
  liyongfubn: "李氏·李永福一支（李代龙支系谱·白泥乡那里村·十六至二十二代）",
  lijinbang: "李氏·李金榜一支（李代龙支系谱·白泥乡前进村·十一至二十一代）",
  lichongchangxq: "李氏·李崇昌一支（李代龙支系谱·白泥乡新黔村王家寨·十九至二十一代）",
  lixitai: "李氏·李喜泰一支（李代龙支系谱·白泥乡新黔村·十九至二十二代）",
  lihaiting: "李氏·李海廷一支（李代龙支系谱·白泥乡联合村·十八至二十一代）",
  lichongzhouxq: "李氏·李崇周一支（李代龙支系谱·白泥乡新黔村王家寨·十八至二十一代）",
  lidezhousy: "李氏·李德周一支（李代龙支系谱·白泥乡水营村·十八至二十一代）",
  lixinglian: "李氏·李兴连一支（李代龙支系谱·白泥乡新黔村下岩脚·十八至二十二代）",
  lideyang: "李氏·李德杨一支（李代龙支系谱·白泥乡白泥村·十八至二十二代）",
  litianmeilh: "李氏·李天美一支（李代龙支系谱·白泥乡联合村·十六至二十一代）",
  lizhengguilh: "李氏·李正贵一支（李代龙支系谱·白泥乡联合村·十五至二十代）",
  lishaozhou: "李氏·李绍舟一支（李代龙支系谱·白泥乡新黔村王家寨·十九至二十一代）",
  lishenglong: "李氏·李生隆一支（李代龙支系谱·白泥乡新黔村王家寨·十八至二十代）",
  lilongchangsh: "李氏·李隆昌一支（李代龙支系谱·白泥乡三合村·二十至二十一代）",
  lijinhai: "李氏·李金海一支（李代龙支系谱·白泥乡倮木村石牛角·二十至二十三代）",
  litingyan: "李氏·李廷彦一支（李代龙支系谱·白泥乡新寨村·十五至二十一代）",
  lizhengtang: "李氏·李正堂一支（李代龙支系谱·白泥乡联合村·十四至二十代）",
  liwenxian: "李氏·李文先一支（李代龙支系谱·白泥乡前进村蜂子岩·十五至二十二代）",
  lihongzhen: "李氏·李洪珍一支（李代龙支系谱·白泥大树脚村·十五至二十代）",
  liyingxue: "李氏·李应学一支（李代龙支系谱·白泥乡前进村·十四至二十一代）",
  lishifubsb: "李氏·李士甫一支（李代龙支系谱·白泥乡播梭坝·十三至二十代）",
  liqimingyjb: "李氏·李启明一支（李代龙支系谱·白泥乡喻家坝·十四至二十一代）",
  lirongzhi: "李氏·李荣枝一支·主干（李代龙支系谱·白泥乡新寨村·十二至十四代）",
  lirongzhi3: "李氏·李荣枝一支·国相房（李代龙支系谱·白泥乡新寨村·十四至十九代）",
  lirongzhi2: "李氏·李荣枝一支·崇泰崇安崇元房（李代龙支系谱·白泥乡新寨村·十九至二十二代）",
  lishiqiangbsb: "李氏·李世强一支（李代龙支系谱·白泥乡播梭坝·十一至二十一代）",
  lizhengqiyb: "李氏·李正起一支（李代龙支系谱·白泥乡云碧村·接李成枝一支子成房）",
  lidengtang: "李氏·李登堂一支（李代龙支系谱·白泥乡起马村·十三至二十二代）",
  lihongxiang: "李氏·李洪相一支（李代龙支系谱·白泥乡新黔村·十六至二十代）",
  liliangshan: "李氏·李良山一支（李代龙支系谱·白泥乡梭过·十六至二十二代）",
  lihongyu: "李氏·李洪玉一支（李代龙支系谱·白泥乡那里村·十六至二十代）",
  lizongqi: "李氏·李宗其一支（李代龙支系谱·白泥乡前进村落坑·十七至二十二代）",
  lishunqing: "李氏·李顺清一支（李代龙支系谱·白泥乡白泥村兴发·十九至二十二代）",
  litianxingxjc: "李氏·李天兴一支（李代龙支系谱·熊家场乡大桥村桥上组·十六至二十二代）",
  litingjie: "李氏·李廷杰一支·学崇房（李代龙支系谱·后寨乡花树村·接李辅廷一支文凤之子志朝）",
  liyungui: "李氏·李云贵一支（李代龙支系谱·后寨乡花树村·十六至二十代）",
  liyungui2: "李氏·李云贵一支·隆英房（李代龙支系谱·后寨乡花树村）",
  liyungui3: "李氏·李云贵一支·隆富房（李代龙支系谱·后寨乡花树村）",
  lishixiansp: "李氏·李世先一支（李代龙支系谱·少普乡丫口寨村·十一至十九代）",
  lishixiansp2: "李氏·李世先一支·崇文房（李代龙支系谱·少普乡丫口寨村）",
  lishixiansp3: "李氏·李世先一支·崇先崇学崇武房（李代龙支系谱·少普乡丫口寨村）",
  lidaming: "李氏·李大明一支（李代龙支系谱·少普乡箐脚·十二至二十一代）",
  lizailong: "李氏·李在龙一支·主干及宗堂房（李代龙支系谱·少普乡街上村·接李世先支系成秀）",
  lizailong2: "李氏·李在龙一支·宗文房（李代龙支系谱·少普乡街上村）",
  lizailong3: "李氏·李在龙一支·德本德仲诸子房（李代龙支系谱·少普乡街上村）",
  lizailong4: "李氏·李在龙一支·德科诸子房（李代龙支系谱·少普乡街上村）",
  liguoliang: "李氏·李国良一支（李代龙支系谱·少普乡化董·十四至二十一代）",
  liguoliang3: "李氏·李国良一支·崇本房（李代龙支系谱·少普乡化董）",
  liguoliang2: "李氏·李国良一支·崇华崇伦房（李代龙支系谱·少普乡化董）",
  lishimeixh: "李氏·李士美一支（李代龙支系谱·少普乡小河村·十三至二十一代）",
  lishimeixh2: "李氏·李士美一支·德举德相房（李代龙支系谱·少普乡小河村）",
  lishifulm: "李氏·李士甫一支·正发洪德房（李代龙支系谱·少普乡联盟村·接播梭坝李士甫）",
  lizhengguixhg: "李氏·李正贵一支·洪升房（李代龙支系谱·三圹镇小河沟·接白泥联合李正贵）",
  lizhengguixhg2: "李氏·李正贵一支·德龙德洪房（李代龙支系谱·三圹镇小河沟）",
  liqiongdian: "李氏·李琼典一支（李代龙支系谱·少普乡狗场村上坝组·十八至二十二代）",
  lihongxiangmc: "李氏·李洪相一支（李代龙支系谱·少普乡下木楚·十六至二十一代）",
  likaihua: "李氏·李开化一支（李代龙支系谱·少普乡尾巴寨·十四至二十一代）",
  likaihua2: "李氏·李开化一支·华芳房（李代龙支系谱·少普乡尾巴寨）",
  lizongrongtjd: "李氏·李宗荣一支（李代龙支系谱·熊家场乡陶家硐·十七至二十二代）",
  lizongrongtjd2: "李氏·李宗荣一支·隆先隆祥隆芳房（李代龙支系谱·熊家场乡陶家硐）",
  lizongwenbj: "李氏·李宗文一支（李代龙支系谱·熊家场乡八甲村·十七至二十代）",
  lichaoyangsk: "李氏·李朝阳一支（李代龙支系谱·三圹镇鱼多猓麻窝头·十二至二十代·与少普李士美一支同源）",
  lichaoyangsk2: "李氏·李朝阳一支·宗齐房（李代龙支系谱·三圹镇鱼多猓）",
  litianqing: "李氏·李天清一支（李代龙支系谱·三圹镇高石坝·十六至二十代）",
  lijunheng: "李氏·李君衡一支·主干及宗华房（李代龙支系谱·三圹镇鱼多猓丫口上·十一至二十代）",
  lijunheng2: "李氏·李君衡一支·宗富房（李代龙支系谱·三圹镇鱼多猓丫口上）",
  lizongfa: "李氏·李宗法一支（李代龙支系谱·金龙乡细木村龙窝寨·十六至二十二代）",
  lideshenglw: "李氏·李德升一支（李代龙支系谱·金龙乡细木村龙窝寨·十七至二十三代）",
  lizongwenlw: "李氏·李宗文一支（李代龙支系谱·金龙乡龙窝寨岩脚背后·十六至二十二代）",
  lishiju: "李氏·李士举一支·主干（李代龙支系谱·金龙乡细木村龙窝寨·十一至十九代·龙窝开辟始祖）",
  lishiju2: "李氏·李士举一支·崇钦房（李代龙支系谱·金龙乡细木村龙窝寨）",
  lishiju3: "李氏·李士举一支·发昌发忠发书房（李代龙支系谱·金龙乡细木村龙窝寨）",
  litianpei: "李氏·李天培一支（李代龙支系谱·金龙乡中平村·十五至二十三代）",
  litianyuanqx: "李氏·李天元一支（李代龙支系谱·金龙乡七星村·十六至二十代）",
  lizongqiong: "李氏·李天培一支·宗琼房（李代龙支系谱·金龙乡细木村龙窝寨·十六至二十二代）",
  lichaolong: "李氏·李朝龙一支·主干（李代龙支系谱·金龙乡细木龙窝寨·十四至十九代·1726年起）",
  lichaolong2: "李氏·李朝龙一支·崇才崇善房（李代龙支系谱·金龙乡细木龙窝寨）",
  lichaolong3: "李氏·李朝龙一支·崇贵房（李代龙支系谱·金龙乡细木龙窝寨·并李子正一支）",
  lichaolong4: "李氏·李朝龙一支·崇高崇爵崇志崇胜房（李代龙支系谱·金龙乡细木龙窝寨）",
  liwengui: "李氏·李文贵一支·主干及良清房（李代龙支系谱·金龙乡细木村龙窝寨·十四至十九代）",
  liwengui5: "李氏·李文贵一支·良伯天经房（李代龙支系谱·金龙乡细木村龙窝寨）",
  liwengui2: "李氏·李文贵一支·崇元崇万房（李代龙支系谱·金龙乡细木村龙窝寨）",
  liwengui7: "李氏·李文贵一支·崇科崇顺房（李代龙支系谱·金龙乡细木村龙窝寨）",
  liwengui3: "李氏·李文贵一支·崇诗崇润房（李代龙支系谱·金龙乡细木村龙窝寨）",
  liwengui6: "李氏·李文贵一支·崇秀房（李代龙支系谱·金龙乡细木村龙窝寨）",
  liwengui4: "李氏·李文贵一支·德信房（李代龙支系谱·金龙乡细木村龙窝寨）",
  liguochen: "李氏·李国臣一支（李代龙支系谱·阿弓镇狗场村·十一至十九代）",
  lishilun: "李氏·李世伦一支（李代龙支系谱·八步镇倒马坎·十一至二十一代）",
  lishijienjc: "李氏·李世杰一支（李代龙支系谱·八步镇牛角冲·十一至二十代·接李士臣与少普李大明）",
  lishijienjc2: "李氏·李世杰一支·德全德华房（李代龙支系谱·八步镇牛角冲）",
  lishiyuanxc: "李氏·李世元一支·主干（李代龙支系谱·八步镇新场小寨·十三至十八代·接绮陌李世先士学）",
  lishiyuanxc2: "李氏·李世元一支·崇富房（李代龙支系谱·八步镇新场小寨）",
  lishiyuanxc3: "李氏·李世元一支·崇贵崇友崇元房（李代龙支系谱·八步镇新场小寨）",
  lishijiedmz: "李氏·李世杰一支·大元士伦房（李代龙支系谱·以那镇对门寨·十二至十八代）",
  lishijiedmz2: "李氏·李世杰一支·宗禄诸孙房（李代龙支系谱·以那镇对门寨）",
  lishijiedmz3: "李氏·李世杰一支·德圹德芳房（李代龙支系谱·以那镇对门寨）",
  lishixionglbz: "李氏·李世雄一支（李代龙支系谱·以那镇李保寨·十一至二十二代）",
  liwenying: "李氏·李文英一支（李代龙支系谱·以那镇凉山村·十三至二十代·接李士举一支子清）",
  liwenying2: "李氏·李文英一支·春隆永隆房（李代龙支系谱·以那镇凉山村）",
  lixuegui: "李氏·李学贵一支（李代龙支系谱·以那镇杨宝寨·十六至二十一代）",
  lishichenhsz: "李氏·李士臣一支（李代龙支系谱·以那镇朱家岩脚和尚庄·接马路脚李士臣绍贵绍华）",
  lishijiao: "李氏·李世蛟一支（李代龙支系谱·以那镇蒿枝冲·十一至十八代）",
  lishijiao2: "李氏·李世蛟一支·德恩德科房（李代龙支系谱·以那镇蒿枝冲）",
  lishijiejs: "李氏·李世杰一支·士相绍义房（李代龙支系谱·以那镇尖山·接对门寨士伦）",
  lizongfulbz: "李氏·李世雄一支·宗福房（李代龙支系谱·以那镇李保寨化泥村·并李明凤、李德昌一支）",
  lizongfulbz2: "李氏·李世雄一支·德权房（李代龙支系谱·以那镇李保寨）",
  lishizhenghn: "李氏·李世政一支·士品房（李代龙支系谱·以那镇化泥村·接花竹寨李世政）",
  liruxinyk: "李氏·李世杰一支·如檀天仲房（李代龙支系谱·以那化合村丫口田·接和尚庄如培）",
  lishijiao3: "李氏·李世蛟一支·宣举房（李代龙支系谱·以那镇蒿枝冲）",
  lizuochen: "李氏·李仕臣一支（李代龙支系谱·以那镇果永光星村·接花竹寨李世政大景）",
  liziwen: "李氏·李子文一支（李代龙支系谱·以那镇尖山对门寨·接李保寨李世雄子文）",
  lishijing: "李氏·李士经一支（李代龙支系谱·以那镇对门寨·接李世杰大元）",
  liruji: "李氏·李仕臣一支·如金房（李代龙支系谱·以那镇对门寨大岩脚·1709年起）",
  liruji2: "李氏·李仕臣一支·如金房·崇元房（李代龙支系谱·以那镇对门寨大岩脚）",
  lizijingls: "李氏·李子清一支·君正房（李代龙支系谱·以那镇良山村·接李士举一支子清）",
  lizijingls2: "李氏·李子清一支·泽隆勋隆诸子房（李代龙支系谱·以那镇良山村）",
  lishiruddz: "李氏·李世杰一支·士儒房（李代龙支系谱·以那镇对门寨）",
  lishijiao4: "李氏·李世蛟一支·宣召房（李代龙支系谱·以那镇箐口村）",
  lidelinhn: "李氏·李子亮一支·德林房（李代龙支系谱·以那镇化泥村·接李世雄宗福房）",
  lidachengsl: "李氏·李世元一支·士敏绍举房（李代龙支系谱·以那镇松林村朝门头·接绮陌李世先）",
  lishijiaoml: "李氏·李世蛟一支·宣友房（李代龙支系谱·以那镇毛栗村）",
  lishiqing: "李氏·李世清一支（李代龙支系谱·以那镇化泥田·十三至二十一代）",
  lishichents: "李氏·李世臣一支（李代龙支系谱·以那镇塔山村·十一至二十一代）",
  lifengbei: "李氏·李凤杯一支（李代龙支系谱·以那镇朱家小坡·十三至二十三代）",
  lishixiongcl: "李氏·李世雄一支·茶林主干（李代龙支系谱·以那镇对门寨茶林·天文1814起）",
  lishixiongcl2: "李氏·李世雄一支·茶林德祥德兴房（李代龙支系谱·以那镇对门寨茶林）",
  lishixiongcl3: "李氏·李世雄一支·茶林德隆德朝房（李代龙支系谱·以那镇对门寨茶林）",
  lishiqing2: "李氏·李世清一支·崇有崇贵房（李代龙支系谱·以那镇化泥田）",
  lishixiongcl4: "李氏·李世雄一支·茶林德兴房（李代龙支系谱·以那镇对门寨茶林）",
  lishaoren: "李氏·李大元一支·士经绍仁房（李代龙支系谱·以那镇和尚庄松林村）",
  lilongyinghsz: "李氏·李世杰一支·隆英房（李代龙支系谱·以那镇和尚庄村）",
  lishiwan: "李氏·李世万一支（李代龙支系谱·以那镇川硐背上·十一至二十二代）",
  lizongkuihh: "李氏·李世雄一支·天爵宗奎房（李代龙支系谱·以那镇化合村）",
  lichongzhihn: "李氏·李明凤一支·崇枝房（李代龙支系谱·以那镇化泥村）",
  lizongcaigsk: "李氏·李世杰一支·天萃宗财房（李代龙支系谱·以那镇高石坎）",
  lizide: "李氏·李鹏臣一支·万用子德房（李代龙支系谱·板桥乡千二系小凸桥·接李万用一支）",
  lizide2: "李氏·李鹏臣一支·如贤房（李代龙支系谱·板桥乡）",
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
  ["liruyan", lipu_liruyan as GenealogyDataset],
  ["liruyanfeng", lipu_liruyanfeng as GenealogyDataset],
  ["litiancai", lipu_litiancai as GenealogyDataset],
  ["lifuting", lipu_lifuting as GenealogyDataset],
  ["lifuting2", lipu_lifuting2 as GenealogyDataset],
  ["lishide", lipu_lishide as GenealogyDataset],
  ["lishidechongyuan", lipu_lishidechongyuan as GenealogyDataset],
  ["lichongzhen", lipu_lichongzhen as GenealogyDataset],
  ["lidrong", lipu_lidrong as GenealogyDataset],
  ["lizongyun", lipu_lizongyun as GenealogyDataset],
  ["lichongyu", lipu_lichongyu as GenealogyDataset],
  ["lishixian", lipu_lishixian as GenealogyDataset],
  ["lishixian2", lipu_lishixian2 as GenealogyDataset],
  ["lizongfu", lipu_lizongfu as GenealogyDataset],
  ["liwen", lipu_liwen as GenealogyDataset],
  ["lizongbaohm", lipu_lizongbaohm as GenealogyDataset],
  ["lizongxiu", lipu_lizongxiu as GenealogyDataset],
  ["lizongxiu2", lipu_lizongxiu2 as GenealogyDataset],
  ["lizhilong", lipu_lizhilong as GenealogyDataset],
  ["lishichen", lipu_lishichen as GenealogyDataset],
  ["lishichen2", lipu_lishichen2 as GenealogyDataset],
  ["lishichen3", lipu_lishichen3 as GenealogyDataset],
  ["lishizheng", lipu_lishizheng as GenealogyDataset],
  ["lishixianqm", lipu_lishixianqm as GenealogyDataset],
  ["lishixianqm2", lipu_lishixianqm2 as GenealogyDataset],
  ["lishixianqm3", lipu_lishixianqm3 as GenealogyDataset],
  ["lishixianqm4", lipu_lishixianqm4 as GenealogyDataset],
  ["lishixianqm5", lipu_lishixianqm5 as GenealogyDataset],
  ["lishicheng", lipu_lishicheng as GenealogyDataset],
  ["lishicheng2", lipu_lishicheng2 as GenealogyDataset],
  ["lishicheng3", lipu_lishicheng3 as GenealogyDataset],
  ["lichengcong", lipu_lichengcong as GenealogyDataset],
  ["lichengcong2", lipu_lichengcong2 as GenealogyDataset],
  ["lidelong", lipu_lidelong as GenealogyDataset],
  ["lidelong2", lipu_lidelong2 as GenealogyDataset],
  ["lidesheng", lipu_lidesheng as GenealogyDataset],
  ["lideyun", lipu_lideyun as GenealogyDataset],
  ["lideyue", lipu_lideyue as GenealogyDataset],
  ["lichaoyong", lipu_lichaoyong as GenealogyDataset],
  ["lishicaifh", lipu_lishicaifh as GenealogyDataset],
  ["lishiyuanag", lipu_lishiyuanag as GenealogyDataset],
  ["lishaoyu", lipu_lishaoyu as GenealogyDataset],
  ["lifengqing", lipu_lifengqing as GenealogyDataset],
  ["lichaotian", lipu_lichaotian as GenealogyDataset],
  ["liqiongzhen", lipu_liqiongzhen as GenealogyDataset],
  ["liqionghui", lipu_liqionghui as GenealogyDataset],
  ["lichengzhi", lipu_lichengzhi as GenealogyDataset],
  ["lichengzhi2", lipu_lichengzhi2 as GenealogyDataset],
  ["lichengzhi3", lipu_lichengzhi3 as GenealogyDataset],
  ["lichengzhi4", lipu_lichengzhi4 as GenealogyDataset],
  ["lichengzhi5", lipu_lichengzhi5 as GenealogyDataset],
  ["lichengzhi6", lipu_lichengzhi6 as GenealogyDataset],
  ["lichengzhi7", lipu_lichengzhi7 as GenealogyDataset],
  ["lichengzhi8", lipu_lichengzhi8 as GenealogyDataset],
  ["lichengzhi9", lipu_lichengzhi9 as GenealogyDataset],
  ["lichengzhi10", lipu_lichengzhi10 as GenealogyDataset],
  ["lichengzhi11", lipu_lichengzhi11 as GenealogyDataset],
  ["litianmeinl", lipu_litianmeinl as GenealogyDataset],
  ["liyongfubn", lipu_liyongfubn as GenealogyDataset],
  ["lijinbang", lipu_lijinbang as GenealogyDataset],
  ["lichongchangxq", lipu_lichongchangxq as GenealogyDataset],
  ["lixitai", lipu_lixitai as GenealogyDataset],
  ["lihaiting", lipu_lihaiting as GenealogyDataset],
  ["lichongzhouxq", lipu_lichongzhouxq as GenealogyDataset],
  ["lidezhousy", lipu_lidezhousy as GenealogyDataset],
  ["lixinglian", lipu_lixinglian as GenealogyDataset],
  ["lideyang", lipu_lideyang as GenealogyDataset],
  ["litianmeilh", lipu_litianmeilh as GenealogyDataset],
  ["lizhengguilh", lipu_lizhengguilh as GenealogyDataset],
  ["lishaozhou", lipu_lishaozhou as GenealogyDataset],
  ["lishenglong", lipu_lishenglong as GenealogyDataset],
  ["lilongchangsh", lipu_lilongchangsh as GenealogyDataset],
  ["lijinhai", lipu_lijinhai as GenealogyDataset],
  ["litingyan", lipu_litingyan as GenealogyDataset],
  ["lizhengtang", lipu_lizhengtang as GenealogyDataset],
  ["liwenxian", lipu_liwenxian as GenealogyDataset],
  ["lihongzhen", lipu_lihongzhen as GenealogyDataset],
  ["liyingxue", lipu_liyingxue as GenealogyDataset],
  ["lishifubsb", lipu_lishifubsb as GenealogyDataset],
  ["liqimingyjb", lipu_liqimingyjb as GenealogyDataset],
  ["lirongzhi", lipu_lirongzhi as GenealogyDataset],
  ["lirongzhi3", lipu_lirongzhi3 as GenealogyDataset],
  ["lirongzhi2", lipu_lirongzhi2 as GenealogyDataset],
  ["lishiqiangbsb", lipu_lishiqiangbsb as GenealogyDataset],
  ["lizhengqiyb", lipu_lizhengqiyb as GenealogyDataset],
  ["lidengtang", lipu_lidengtang as GenealogyDataset],
  ["lihongxiang", lipu_lihongxiang as GenealogyDataset],
  ["liliangshan", lipu_liliangshan as GenealogyDataset],
  ["lihongyu", lipu_lihongyu as GenealogyDataset],
  ["lizongqi", lipu_lizongqi as GenealogyDataset],
  ["lishunqing", lipu_lishunqing as GenealogyDataset],
  ["litianxingxjc", lipu_litianxingxjc as GenealogyDataset],
  ["litingjie", lipu_litingjie as GenealogyDataset],
  ["liyungui", lipu_liyungui as GenealogyDataset],
  ["liyungui2", lipu_liyungui2 as GenealogyDataset],
  ["liyungui3", lipu_liyungui3 as GenealogyDataset],
  ["lishixiansp", lipu_lishixiansp as GenealogyDataset],
  ["lishixiansp2", lipu_lishixiansp2 as GenealogyDataset],
  ["lishixiansp3", lipu_lishixiansp3 as GenealogyDataset],
  ["lidaming", lipu_lidaming as GenealogyDataset],
  ["lizailong", lipu_lizailong as GenealogyDataset],
  ["lizailong2", lipu_lizailong2 as GenealogyDataset],
  ["lizailong3", lipu_lizailong3 as GenealogyDataset],
  ["lizailong4", lipu_lizailong4 as GenealogyDataset],
  ["liguoliang", lipu_liguoliang as GenealogyDataset],
  ["liguoliang3", lipu_liguoliang3 as GenealogyDataset],
  ["liguoliang2", lipu_liguoliang2 as GenealogyDataset],
  ["lishimeixh", lipu_lishimeixh as GenealogyDataset],
  ["lishimeixh2", lipu_lishimeixh2 as GenealogyDataset],
  ["lishifulm", lipu_lishifulm as GenealogyDataset],
  ["lizhengguixhg", lipu_lizhengguixhg as GenealogyDataset],
  ["lizhengguixhg2", lipu_lizhengguixhg2 as GenealogyDataset],
  ["liqiongdian", lipu_liqiongdian as GenealogyDataset],
  ["lihongxiangmc", lipu_lihongxiangmc as GenealogyDataset],
  ["likaihua", lipu_likaihua as GenealogyDataset],
  ["likaihua2", lipu_likaihua2 as GenealogyDataset],
  ["lizongrongtjd", lipu_lizongrongtjd as GenealogyDataset],
  ["lizongrongtjd2", lipu_lizongrongtjd2 as GenealogyDataset],
  ["lizongwenbj", lipu_lizongwenbj as GenealogyDataset],
  ["lichaoyangsk", lipu_lichaoyangsk as GenealogyDataset],
  ["lichaoyangsk2", lipu_lichaoyangsk2 as GenealogyDataset],
  ["litianqing", lipu_litianqing as GenealogyDataset],
  ["lijunheng", lipu_lijunheng as GenealogyDataset],
  ["lijunheng2", lipu_lijunheng2 as GenealogyDataset],
  ["lizongfa", lipu_lizongfa as GenealogyDataset],
  ["lideshenglw", lipu_lideshenglw as GenealogyDataset],
  ["lizongwenlw", lipu_lizongwenlw as GenealogyDataset],
  ["lishiju", lipu_lishiju as GenealogyDataset],
  ["lishiju2", lipu_lishiju2 as GenealogyDataset],
  ["lishiju3", lipu_lishiju3 as GenealogyDataset],
  ["litianpei", lipu_litianpei as GenealogyDataset],
  ["litianyuanqx", lipu_litianyuanqx as GenealogyDataset],
  ["lizongqiong", lipu_lizongqiong as GenealogyDataset],
  ["lichaolong", lipu_lichaolong as GenealogyDataset],
  ["lichaolong2", lipu_lichaolong2 as GenealogyDataset],
  ["lichaolong3", lipu_lichaolong3 as GenealogyDataset],
  ["lichaolong4", lipu_lichaolong4 as GenealogyDataset],
  ["liwengui", lipu_liwengui as GenealogyDataset],
  ["liwengui5", lipu_liwengui5 as GenealogyDataset],
  ["liwengui2", lipu_liwengui2 as GenealogyDataset],
  ["liwengui7", lipu_liwengui7 as GenealogyDataset],
  ["liwengui3", lipu_liwengui3 as GenealogyDataset],
  ["liwengui6", lipu_liwengui6 as GenealogyDataset],
  ["liwengui4", lipu_liwengui4 as GenealogyDataset],
  ["liguochen", lipu_liguochen as GenealogyDataset],
  ["lishilun", lipu_lishilun as GenealogyDataset],
  ["lishijienjc", lipu_lishijienjc as GenealogyDataset],
  ["lishijienjc2", lipu_lishijienjc2 as GenealogyDataset],
  ["lishiyuanxc", lipu_lishiyuanxc as GenealogyDataset],
  ["lishiyuanxc2", lipu_lishiyuanxc2 as GenealogyDataset],
  ["lishiyuanxc3", lipu_lishiyuanxc3 as GenealogyDataset],
  ["lishijiedmz", lipu_lishijiedmz as GenealogyDataset],
  ["lishijiedmz2", lipu_lishijiedmz2 as GenealogyDataset],
  ["lishijiedmz3", lipu_lishijiedmz3 as GenealogyDataset],
  ["lishixionglbz", lipu_lishixionglbz as GenealogyDataset],
  ["liwenying", lipu_liwenying as GenealogyDataset],
  ["liwenying2", lipu_liwenying2 as GenealogyDataset],
  ["lixuegui", lipu_lixuegui as GenealogyDataset],
  ["lishichenhsz", lipu_lishichenhsz as GenealogyDataset],
  ["lishijiao", lipu_lishijiao as GenealogyDataset],
  ["lishijiao2", lipu_lishijiao2 as GenealogyDataset],
  ["lishijiejs", lipu_lishijiejs as GenealogyDataset],
  ["lizongfulbz", lipu_lizongfulbz as GenealogyDataset],
  ["lizongfulbz2", lipu_lizongfulbz2 as GenealogyDataset],
  ["lishizhenghn", lipu_lishizhenghn as GenealogyDataset],
  ["liruxinyk", lipu_liruxinyk as GenealogyDataset],
  ["lishijiao3", lipu_lishijiao3 as GenealogyDataset],
  ["lizuochen", lipu_lizuochen as GenealogyDataset],
  ["liziwen", lipu_liziwen as GenealogyDataset],
  ["lishijing", lipu_lishijing as GenealogyDataset],
  ["liruji", lipu_liruji as GenealogyDataset],
  ["liruji2", lipu_liruji2 as GenealogyDataset],
  ["lizijingls", lipu_lizijingls as GenealogyDataset],
  ["lizijingls2", lipu_lizijingls2 as GenealogyDataset],
  ["lishiruddz", lipu_lishiruddz as GenealogyDataset],
  ["lishijiao4", lipu_lishijiao4 as GenealogyDataset],
  ["lidelinhn", lipu_lidelinhn as GenealogyDataset],
  ["lidachengsl", lipu_lidachengsl as GenealogyDataset],
  ["lishijiaoml", lipu_lishijiaoml as GenealogyDataset],
  ["lishiqing", lipu_lishiqing as GenealogyDataset],
  ["lishichents", lipu_lishichents as GenealogyDataset],
  ["lifengbei", lipu_lifengbei as GenealogyDataset],
  ["lishixiongcl", lipu_lishixiongcl as GenealogyDataset],
  ["lishixiongcl2", lipu_lishixiongcl2 as GenealogyDataset],
  ["lishixiongcl3", lipu_lishixiongcl3 as GenealogyDataset],
  ["lishiqing2", lipu_lishiqing2 as GenealogyDataset],
  ["lishixiongcl4", lipu_lishixiongcl4 as GenealogyDataset],
  ["lishaoren", lipu_lishaoren as GenealogyDataset],
  ["lilongyinghsz", lipu_lilongyinghsz as GenealogyDataset],
  ["lishiwan", lipu_lishiwan as GenealogyDataset],
  ["lizongkuihh", lipu_lizongkuihh as GenealogyDataset],
  ["lichongzhihn", lipu_lichongzhihn as GenealogyDataset],
  ["lizongcaigsk", lipu_lizongcaigsk as GenealogyDataset],
  ["lizide", lipu_lizide as GenealogyDataset],
  ["lizide2", lipu_lizide2 as GenealogyDataset],
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
