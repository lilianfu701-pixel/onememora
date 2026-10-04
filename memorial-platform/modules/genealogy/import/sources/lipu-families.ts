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
import lipu_liruyue from "./liruyue.lipu.data.json";
import lipu_liruyue2 from "./liruyue2.lipu.data.json";
import lipu_liruguan from "./liruguan.lipu.data.json";
import lipu_lishaoyongwx from "./lishaoyongwx.lipu.data.json";
import lipu_lijunzhenghg from "./lijunzhenghg.lipu.data.json";
import lipu_lijunzhenghg2 from "./lijunzhenghg2.lipu.data.json";
import lipu_lizongyuexjz from "./lizongyuexjz.lipu.data.json";
import lipu_lishichengal from "./lishichengal.lipu.data.json";
import lipu_lishifangert from "./lishifangert.lipu.data.json";
import lipu_lidemingek from "./lidemingek.lipu.data.json";
import lipu_lideanek from "./lideanek.lipu.data.json";
import lipu_lidekaiek from "./lidekaiek.lipu.data.json";
import lipu_lidekuiek from "./lidekuiek.lipu.data.json";
import lipu_lichongyiek from "./lichongyiek.lipu.data.json";
import lipu_lishaoenmf from "./lishaoenmf.lipu.data.json";
import lipu_lishaoenmf2 from "./lishaoenmf2.lipu.data.json";
import lipu_lishiwanhl from "./lishiwanhl.lipu.data.json";
import lipu_lishiwanhl2 from "./lishiwanhl2.lipu.data.json";
import lipu_lishiwanhl3 from "./lishiwanhl3.lipu.data.json";
import lipu_liminglongcg from "./liminglongcg.lipu.data.json";
import lipu_lishikui from "./lishikui.lipu.data.json";
import lipu_lishikui2 from "./lishikui2.lipu.data.json";
import lipu_lishikui3 from "./lishikui3.lipu.data.json";
import lipu_lishiyuanyl from "./lishiyuanyl.lipu.data.json";
import lipu_lichongmingcg from "./lichongmingcg.lipu.data.json";
import lipu_lishifangxjc from "./lishifangxjc.lipu.data.json";
import lipu_lideronghsc from "./lideronghsc.lipu.data.json";
import lipu_lishixianxy from "./lishixianxy.lipu.data.json";
import lipu_lishixianxy2 from "./lishixianxy2.lipu.data.json";
import lipu_lishixianxy3 from "./lishixianxy3.lipu.data.json";
import lipu_lizongguiyjh from "./lizongguiyjh.lipu.data.json";
import lipu_lizhilongbq from "./lizhilongbq.lipu.data.json";
import lipu_lifengfums from "./lifengfums.lipu.data.json";
import lipu_litianrunsl from "./litianrunsl.lipu.data.json";
import lipu_lijianchenht from "./lijianchenht.lipu.data.json";
import lipu_lijianchenht2 from "./lijianchenht2.lipu.data.json";
import lipu_lijianchenht3 from "./lijianchenht3.lipu.data.json";
import lipu_lishaolianht from "./lishaolianht.lipu.data.json";
import lipu_lishaolianht2 from "./lishaolianht2.lipu.data.json";
import lipu_liminglongcg2 from "./liminglongcg2.lipu.data.json";
import lipu_lihongdengzw from "./lihongdengzw.lipu.data.json";
import lipu_lihongdengzw2 from "./lihongdengzw2.lipu.data.json";
import lipu_litingcuilbs from "./litingcuilbs.lipu.data.json";
import lipu_lidengkuismz from "./lidengkuismz.lipu.data.json";
import lipu_lichaolongxz from "./lichaolongxz.lipu.data.json";
import lipu_lichaolongxz2 from "./lichaolongxz2.lipu.data.json";
import lipu_lichaolongxz3 from "./lichaolongxz3.lipu.data.json";
import lipu_lichaolongxz4 from "./lichaolongxz4.lipu.data.json";
import lipu_lichaolongxz5 from "./lichaolongxz5.lipu.data.json";
import lipu_litingxiangsb from "./litingxiangsb.lipu.data.json";
import lipu_lishiliantzs from "./lishiliantzs.lipu.data.json";
import lipu_lishiliantzs2 from "./lishiliantzs2.lipu.data.json";
import lipu_lishiliantzs3 from "./lishiliantzs3.lipu.data.json";
import lipu_litingfuxjl from "./litingfuxjl.lipu.data.json";
import lipu_lichonggaolly from "./lichonggaolly.lipu.data.json";
import lipu_lichuntingyp from "./lichuntingyp.lipu.data.json";
import lipu_litingcaizc from "./litingcaizc.lipu.data.json";
import lipu_litingcaizc2 from "./litingcaizc2.lipu.data.json";
import lipu_liweisp from "./liweisp.lipu.data.json";
import lipu_liweisp2 from "./liweisp2.lipu.data.json";
import lipu_liweisp3 from "./liweisp3.lipu.data.json";
import lipu_liweisp4 from "./liweisp4.lipu.data.json";
import lipu_liweisp5 from "./liweisp5.lipu.data.json";
import lipu_lizhengkunljc from "./lizhengkunljc.lipu.data.json";
import lipu_lizhengkunljc2 from "./lizhengkunljc2.lipu.data.json";
import lipu_lichaoyangljc from "./lichaoyangljc.lipu.data.json";
import lipu_lichaoyangljc2 from "./lichaoyangljc2.lipu.data.json";
import lipu_liwenjubp from "./liwenjubp.lipu.data.json";
import lipu_liwenjubp2 from "./liwenjubp2.lipu.data.json";
import lipu_liguangdoubp from "./liguangdoubp.lipu.data.json";
import lipu_likunxiuzl from "./likunxiuzl.lipu.data.json";
import lipu_likunxiuzl2 from "./likunxiuzl2.lipu.data.json";
import lipu_lizhiyuanxp from "./lizhiyuanxp.lipu.data.json";
import lipu_lizhiyuanxp2 from "./lizhiyuanxp2.lipu.data.json";
import lipu_lizhiyuanxp3 from "./lizhiyuanxp3.lipu.data.json";
import lipu_lizihongwz from "./lizihongwz.lipu.data.json";
import lipu_lishirentb from "./lishirentb.lipu.data.json";
import lipu_lishangchaowj from "./lishangchaowj.lipu.data.json";
import lipu_lishengxunly from "./lishengxunly.lipu.data.json";
import lipu_lichunyunml from "./lichunyunml.lipu.data.json";
import lipu_lishichaopp from "./lishichaopp.lipu.data.json";
import lipu_lishichaopp2 from "./lishichaopp2.lipu.data.json";
import lipu_lishichaopp3 from "./lishichaopp3.lipu.data.json";
import lipu_lishichaopp4 from "./lishichaopp4.lipu.data.json";
import lipu_lishichaopp5 from "./lishichaopp5.lipu.data.json";
import lipu_lichengyibg from "./lichengyibg.lipu.data.json";
import lipu_liyinghuagl from "./liyinghuagl.lipu.data.json";
import lipu_liyinghuagl2 from "./liyinghuagl2.lipu.data.json";
import lipu_liyinghuagl3 from "./liyinghuagl3.lipu.data.json";
import lipu_lizhichengmc from "./lizhichengmc.lipu.data.json";
import lipu_lizhichengmc2 from "./lizhichengmc2.lipu.data.json";
import lipu_lizhichengmc3 from "./lizhichengmc3.lipu.data.json";
import lipu_lizhichengmc4 from "./lizhichengmc4.lipu.data.json";
import lipu_lihuaxianlj from "./lihuaxianlj.lipu.data.json";
import lipu_lijinlongpjw from "./lijinlongpjw.lipu.data.json";
import lipu_lijinlongpjw2 from "./lijinlongpjw2.lipu.data.json";
import lipu_lishimeinh from "./lishimeinh.lipu.data.json";
import lipu_lishimeinh2 from "./lishimeinh2.lipu.data.json";
import lipu_liyuanxiangnyz from "./liyuanxiangnyz.lipu.data.json";
import lipu_liyuanxiangnyz2 from "./liyuanxiangnyz2.lipu.data.json";
import lipu_liyuanxiangnyz3 from "./liyuanxiangnyz3.lipu.data.json";
import lipu_liyoubinnz from "./liyoubinnz.lipu.data.json";
import lipu_liyoubinnz2 from "./liyoubinnz2.lipu.data.json";
import lipu_liyoubinnz3 from "./liyoubinnz3.lipu.data.json";
import lipu_liyoubinnz4 from "./liyoubinnz4.lipu.data.json";
import lipu_liyoubinnz5 from "./liyoubinnz5.lipu.data.json";
import lipu_liyoubinnz6 from "./liyoubinnz6.lipu.data.json";
import lipu_liyoubinnz7 from "./liyoubinnz7.lipu.data.json";
import lipu_liyoubinnz8 from "./liyoubinnz8.lipu.data.json";
import lipu_lidingcaiyzy from "./lidingcaiyzy.lipu.data.json";
import lipu_lideqingyp from "./lideqingyp.lipu.data.json";
import lipu_liyouchunnr from "./liyouchunnr.lipu.data.json";
import lipu_liyouchunnr2 from "./liyouchunnr2.lipu.data.json";
import lipu_likuizhengdb from "./likuizhengdb.lipu.data.json";
import lipu_liyanhoubd from "./liyanhoubd.lipu.data.json";
import lipu_liyanhoubd2 from "./liyanhoubd2.lipu.data.json";
import lipu_liyanhoubd3 from "./liyanhoubd3.lipu.data.json";
import lipu_lichunguibd from "./lichunguibd.lipu.data.json";
import lipu_lichunzhongmd from "./lichunzhongmd.lipu.data.json";
import lipu_lichunzhongmd2 from "./lichunzhongmd2.lipu.data.json";
import lipu_lichaofuxj from "./lichaofuxj.lipu.data.json";
import lipu_liruxiudp from "./liruxiudp.lipu.data.json";
import lipu_liruxiudp2 from "./liruxiudp2.lipu.data.json";
import lipu_lihongkaimd from "./lihongkaimd.lipu.data.json";
import lipu_liyonganmr from "./liyonganmr.lipu.data.json";
import lipu_liguangcansy from "./liguangcansy.lipu.data.json";
import lipu_lishiwannz from "./lishiwannz.lipu.data.json";
import lipu_lilianghaojs from "./lilianghaojs.lipu.data.json";
import lipu_lilianghaojs2 from "./lilianghaojs2.lipu.data.json";
import lipu_lilianghaojs3 from "./lilianghaojs3.lipu.data.json";
import lipu_lishaohuajs from "./lishaohuajs.lipu.data.json";
import lipu_lishiyuantbt from "./lishiyuantbt.lipu.data.json";
import lipu_liwenkaotbt from "./liwenkaotbt.lipu.data.json";
import lipu_litianxiangsy from "./litianxiangsy.lipu.data.json";
import lipu_lishizhaobq from "./lishizhaobq.lipu.data.json";
import lipu_lishijunzjz from "./lishijunzjz.lipu.data.json";
import lipu_lishiqingnh from "./lishiqingnh.lipu.data.json";
import lipu_lishiqingnh2 from "./lishiqingnh2.lipu.data.json";
import lipu_lishiqingnh3 from "./lishiqingnh3.lipu.data.json";
import lipu_limeiqinggm from "./limeiqinggm.lipu.data.json";
import lipu_liyupeigm from "./liyupeigm.lipu.data.json";
import lipu_litianfugm from "./litianfugm.lipu.data.json";
import lipu_liqiyuanxz from "./liqiyuanxz.lipu.data.json";
import lipu_lishichenglj from "./lishichenglj.lipu.data.json";
import lipu_lishichenglj2 from "./lishichenglj2.lipu.data.json";
import lipu_lishichenglj3 from "./lishichenglj3.lipu.data.json";
import lipu_lishichenglj4 from "./lishichenglj4.lipu.data.json";
import lipu_lishichenglj5 from "./lishichenglj5.lipu.data.json";
import lipu_lishichenglj6 from "./lishichenglj6.lipu.data.json";
import lipu_lishichenglj7 from "./lishichenglj7.lipu.data.json";
import lipu_lichengzhilmt from "./lichengzhilmt.lipu.data.json";
import lipu_lichengzhilmt2 from "./lichengzhilmt2.lipu.data.json";
import lipu_lichengzhilmt3 from "./lichengzhilmt3.lipu.data.json";
import lipu_lizhengfamr from "./lizhengfamr.lipu.data.json";
import lipu_lizonghebq from "./lizonghebq.lipu.data.json";
import lipu_lidemingnh from "./lidemingnh.lipu.data.json";
import lipu_lilaobajb from "./lilaobajb.lipu.data.json";
import lipu_lizongyuanhz from "./lizongyuanhz.lipu.data.json";
import lipu_liwenpeiytt from "./liwenpeiytt.lipu.data.json";
import lipu_liwenpeiytt2 from "./liwenpeiytt2.lipu.data.json";
import lipu_liwenpeiytt3 from "./liwenpeiytt3.lipu.data.json";
import lipu_lishichenxb from "./lishichenxb.lipu.data.json";
import lipu_lishichenxb2 from "./lishichenxb2.lipu.data.json";
import lipu_lishichenxb3 from "./lishichenxb3.lipu.data.json";
import lipu_lishichenxb4 from "./lishichenxb4.lipu.data.json";
import lipu_lichongxixb from "./lichongxixb.lipu.data.json";
import lipu_lidejinzb from "./lidejinzb.lipu.data.json";
import lipu_lijuncailz from "./lijuncailz.lipu.data.json";
import lipu_lishiyingdlx from "./lishiyingdlx.lipu.data.json";
import lipu_lishiyingdlx2 from "./lishiyingdlx2.lipu.data.json";
import lipu_lichongdezb from "./lichongdezb.lipu.data.json";
import lipu_lidejiutb from "./lidejiutb.lipu.data.json";
import lipu_lizongrenbb from "./lizongrenbb.lipu.data.json";
import lipu_lijunyoudyc from "./lijunyoudyc.lipu.data.json";
import lipu_lijunyoudyc2 from "./lijunyoudyc2.lipu.data.json";
import lipu_lishizhengsj from "./lishizhengsj.lipu.data.json";
import lipu_lizongxiangxgz from "./lizongxiangxgz.lipu.data.json";
import lipu_lizongkuixgz from "./lizongkuixgz.lipu.data.json";
import lipu_lizhengjusld from "./lizhengjusld.lipu.data.json";
import lipu_lirukunsj from "./lirukunsj.lipu.data.json";
import lipu_liyongxihjz from "./liyongxihjz.lipu.data.json";
import lipu_lizongfaxgz from "./lizongfaxgz.lipu.data.json";
import lipu_lizongbaoqgj from "./lizongbaoqgj.lipu.data.json";
import lipu_lizongbaoqgj2 from "./lizongbaoqgj2.lipu.data.json";
import lipu_lizongbaoqgj3 from "./lizongbaoqgj3.lipu.data.json";
import lipu_lizongbaoqgj4 from "./lizongbaoqgj4.lipu.data.json";
import lipu_liyongkuimg from "./liyongkuimg.lipu.data.json";
import lipu_liyongkuimg2 from "./liyongkuimg2.lipu.data.json";
import lipu_liyongkuimg3 from "./liyongkuimg3.lipu.data.json";
import lipu_liyongkuimg4 from "./liyongkuimg4.lipu.data.json";
import lipu_lizongguisz from "./lizongguisz.lipu.data.json";
import lipu_lidefunby from "./lidefunby.lipu.data.json";
import lipu_lishijieml from "./lishijieml.lipu.data.json";
import lipu_lishijieml2 from "./lishijieml2.lipu.data.json";
import lipu_lipengchenaj from "./lipengchenaj.lipu.data.json";
import lipu_lidequansg from "./lidequansg.lipu.data.json";
import lipu_lishiyuanjs from "./lishiyuanjs.lipu.data.json";
import lipu_lichaokaitb from "./lichaokaitb.lipu.data.json";
import lipu_lizifengtj from "./lizifengtj.lipu.data.json";
import lipu_lizifengtj2 from "./lizifengtj2.lipu.data.json";
import lipu_lishaowumc from "./lishaowumc.lipu.data.json";
import lipu_lizonghannq from "./lizonghannq.lipu.data.json";
import lipu_lishiwandf from "./lishiwandf.lipu.data.json";
import lipu_lishiwenzc from "./lishiwenzc.lipu.data.json";
import lipu_lishijiezp from "./lishijiezp.lipu.data.json";
import lipu_licanchunzp from "./licanchunzp.lipu.data.json";
import lipu_lirimingwz from "./lirimingwz.lipu.data.json";
import lipu_lichaomeiltk from "./lichaomeiltk.lipu.data.json";
import lipu_liyuchush from "./liyuchush.lipu.data.json";
import lipu_lihongshunyj from "./lihongshunyj.lipu.data.json";
import lipu_lichaozuodb from "./lichaozuodb.lipu.data.json";
import lipu_lichaozuodb2 from "./lichaozuodb2.lipu.data.json";
import lipu_lichaozuodb3 from "./lichaozuodb3.lipu.data.json";
import lipu_lichaozuodb4 from "./lichaozuodb4.lipu.data.json";
import lipu_lichaozuodb5 from "./lichaozuodb5.lipu.data.json";
import lipu_lichaozuodb6 from "./lichaozuodb6.lipu.data.json";
import lipu_lichaozuodb7 from "./lichaozuodb7.lipu.data.json";
import lipu_lishiyuants from "./lishiyuants.lipu.data.json";
import lipu_lichuncaisb from "./lichuncaisb.lipu.data.json";
import lipu_lichuncaisb2 from "./lichuncaisb2.lipu.data.json";
import lipu_lishiyuanbyj from "./lishiyuanbyj.lipu.data.json";
import lipu_lishiyuanbyj2 from "./lishiyuanbyj2.lipu.data.json";
import lipu_lishiyuanbyj3 from "./lishiyuanbyj3.lipu.data.json";
import lipu_lishiyuanbyj4 from "./lishiyuanbyj4.lipu.data.json";
import lipu_lishiyuanbyj5 from "./lishiyuanbyj5.lipu.data.json";
import lipu_lishiyuanbyj6 from "./lishiyuanbyj6.lipu.data.json";
import lipu_lishiyuanbyj7 from "./lishiyuanbyj7.lipu.data.json";
import lipu_lishiyuanbyj8 from "./lishiyuanbyj8.lipu.data.json";
import lipu_lichongshoucg from "./lichongshoucg.lipu.data.json";
import lipu_lidemingtwq from "./lidemingtwq.lipu.data.json";
import lipu_liqingyunsc from "./liqingyunsc.lipu.data.json";
import lipu_lichengxuefe from "./lichengxuefe.lipu.data.json";
import lipu_lichengxuefe2 from "./lichengxuefe2.lipu.data.json";
import lipu_lichengxuefe3 from "./lichengxuefe3.lipu.data.json";
import lipu_liyingkuigd from "./liyingkuigd.lipu.data.json";
import lipu_liyingkuigd2 from "./liyingkuigd2.lipu.data.json";
import lipu_liyingkuigd3 from "./liyingkuigd3.lipu.data.json";
import lipu_liyingkuigd4 from "./liyingkuigd4.lipu.data.json";
import lipu_liyingkuigd5 from "./liyingkuigd5.lipu.data.json";
import lipu_liyingkuigd6 from "./liyingkuigd6.lipu.data.json";
import lipu_lichengkehz from "./lichengkehz.lipu.data.json";
import lipu_lichengkehz2 from "./lichengkehz2.lipu.data.json";
import lipu_lichengkehz3 from "./lichengkehz3.lipu.data.json";
import lipu_liguodongzx from "./liguodongzx.lipu.data.json";
import lipu_liguodongzx2 from "./liguodongzx2.lipu.data.json";
import lipu_liguodongzx3 from "./liguodongzx3.lipu.data.json";
import lipu_liguodongzx4 from "./liguodongzx4.lipu.data.json";
import lipu_liguodongzx5 from "./liguodongzx5.lipu.data.json";
import lipu_liguodongzx6 from "./liguodongzx6.lipu.data.json";
import lipu_liguodongzx7 from "./liguodongzx7.lipu.data.json";
import lipu_liguodongzx8 from "./liguodongzx8.lipu.data.json";
import lipu_liguodongzx9 from "./liguodongzx9.lipu.data.json";
import lipu_liguodongzx10 from "./liguodongzx10.lipu.data.json";
import lipu_liguodongzx11 from "./liguodongzx11.lipu.data.json";
import lipu_lixiantingdf from "./lixiantingdf.lipu.data.json";
import lipu_lixiantingdf2 from "./lixiantingdf2.lipu.data.json";
import lipu_lixiantingdf3 from "./lixiantingdf3.lipu.data.json";
import lipu_lixiantingdf4 from "./lixiantingdf4.lipu.data.json";
import lipu_lixiantingdf5 from "./lixiantingdf5.lipu.data.json";
import lipu_lixiantingdf6 from "./lixiantingdf6.lipu.data.json";
import lipu_lixiantingdf7 from "./lixiantingdf7.lipu.data.json";
import lipu_lixiantingdf8 from "./lixiantingdf8.lipu.data.json";
import lipu_lixiantingdf9 from "./lixiantingdf9.lipu.data.json";
import lipu_lixiantingdf10 from "./lixiantingdf10.lipu.data.json";
import lipu_lixiantingdf11 from "./lixiantingdf11.lipu.data.json";
import lipu_lixiantingdf12 from "./lixiantingdf12.lipu.data.json";
import lipu_lizhengkainj from "./lizhengkainj.lipu.data.json";
import lipu_lirunmeijs from "./lirunmeijs.lipu.data.json";
import lipu_liruqingwn from "./liruqingwn.lipu.data.json";
import lipu_lizongwu from "./lizongwu.lipu.data.json";
import lipu_lihongshun from "./lihongshun.lipu.data.json";
import lipu_lihonglian from "./lihonglian.lipu.data.json";
import lipu_liziquan from "./liziquan.lipu.data.json";
import lipu_qxjy_a01 from "./qxjy_a01.lipu.data.json";
import lipu_qxjy_a02 from "./qxjy_a02.lipu.data.json";
import lipu_qxjy_a03 from "./qxjy_a03.lipu.data.json";
import lipu_qxjy_a04 from "./qxjy_a04.lipu.data.json";
import lipu_qxjy_a05 from "./qxjy_a05.lipu.data.json";
import lipu_qxjy_a06 from "./qxjy_a06.lipu.data.json";
import lipu_qxjy_a07 from "./qxjy_a07.lipu.data.json";
import lipu_qxjy_a08 from "./qxjy_a08.lipu.data.json";
import lipu_qxjy_a09 from "./qxjy_a09.lipu.data.json";
import lipu_qxjy_a10 from "./qxjy_a10.lipu.data.json";
import lipu_qxjy_a11 from "./qxjy_a11.lipu.data.json";
import lipu_qxjy_a12 from "./qxjy_a12.lipu.data.json";
import lipu_qxjy_a13 from "./qxjy_a13.lipu.data.json";
import lipu_qxjy_a14 from "./qxjy_a14.lipu.data.json";
import lipu_qxjy_a15 from "./qxjy_a15.lipu.data.json";
import lipu_qxjy_a16 from "./qxjy_a16.lipu.data.json";
import lipu_qxjy_a17 from "./qxjy_a17.lipu.data.json";
import lipu_qxjy_a18 from "./qxjy_a18.lipu.data.json";
import lipu_qxjy_a19 from "./qxjy_a19.lipu.data.json";
import lipu_qxjy_a20 from "./qxjy_a20.lipu.data.json";
import lipu_qxjy_a21 from "./qxjy_a21.lipu.data.json";
import lipu_qxjy_a22 from "./qxjy_a22.lipu.data.json";
import lipu_qxjy_a23 from "./qxjy_a23.lipu.data.json";
import lipu_qxjy_a24 from "./qxjy_a24.lipu.data.json";
import lipu_qxjy_a25 from "./qxjy_a25.lipu.data.json";
import lipu_qxjy_a26 from "./qxjy_a26.lipu.data.json";
import lipu_qxjy_a27 from "./qxjy_a27.lipu.data.json";
import lipu_qxjy_a28 from "./qxjy_a28.lipu.data.json";
import lipu_qxjy_a29 from "./qxjy_a29.lipu.data.json";
import lipu_qxjy_a30 from "./qxjy_a30.lipu.data.json";
import lipu_qxjy_a31 from "./qxjy_a31.lipu.data.json";
import lipu_qxjy_a32 from "./qxjy_a32.lipu.data.json";
import lipu_qxjy_a33 from "./qxjy_a33.lipu.data.json";
import lipu_qxjy_a34 from "./qxjy_a34.lipu.data.json";
import lipu_qxjy_a35 from "./qxjy_a35.lipu.data.json";
import lipu_qxjy_a36 from "./qxjy_a36.lipu.data.json";
import lipu_qxjy_b01 from "./qxjy_b01.lipu.data.json";
import lipu_qxjy_b02 from "./qxjy_b02.lipu.data.json";
import lipu_qxjy_b03 from "./qxjy_b03.lipu.data.json";
import lipu_qxjy_c01 from "./qxjy_c01.lipu.data.json";
import lipu_qxjy_c02 from "./qxjy_c02.lipu.data.json";
import lipu_qxjy_c03 from "./qxjy_c03.lipu.data.json";
import lipu_qxjy_c04 from "./qxjy_c04.lipu.data.json";
import lipu_qxjy_c05 from "./qxjy_c05.lipu.data.json";
import lipu_qxjy_c06 from "./qxjy_c06.lipu.data.json";
import lipu_qxjy_c07 from "./qxjy_c07.lipu.data.json";
import lipu_qxjy_c08 from "./qxjy_c08.lipu.data.json";
import lipu_qxjy_c09 from "./qxjy_c09.lipu.data.json";
import lipu_qxjy_c10 from "./qxjy_c10.lipu.data.json";
import lipu_qxjy_c11 from "./qxjy_c11.lipu.data.json";
import lipu_qxjy_c12 from "./qxjy_c12.lipu.data.json";
import lipu_qxjy_c13 from "./qxjy_c13.lipu.data.json";
import lipu_qxjy_c14 from "./qxjy_c14.lipu.data.json";
import lipu_qxjy_c15 from "./qxjy_c15.lipu.data.json";
import lipu_qxjy_c16 from "./qxjy_c16.lipu.data.json";
import lipu_qxjy_c17 from "./qxjy_c17.lipu.data.json";
import lipu_qxjy_c18 from "./qxjy_c18.lipu.data.json";
import lipu_qxjy_c19 from "./qxjy_c19.lipu.data.json";
import lipu_qxjy_c20 from "./qxjy_c20.lipu.data.json";
import lipu_qxjy_c21 from "./qxjy_c21.lipu.data.json";
import lipu_qxjy_c22 from "./qxjy_c22.lipu.data.json";
import lipu_qxjy_c23 from "./qxjy_c23.lipu.data.json";
import lipu_qxjy_c24 from "./qxjy_c24.lipu.data.json";
import lipu_qxjy_c25 from "./qxjy_c25.lipu.data.json";
import lipu_qxjy_c26 from "./qxjy_c26.lipu.data.json";
import lipu_qxjy_c27 from "./qxjy_c27.lipu.data.json";
import lipu_qxjy_c28 from "./qxjy_c28.lipu.data.json";
import lipu_qxjy_c29 from "./qxjy_c29.lipu.data.json";
import lipu_qxjy_c30 from "./qxjy_c30.lipu.data.json";
import lipu_qxjy_c31 from "./qxjy_c31.lipu.data.json";
import lipu_qxjy_c32 from "./qxjy_c32.lipu.data.json";
import lipu_qxjy_c33 from "./qxjy_c33.lipu.data.json";
import lipu_qxjy_c34 from "./qxjy_c34.lipu.data.json";
import lipu_qxjy_c35 from "./qxjy_c35.lipu.data.json";
import lipu_qxjy_c36 from "./qxjy_c36.lipu.data.json";
import lipu_qxjy_c37 from "./qxjy_c37.lipu.data.json";
import lipu_qxjy_c38 from "./qxjy_c38.lipu.data.json";
import lipu_qxjy_c39 from "./qxjy_c39.lipu.data.json";
import lipu_qxjy_c40 from "./qxjy_c40.lipu.data.json";
import lipu_qxjy_c41 from "./qxjy_c41.lipu.data.json";
import lipu_qxjy_c42 from "./qxjy_c42.lipu.data.json";
import lipu_qxjy_c43 from "./qxjy_c43.lipu.data.json";

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
  liruyue: "板桥乡果义寨·李如玥一支",
  liruyue2: "板桥乡果义寨·李如玥一支·宗全德润房",
  liruguan: "板桥乡果义村·李如官一支",
  lishaoyongwx: "以那镇五星村·李绍勇一支",
  lijunzhenghg: "板桥乡红光村·李君正一支",
  lijunzhenghg2: "板桥乡红光村·李君正一支·崇喜崇山房",
  lizongyuexjz: "板桥乡玉龙村许家寨·李宗跃一支",
  lishichengal: "绮陌阿烈·李士成一支",
  lishifangert: "绮陌乡二圹村·李世芳一支",
  lidemingek: "绮陌乡二圹村·李德明德芳一支",
  lideanek: "绮陌乡二圹村·李德安一支",
  lidekaiek: "绮陌乡二圹村·李德凯一支",
  lidekuiek: "绮陌乡二圹村·李德魁一支",
  lichongyiek: "绮陌乡二圹村大沟边·李崇义一支",
  lishaoenmf: "绮陌乡墨峰村·李绍恩一支",
  lishaoenmf2: "绮陌乡墨峰村·李绍恩一支·德安房",
  lishiwanhl: "织金城关·化起·牛场·李世万一支·洪连房",
  lishiwanhl2: "李世万一支·洪连房·崇民崇友房",
  lishiwanhl3: "李世万一支·洪连房·崇华房",
  liminglongcg: "织金城关后冲·李明龙一支·绍明房",
  lishikui: "城关南门·龙场以支·李世魁一支",
  lishikui2: "李世魁一支·宗元房德全德寿",
  lishikui3: "李世魁一支·宗应房德明德昌",
  lishiyuanyl: "城关镇杨柳河·李世元一支·大成士学房",
  lichongmingcg: "织金城关镇·19代李崇明一支",
  lishifangxjc: "城关小教厂·李仕芳一支",
  lideronghsc: "城关镇黑石村·李德荣一支",
  lishixianxy: "中寨乡小院村·李世先一支",
  lishixianxy2: "中寨乡小院村·李世先一支·士荣绪房",
  lishixianxy3: "中寨乡小院村·李世先一支·之龙之元房",
  lizongguiyjh: "城关镇三甲以结河·李宗贵一支",
  lizhilongbq: "板桥乡·李之龙一支",
  lifengfums: "城关镇木沙寨·李凤府一支",
  litianrunsl: "中寨乡石龙村·李士才一支·天润房",
  lijianchenht: "中寨乡荒田村·李建臣一支",
  lijianchenht2: "中寨乡荒田村·李建臣一支·宗涛宗邦房",
  lijianchenht3: "中寨乡荒田村·李建臣一支·宗汗宗莲宗荣房",
  lishaolianht: "中寨乡核桃村·李绍连一支",
  lishaolianht2: "中寨乡石龙村·李如琛一支·天训房",
  liminglongcg2: "关镇后冲·李明龙一支·宗发房",
  lihongdengzw: "住乌·播谢·洪字辈一支（谱缺支题）",
  lihongdengzw2: "住乌·播谢·洪字辈一支·洪登洪海洪章房",
  litingcuilbs: "普定马官镇老扁山·李廷粹一支",
  lidengkuismz: "普定化处镇杉木寨·李登魁一支",
  lichaolongxz: "普定化处镇新寨村·李朝龙一支",
  lichaolongxz2: "新寨村·李朝龙一支·德厚德宽德仲德禄房",
  lichaolongxz3: "新寨村·李朝龙一支·德羲房",
  lichaolongxz4: "新寨村·李朝龙一支·大国大兴房",
  lichaolongxz5: "新寨村·李朝龙一支·第二十代未载父者",
  litingxiangsb: "普定化处镇沙包村·李廷相一支",
  lishiliantzs: "普定化处镇台子上·李士连一支",
  lishiliantzs2: "台子上·李士连一支·春贵房",
  lishiliantzs3: "台子上·李士连一支·春洪正芳房",
  litingfuxjl: "普定化处镇熊家林村·李廷富一支",
  lichonggaolly: "普定化处镇腊柳寨·李崇高一支",
  lichuntingyp: "普定马场镇云盘村·李春廷一支",
  litingcaizc: "普定马场镇猪场街上·李廷才一支",
  litingcaizc2: "猪场街上·李廷才一支·春福正发房",
  liweisp: "普定马场镇上坪寨村·李卫一支",
  liweisp2: "上坪寨·李卫一支·灿禄灿青灿景房",
  liweisp3: "上坪寨·李卫一支·国正房及灿章灿文",
  liweisp4: "上坪寨·李卫一支·廷滨廷志房",
  liweisp5: "上坪寨·李卫一支·未载父者",
  lizhengkunljc: "普定马场镇李家村·李正坤一支",
  lizhengkunljc2: "李家村·李正坤一支·德华德荣房",
  lichaoyangljc: "普定马场镇李家村·李朝阳一支",
  lichaoyangljc2: "李家村·李朝阳一支·正发正元房",
  liwenjubp: "普定马场镇半坡村·李文巨一支",
  liwenjubp2: "半坡村·李文巨一支·第十八代未载父者",
  liguangdoubp: "普定马场镇半坡村·李光斗一支",
  likunxiuzl: "普定龙场乡竹林村李家丫口·李坤秀分支",
  likunxiuzl2: "竹林村·李坤秀分支·应祥房",
  lizhiyuanxp: "普定马场镇下排村·李枝远一支",
  lizhiyuanxp2: "下排村·李枝远一支·进魁朝忠房",
  lizhiyuanxp3: "下排村·李枝远一支·春山房盛正发正",
  lizihongwz: "普定马场镇湾寨村·李子洪一支",
  lishirentb: "普定马场镇田坝村·李士仁一支",
  lishangchaowj: "普定马场镇田坝村汪家寨·李尚朝一支",
  lishengxunly: "普定坪上乡老鹰岩·李盛勋一支",
  lichunyunml: "普定坪上乡毛栗村·李春云一支",
  lishichaopp: "普定坪上乡坪坡村·李世朝一支",
  lishichaopp2: "坪坡村·李世朝一支·灿合灿明灿元房",
  lishichaopp3: "坪坡村·李世朝一支·灿德灿齐灿纯房",
  lishichaopp4: "坪坡村·李世朝一支·正发房",
  lishichaopp5: "坪坡村·李世朝一支·第十八代未载父者",
  lichengyibg: "普定坪上乡比古·李成议一支",
  liyinghuagl: "普定坪上乡果陇村·李应华支系",
  liyinghuagl2: "果陇村·李应华支系·子朝子公文玉君龙房",
  liyinghuagl3: "果陇村·李应华支系·应初君芝应与房",
  lizhichengmc: "普定猴场乡西北煤冲·李芝成一支",
  lizhichengmc2: "西北煤冲·李芝成一支·泽安房",
  lizhichengmc3: "西北煤冲·李芝成一支·未载父者",
  lizhichengmc4: "西北煤冲·李芝成一支·泽珍泽海房",
  lihuaxianlj: "普定猴场乡西北老甲寨·李华先一支",
  lijinlongpjw: "普定鸡场坡乡彭家湾村·李进龙一支",
  lijinlongpjw2: "彭家湾村·李进龙一支·灿发房",
  lishimeinh: "普定鸡场坡乡纳黑村·李时美一支",
  lishimeinh2: "纳黑村·李时美一支·银成房",
  liyuanxiangnyz: "普定鸡场坡乡纳雍支·李元相一支",
  liyuanxiangnyz2: "纳雍支·李元相一支·德贵房",
  liyuanxiangnyz3: "纳雍支·李元相一支·德祥房",
  liyoubinnz: "普定鸡场坡乡纳支村·李有宾一支",
  liyoubinnz2: "纳支村·李有宾一支·光臣时洪房",
  liyoubinnz3: "纳支村·李有宾一支·时桂时友时先房",
  liyoubinnz4: "纳支村·李有宾一支·文发房光荣光华光富",
  liyoubinnz5: "纳支村·李有宾一支·光明光龙房",
  liyoubinnz6: "纳支村·李有宾一支·时洪汉雄房",
  liyoubinnz7: "纳支村·李有宾一支·友纯春馥房",
  liyoubinnz8: "纳支村·李有宾一支·友桐房",
  lidingcaiyzy: "普定鸡场坡乡燕子岩·李永相一支·定才房",
  lideqingyp: "普定鸡场乡白桥村云盘·李德清一支",
  liyouchunnr: "普定鸡场坡乡那芮村·李有纯一支",
  liyouchunnr2: "那芮村·李有纯一支·未载父者",
  likuizhengdb: "普定鸡场坡乡新寨地坝·李魁政一支",
  liyanhoubd: "普定鸡场坡乡波大村·李颜候一支",
  liyanhoubd2: "波大村·李颜候一支·崇高房",
  liyanhoubd3: "波大村·李颜候一支·未载父者",
  lichunguibd: "普定鸡场坡乡波大村·李春贵一支",
  lichunzhongmd: "普定鸡场坡乡煤硐村·李春忠一支",
  lichunzhongmd2: "煤硐村·李春忠一支·吉安少舟房",
  lichaofuxj: "普定鸡场坡乡肖家村·李朝富一支",
  liruxiudp: "普定猫洞乡大坡上·李如秀一支",
  liruxiudp2: "大坡上·李如秀一支·德先德福德昌房",
  lihongkaimd: "普定龙场乡骂渡村·李洪开一支",
  liyonganmr: "普定鸡场坡乡骂若村·李永安一支",
  liguangcansy: "普定鸡场乡砂岩村·李光灿一支",
  lishiwannz: "普定鸡场坡乡纳雍支长田·李世万一支·毓房",
  lilianghaojs: "普定鸡场乡街上村·李良灏一支",
  lilianghaojs2: "街上村·李良灏一支·良用良英房",
  lilianghaojs3: "街上村·李良灏一支·良洪良贵良富房",
  lishaohuajs: "街上村·李良灏一支·绍华房",
  lishiyuantbt: "普定鸡场乡土坝头·李世元一支",
  liwenkaotbt: "土坝头·李世元一支·文考房",
  litianxiangsy: "普定鸡场坡乡砂岩村·李世元一支·天香房",
  lishizhaobq: "普定鸡场坡乡白桥村·李世召一支",
  lishijunzjz: "普定鸡场乡赵家寨·李世俊一支",
  lishiqingnh: "普定鸡场坡乡纳黑村·李世清一支",
  lishiqingnh2: "纳黑村·李世清一支·崇元房",
  lishiqingnh3: "纳黑村·李世清一支·灿兴房",
  limeiqinggm: "普定鸡场乡果骂村·李美卿一支",
  liyupeigm: "普定鸡场坡乡果骂村·李玉配一支",
  litianfugm: "果骂村·李玉配一支·天富房",
  liqiyuanxz: "普定鸡场坡乡新寨村·李世元一支·起元房",
  lishichenglj: "普定鸡场坡乡长坡村李家寨·李士成一支",
  lishichenglj2: "李家寨·李士成一支·灿文房",
  lishichenglj3: "李家寨·李士成一支·灿廷房",
  lishichenglj4: "李家寨·李士成一支·灿高房",
  lishichenglj5: "李家寨·李士成一支·灿彪房",
  lishichenglj6: "李家寨·李士成一支·灿洪灿魁房",
  lishichenglj7: "李家寨·李士成一支·万明房",
  lichengzhilmt: "普定鸡场坡乡芦茅塘·李成枝一支·正坤正祥房",
  lichengzhilmt2: "芦茅塘·李成枝一支·有山房",
  lichengzhilmt3: "芦茅塘·李成枝一支·再明房",
  lizhengfamr: "普定鸡场坡乡骂若村·李正法一支",
  lizonghebq: "普定鸡场坡乡白桥村·李宗和一支",
  lidemingnh: "普定鸡场坡乡纳黑村·李德明一支",
  lilaobajb: "普定鸡场坡乡播简村·李老八一支（杨姓抱养）",
  lizongyuanhz: "普定鸡场乡后寨村·李宗元一支",
  liwenpeiytt: "普定鸡场乡播简村岩头上·李文配一支",
  liwenpeiytt2: "岩头上·李文配一支·德祥房",
  liwenpeiytt3: "岩头上·李文配一支·宗寿房及德芳房",
  lishichenxb: "普定猴场乡西北煤冲·李世臣一支",
  lishichenxb2: "西北煤冲·李世臣一支·隆云房",
  lishichenxb3: "西北煤冲·李世臣一支·隆成隆坤房",
  lishichenxb4: "西北煤冲·李世臣一支·隆象隆帮房",
  lichongxixb: "普定补郎乡小牛场田坝·李崇喜一支",
  lidejinzb: "普定补郎乡西北中坝·李德金一支",
  lijuncailz: "普定补郎乡西北漏寨·李君才一支",
  lishiyingdlx: "普定补郎乡西北大来项·李世应一支",
  lishiyingdlx2: "大来项·李世应一支·德清房",
  lichongdezb: "普定猴场乡西北中坝·李崇德一支",
  lidejiutb: "普定补郎西北田坝·李德玖一支",
  lizongrenbb: "普定猴场乡西北磅坝·李宗仁一支",
  lijunyoudyc: "普定猴场乡跌牙冲·李君有一支",
  lijunyoudyc2: "跌牙冲·李君有一支·隆应房",
  lishizhengsj: "普定猴场乡补郎石阶村·李世政一支·仕尧房",
  lizongxiangxgz: "普定补郎小革枝·李宗祥一支",
  lizongkuixgz: "普定补郎小革枝·李宗奎一支",
  lizhengjusld: "普定猴场乡西北田坝·李正举一支·宗美房",
  lirukunsj: "普定补郎石阶路·李如坤一支",
  liyongxihjz: "普定补郎何家寨·李永锡一支",
  lizongfaxgz: "普定补郎石街村小格枝·李宗发一支",
  lizongbaoqgj: "普定石阶路青杠脚·李进忠一支·宗宝支",
  lizongbaoqgj2: "青杠脚·宗宝支·德发房",
  lizongbaoqgj3: "青杠脚·宗宝支·德兴房",
  lizongbaoqgj4: "青杠脚·宗宝支·未载父者",
  liyongkuimg: "普定补郎猛戛村·李世政一支·永奎房",
  liyongkuimg2: "猛戛村·永奎房·德科德甲房",
  liyongkuimg3: "猛戛村·永奎房·宗雨房",
  liyongkuimg4: "猛戛村·永奎房·德华德明房",
  lizongguisz: "普定补郎乡上寨村·李宗贵一支",
  lidefunby: "普定坪上乡哪叭岩·李德福一支",
  lishijieml: "普定坪上乡毛栗村·李世杰一支·大明士龙房",
  lishijieml2: "毛栗村·大明士龙房·崇学诸子",
  lipengchenaj: "普定坪上乡安架·李鹏臣一支·万凤房",
  lidequansg: "普定坪上乡砂锅村·李德全一支",
  lishiyuanjs: "普定坪上乡街上·李世元一支·如楷房",
  lichaokaitb: "普定马场镇田坝村·李朝开一支",
  lizifengtj: "普定马场镇梅子关屯脚寨·李子奉一支",
  lizifengtj2: "屯脚寨·李子奉一支·崇林以下",
  lishaowumc: "普定马场镇街上·李绍武一支",
  lizonghannq: "普定马场镇那穷村·李宗汉一支",
  lishiwandf: "普定马场镇大坟村·李世万一支·成奇房",
  lishiwenzc: "普定马场镇猪场街上·李世文一支",
  lishijiezp: "普定马场镇中排村·李士杰一支",
  licanchunzp: "普定马场镇中排寨·李灿春一支",
  lirimingwz: "普定马场镇湾寨村·李日明一支",
  lichaomeiltk: "普定马场镇龙潭口村·李朝美一支",
  liyuchush: "普定马场镇三合村·李玉楚一支",
  lihongshunyj: "普定化处镇袁家寨·李洪顺一支",
  lichaozuodb: "普定化处镇朵贝村·李朝佐一支",
  lichaozuodb2: "朵贝村·李朝佐一支·烂房春杨春发",
  lichaozuodb3: "朵贝村·李朝佐一支·琏房及春浓",
  lichaozuodb4: "朵贝村·李朝佐一支·春馨春芳房",
  lichaozuodb5: "朵贝村·李朝佐一支·春奎房",
  lichaozuodb6: "朵贝村·李朝佐一支·春舒春松房",
  lichaozuodb7: "朵贝村·李朝佐一支·如沙房",
  lishiyuants: "普定化处镇屯上·李世元一支·士雄房",
  lichuncaisb: "普定化处镇沙包村·李春才一支",
  lichuncaisb2: "沙包村·李春才一支·德祯房",
  lishiyuanbyj: "普定马官镇湾河白岩脚·李世元一支·如穗房",
  lishiyuanbyj2: "白岩脚·如穗房·宗胜宗富房",
  lishiyuanbyj3: "白岩脚·如穗房·宗元宗祥房",
  lishiyuanbyj4: "白岩脚·如穗房·宗堂房",
  lishiyuanbyj5: "白岩脚·如穗房·崇高房",
  lishiyuanbyj6: "白岩脚·如穗房·宗富德胜房",
  lishiyuanbyj7: "白岩脚·如穗房·未载父者",
  lishiyuanbyj8: "白岩脚·如穗房·宗应崇富房及崇文房",
  lichongshoucg: "普定城关南门·李崇寿一支",
  lidemingtwq: "普定城关天王旗村·李德明一支",
  liqingyunsc: "普定城关镇市场路·李清云一支",
  lichengxuefe: "黔西县中坪镇飞鹅村·李成学一支",
  lichengxuefe2: "飞鹅村·李成学一支·廷宣房",
  lichengxuefe3: "飞鹅村·李成学一支·应具应绿房",
  liyingkuigd: "赫章县古达乡·李应魁一支",
  liyingkuigd2: "古达乡·李应魁一支·升屏升发升堂房",
  liyingkuigd3: "古达乡·李应魁一支·志金房",
  liyingkuigd4: "古达乡·李应魁一支·志忠志全房",
  liyingkuigd5: "古达乡·李应魁一支·志成房",
  liyingkuigd6: "古达乡·李应魁一支·志良房",
  lichengkehz: "赫章县·李成科一支",
  lichengkehz2: "赫章·李成科一支·永芳永亮",
  lichengkehz3: "赫章·李成科一支·自明自友房",
  liguodongzx: "金盆乡则雄·李国栋一支",
  liguodongzx2: "则雄·李国栋一支·辉武房",
  liguodongzx3: "则雄·李国栋一支·辉玉房",
  liguodongzx4: "则雄·李国栋一支·辉相房",
  liguodongzx5: "则雄·李国栋一支·忠彩房",
  liguodongzx6: "则雄·李国栋一支·琼成房",
  liguodongzx7: "则雄·李国栋一支·琼玖房",
  liguodongzx8: "则雄·李国栋一支·辉福房",
  liguodongzx9: "则雄·李国栋一支·辉秀辉贤房",
  liguodongzx10: "则雄·李国栋一支·辉祥房",
  liguodongzx11: "则雄·李国栋一支·建彩房",
  lixiantingdf: "大方县核桃乡·李先廷一支",
  lixiantingdf2: "李先廷一支·宗培房",
  lixiantingdf3: "李先廷一支·天良房",
  lixiantingdf4: "李先廷一支·天申房",
  lixiantingdf5: "李先廷一支·天富天香房",
  lixiantingdf6: "李先廷一支·天元天才房",
  lixiantingdf7: "李先廷一支·天文房",
  lixiantingdf8: "李先廷一支·宗恩",
  lixiantingdf9: "李先廷一支·志仁房",
  lixiantingdf10: "李先廷一支·志能志元房",
  lixiantingdf11: "李先廷一支·云祥云朝云贵房",
  lixiantingdf12: "李先廷一支·洪选房",
  lizhengkainj: "大方县牛集乡高朝村·李正开一支",
  lirunmeijs: "金沙县安洛乡·李润妹一支",
  liruqingwn: "威宁县何落冲·李如清一支",
  lizongwu: "李氏·李宗武一支（李代龙支系谱·自强乡自强张寨脚村·十七至二十二代）",
  lihongshun: "李氏·李洪顺一支（李代龙支系谱·纳雍乡鼠场三苍土·十五至二十代）",
  lihonglian: "李氏·李洪连一支（李代龙支系谱·纳雍乡千二系·十八至二十一代）",
  liziquan: "李氏·李自全一支（李代龙支系谱·纳雍乡八耳岩脚·十七至二十代）",
  qxjy_a01: "清徐集义李氏·一股·李大志之后（十世前世系，第8-11世）",
  qxjy_a02: "清徐集义李氏·一股·李谭之后（十世前世系，第4-11世）",
  qxjy_a03: "清徐集义李氏·二股·李大本之后（十世前世系，第8-11世）",
  qxjy_a04: "清徐集义李氏·二股·李文简之后（十世前世系，第5-11世）",
  qxjy_a05: "清徐集义李氏·二股·李重山之后（十世前世系，第9-11世）",
  qxjy_a06: "清徐集义李氏·二股·李大长之后（十世前世系，第8-11世）",
  qxjy_a07: "清徐集义李氏·二股·李明春之后（十世前世系，第9-11世）",
  qxjy_a08: "清徐集义李氏·二股·李坚之后（十世前世系，第6-11世）",
  qxjy_a09: "清徐集义李氏·二股·李坚之后（十世前世系，第6-11世）",
  qxjy_a10: "清徐集义李氏·三股·李可久之后（十世前世系，第10-11世）",
  qxjy_a11: "清徐集义李氏·三股·李萌春之后（十世前世系，第9-11世）",
  qxjy_a12: "清徐集义李氏·三股·李荫春之后（十世前世系，第9-11世）",
  qxjy_a13: "清徐集义李氏·三股·李大用之后（十世前世系，第8-11世）",
  qxjy_a14: "清徐集义李氏·三股·李鸾之后（十世前世系，第7-11世）",
  qxjy_a15: "清徐集义李氏·三股·李鸾之后（十世前世系，第7-11世）",
  qxjy_a16: "清徐集义李氏·三股·李同春之后（十世前世系，第9-11世）",
  qxjy_a17: "清徐集义李氏·三股·李凤之后（十世前世系，第7-11世）",
  qxjy_a18: "清徐集义李氏·三股·李凤之后（十世前世系，第7-11世）",
  qxjy_a19: "清徐集义李氏·三股·李茂之后（十世前世系，第6-11世）",
  qxjy_a20: "清徐集义李氏·三股·李端之后（十世前世系，第6-11世）",
  qxjy_a21: "清徐集义李氏·三股·李文合之后（十世前世系，第5-11世）",
  qxjy_a22: "清徐集义李氏·三股·李大质之后（十世前世系，第8-11世）",
  qxjy_a23: "清徐集义李氏·三股·李安之后（十世前世系，第6-11世）",
  qxjy_a24: "清徐集义李氏·三股·李智春之后（十世前世系，第9-11世）",
  qxjy_a25: "清徐集义李氏·三股·李文义之后（十世前世系，第5-11世）",
  qxjy_a26: "清徐集义李氏·三股·李表之后（十世前世系，第4-11世）",
  qxjy_a27: "清徐集义李氏·四股·李大恩之后（十世前世系，第8-11世）",
  qxjy_a28: "清徐集义李氏·四股·李奇之后（十世前世系，第7-11世）",
  qxjy_a29: "清徐集义李氏·四股·李大纲之后（十世前世系，第8-11世）",
  qxjy_a30: "清徐集义李氏·四股·李节之后（十世前世系，第4-11世）",
  qxjy_a31: "清徐集义李氏·五股·李大永之后（十世前世系，第8-11世）",
  qxjy_a32: "清徐集义李氏·五股·李大永之后（十世前世系，第8-11世）",
  qxjy_a33: "清徐集义李氏·五股·李世忠之后（十世前世系，第3-11世）",
  qxjy_a34: "清徐集义李氏·二股·李世忠之后（十世前世系，第3-11世）",
  qxjy_a35: "清徐集义李氏·一股·李世忠之后（十世前世系，第3-10世）",
  qxjy_a36: "清徐集义李氏·李仁甫（十世前世系，第1-11世）",
  qxjy_b01: "清徐集义李氏·一股·李善德之后（十一世后一股，第16-21世）",
  qxjy_b02: "清徐集义李氏·一股·李花现、李花粹之后（十一世后一股，第12-17世）",
  qxjy_b03: "清徐集义李氏·一股·李永善、李国宝之后（十一世后一股，第12-14世）",
  qxjy_c01: "清徐集义李氏·二股·李浩之后（十一世后二股，第13-18世）",
  qxjy_c02: "清徐集义李氏·二股·李成麒之后（十一世后二股，第13-18世）",
  qxjy_c03: "清徐集义李氏·二股·李成麒之后（十一世后二股，第13-18世）",
  qxjy_c04: "清徐集义李氏·二股·李玉昌之后（十一世后二股，第14-18世）",
  qxjy_c05: "清徐集义李氏·二股·李登明之后（十一世后二股，第12-18世）",
  qxjy_c06: "清徐集义李氏·二股·李登明之后（十一世后二股，第12-18世）",
  qxjy_c07: "清徐集义李氏·二股·李沁星之后（十一世后二股，第18-21世）",
  qxjy_c08: "清徐集义李氏·二股·李凤清之后（十一世后二股，第16-21世）",
  qxjy_c09: "清徐集义李氏·二股·李河之后（十一世后二股，第13-17世）",
  qxjy_c10: "清徐集义李氏·二股·李泉之后（十一世后二股，第13-18世）",
  qxjy_c11: "清徐集义李氏·二股·李登府之后（十一世后二股，第12-16世）",
  qxjy_c12: "清徐集义李氏·二股·李登府之后（十一世后二股，第12-16世）",
  qxjy_c13: "清徐集义李氏·二股·李滚之后（十一世后二股，第13-18世）",
  qxjy_c14: "清徐集义李氏·二股·李自林之后（十一世后二股，第14-18世）",
  qxjy_c15: "清徐集义李氏·二股·李应成之后（十一世后二股，第12-18世）",
  qxjy_c16: "清徐集义李氏·二股·李自清之后（十一世后二股，第14-22世）",
  qxjy_c17: "清徐集义李氏·二股·李现才之后（十一世后二股，第12-18世）",
  qxjy_c18: "清徐集义李氏·二股·李克敬之后（十一世后二股，第16-22世）",
  qxjy_c19: "清徐集义李氏·二股·李存孝之后（十一世后二股，第14-18世）",
  qxjy_c20: "清徐集义李氏·二股·李顶之后（十一世后二股，第13-22世）",
  qxjy_c21: "清徐集义李氏·二股·李向荣之后（十一世后二股，第15-22世）",
  qxjy_c22: "清徐集义李氏·二股·李存义之后（十一世后二股，第14-18世）",
  qxjy_c23: "清徐集义李氏·二股·李普之后（十一世后二股，第13-18世）",
  qxjy_c24: "清徐集义李氏·二股·李普之后（十一世后二股，第13-18世）",
  qxjy_c25: "清徐集义李氏·二股·李生辉之后（十一世后二股，第12-18世）",
  qxjy_c26: "清徐集义李氏·二股·李士英之后（十一世后二股，第14-21世）",
  qxjy_c27: "清徐集义李氏·二股·李松鳞之后（十一世后二股，第15-20世）",
  qxjy_c28: "清徐集义李氏·二股·李生贵之后（十一世后二股，第12-16世）",
  qxjy_c29: "清徐集义李氏·二股·李士桂之后（十一世后二股，第14-20世）",
  qxjy_c30: "清徐集义李氏·二股·李生广之后（十一世后二股，第12-17世）",
  qxjy_c31: "清徐集义李氏·二股·李翠秀之后（十一世后二股，第12-17世）",
  qxjy_c32: "清徐集义李氏·二股·李法明、李成才之后（十一世后二股，第12-17世）",
  qxjy_c33: "清徐集义李氏·二股·李生璋、李法棠之后（十一世后二股，第12-17世）",
  qxjy_c34: "清徐集义李氏·二股·李法元、李秉成之后（十一世后二股，第12-17世）",
  qxjy_c35: "清徐集义李氏·二股·李生广、李登旺之后（十一世后二股，第12-17世）",
  qxjy_c36: "清徐集义李氏·二股·李奇才、李法官之后（十一世后二股，第12-16世）",
  qxjy_c37: "清徐集义李氏·二股·李联秀、李生琳之后（十一世后二股，第12-16世）",
  qxjy_c38: "清徐集义李氏·二股·李登府、李登明之后（十一世后二股，第12-16世）",
  qxjy_c39: "清徐集义李氏·二股·李生辉、李登贵、李法全之后（十一世后二股，第12-18世）",
  qxjy_c40: "清徐集义李氏·二股·李生贵、李法武之后（十一世后二股，第12-17世）",
  qxjy_c41: "清徐集义李氏·二股·李现才、李生锦、李应成之后（十一世后二股，第12-15世）",
  qxjy_c42: "清徐集义李氏·二股·李登相、李秉贵、李登成等之后（十一世后二股，第12-14世）",
  qxjy_c43: "清徐集义李氏·二股·李登州、李良才、李生粹等之后（十一世后二股，第12-12世）",
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
  ["liruyue", lipu_liruyue as GenealogyDataset],
  ["liruyue2", lipu_liruyue2 as GenealogyDataset],
  ["liruguan", lipu_liruguan as GenealogyDataset],
  ["lishaoyongwx", lipu_lishaoyongwx as GenealogyDataset],
  ["lijunzhenghg", lipu_lijunzhenghg as GenealogyDataset],
  ["lijunzhenghg2", lipu_lijunzhenghg2 as GenealogyDataset],
  ["lizongyuexjz", lipu_lizongyuexjz as GenealogyDataset],
  ["lishichengal", lipu_lishichengal as GenealogyDataset],
  ["lishifangert", lipu_lishifangert as GenealogyDataset],
  ["lidemingek", lipu_lidemingek as GenealogyDataset],
  ["lideanek", lipu_lideanek as GenealogyDataset],
  ["lidekaiek", lipu_lidekaiek as GenealogyDataset],
  ["lidekuiek", lipu_lidekuiek as GenealogyDataset],
  ["lichongyiek", lipu_lichongyiek as GenealogyDataset],
  ["lishaoenmf", lipu_lishaoenmf as GenealogyDataset],
  ["lishaoenmf2", lipu_lishaoenmf2 as GenealogyDataset],
  ["lishiwanhl", lipu_lishiwanhl as GenealogyDataset],
  ["lishiwanhl2", lipu_lishiwanhl2 as GenealogyDataset],
  ["lishiwanhl3", lipu_lishiwanhl3 as GenealogyDataset],
  ["liminglongcg", lipu_liminglongcg as GenealogyDataset],
  ["lishikui", lipu_lishikui as GenealogyDataset],
  ["lishikui2", lipu_lishikui2 as GenealogyDataset],
  ["lishikui3", lipu_lishikui3 as GenealogyDataset],
  ["lishiyuanyl", lipu_lishiyuanyl as GenealogyDataset],
  ["lichongmingcg", lipu_lichongmingcg as GenealogyDataset],
  ["lishifangxjc", lipu_lishifangxjc as GenealogyDataset],
  ["lideronghsc", lipu_lideronghsc as GenealogyDataset],
  ["lishixianxy", lipu_lishixianxy as GenealogyDataset],
  ["lishixianxy2", lipu_lishixianxy2 as GenealogyDataset],
  ["lishixianxy3", lipu_lishixianxy3 as GenealogyDataset],
  ["lizongguiyjh", lipu_lizongguiyjh as GenealogyDataset],
  ["lizhilongbq", lipu_lizhilongbq as GenealogyDataset],
  ["lifengfums", lipu_lifengfums as GenealogyDataset],
  ["litianrunsl", lipu_litianrunsl as GenealogyDataset],
  ["lijianchenht", lipu_lijianchenht as GenealogyDataset],
  ["lijianchenht2", lipu_lijianchenht2 as GenealogyDataset],
  ["lijianchenht3", lipu_lijianchenht3 as GenealogyDataset],
  ["lishaolianht", lipu_lishaolianht as GenealogyDataset],
  ["lishaolianht2", lipu_lishaolianht2 as GenealogyDataset],
  ["liminglongcg2", lipu_liminglongcg2 as GenealogyDataset],
  ["lihongdengzw", lipu_lihongdengzw as GenealogyDataset],
  ["lihongdengzw2", lipu_lihongdengzw2 as GenealogyDataset],
  ["litingcuilbs", lipu_litingcuilbs as GenealogyDataset],
  ["lidengkuismz", lipu_lidengkuismz as GenealogyDataset],
  ["lichaolongxz", lipu_lichaolongxz as GenealogyDataset],
  ["lichaolongxz2", lipu_lichaolongxz2 as GenealogyDataset],
  ["lichaolongxz3", lipu_lichaolongxz3 as GenealogyDataset],
  ["lichaolongxz4", lipu_lichaolongxz4 as GenealogyDataset],
  ["lichaolongxz5", lipu_lichaolongxz5 as GenealogyDataset],
  ["litingxiangsb", lipu_litingxiangsb as GenealogyDataset],
  ["lishiliantzs", lipu_lishiliantzs as GenealogyDataset],
  ["lishiliantzs2", lipu_lishiliantzs2 as GenealogyDataset],
  ["lishiliantzs3", lipu_lishiliantzs3 as GenealogyDataset],
  ["litingfuxjl", lipu_litingfuxjl as GenealogyDataset],
  ["lichonggaolly", lipu_lichonggaolly as GenealogyDataset],
  ["lichuntingyp", lipu_lichuntingyp as GenealogyDataset],
  ["litingcaizc", lipu_litingcaizc as GenealogyDataset],
  ["litingcaizc2", lipu_litingcaizc2 as GenealogyDataset],
  ["liweisp", lipu_liweisp as GenealogyDataset],
  ["liweisp2", lipu_liweisp2 as GenealogyDataset],
  ["liweisp3", lipu_liweisp3 as GenealogyDataset],
  ["liweisp4", lipu_liweisp4 as GenealogyDataset],
  ["liweisp5", lipu_liweisp5 as GenealogyDataset],
  ["lizhengkunljc", lipu_lizhengkunljc as GenealogyDataset],
  ["lizhengkunljc2", lipu_lizhengkunljc2 as GenealogyDataset],
  ["lichaoyangljc", lipu_lichaoyangljc as GenealogyDataset],
  ["lichaoyangljc2", lipu_lichaoyangljc2 as GenealogyDataset],
  ["liwenjubp", lipu_liwenjubp as GenealogyDataset],
  ["liwenjubp2", lipu_liwenjubp2 as GenealogyDataset],
  ["liguangdoubp", lipu_liguangdoubp as GenealogyDataset],
  ["likunxiuzl", lipu_likunxiuzl as GenealogyDataset],
  ["likunxiuzl2", lipu_likunxiuzl2 as GenealogyDataset],
  ["lizhiyuanxp", lipu_lizhiyuanxp as GenealogyDataset],
  ["lizhiyuanxp2", lipu_lizhiyuanxp2 as GenealogyDataset],
  ["lizhiyuanxp3", lipu_lizhiyuanxp3 as GenealogyDataset],
  ["lizihongwz", lipu_lizihongwz as GenealogyDataset],
  ["lishirentb", lipu_lishirentb as GenealogyDataset],
  ["lishangchaowj", lipu_lishangchaowj as GenealogyDataset],
  ["lishengxunly", lipu_lishengxunly as GenealogyDataset],
  ["lichunyunml", lipu_lichunyunml as GenealogyDataset],
  ["lishichaopp", lipu_lishichaopp as GenealogyDataset],
  ["lishichaopp2", lipu_lishichaopp2 as GenealogyDataset],
  ["lishichaopp3", lipu_lishichaopp3 as GenealogyDataset],
  ["lishichaopp4", lipu_lishichaopp4 as GenealogyDataset],
  ["lishichaopp5", lipu_lishichaopp5 as GenealogyDataset],
  ["lichengyibg", lipu_lichengyibg as GenealogyDataset],
  ["liyinghuagl", lipu_liyinghuagl as GenealogyDataset],
  ["liyinghuagl2", lipu_liyinghuagl2 as GenealogyDataset],
  ["liyinghuagl3", lipu_liyinghuagl3 as GenealogyDataset],
  ["lizhichengmc", lipu_lizhichengmc as GenealogyDataset],
  ["lizhichengmc2", lipu_lizhichengmc2 as GenealogyDataset],
  ["lizhichengmc3", lipu_lizhichengmc3 as GenealogyDataset],
  ["lizhichengmc4", lipu_lizhichengmc4 as GenealogyDataset],
  ["lihuaxianlj", lipu_lihuaxianlj as GenealogyDataset],
  ["lijinlongpjw", lipu_lijinlongpjw as GenealogyDataset],
  ["lijinlongpjw2", lipu_lijinlongpjw2 as GenealogyDataset],
  ["lishimeinh", lipu_lishimeinh as GenealogyDataset],
  ["lishimeinh2", lipu_lishimeinh2 as GenealogyDataset],
  ["liyuanxiangnyz", lipu_liyuanxiangnyz as GenealogyDataset],
  ["liyuanxiangnyz2", lipu_liyuanxiangnyz2 as GenealogyDataset],
  ["liyuanxiangnyz3", lipu_liyuanxiangnyz3 as GenealogyDataset],
  ["liyoubinnz", lipu_liyoubinnz as GenealogyDataset],
  ["liyoubinnz2", lipu_liyoubinnz2 as GenealogyDataset],
  ["liyoubinnz3", lipu_liyoubinnz3 as GenealogyDataset],
  ["liyoubinnz4", lipu_liyoubinnz4 as GenealogyDataset],
  ["liyoubinnz5", lipu_liyoubinnz5 as GenealogyDataset],
  ["liyoubinnz6", lipu_liyoubinnz6 as GenealogyDataset],
  ["liyoubinnz7", lipu_liyoubinnz7 as GenealogyDataset],
  ["liyoubinnz8", lipu_liyoubinnz8 as GenealogyDataset],
  ["lidingcaiyzy", lipu_lidingcaiyzy as GenealogyDataset],
  ["lideqingyp", lipu_lideqingyp as GenealogyDataset],
  ["liyouchunnr", lipu_liyouchunnr as GenealogyDataset],
  ["liyouchunnr2", lipu_liyouchunnr2 as GenealogyDataset],
  ["likuizhengdb", lipu_likuizhengdb as GenealogyDataset],
  ["liyanhoubd", lipu_liyanhoubd as GenealogyDataset],
  ["liyanhoubd2", lipu_liyanhoubd2 as GenealogyDataset],
  ["liyanhoubd3", lipu_liyanhoubd3 as GenealogyDataset],
  ["lichunguibd", lipu_lichunguibd as GenealogyDataset],
  ["lichunzhongmd", lipu_lichunzhongmd as GenealogyDataset],
  ["lichunzhongmd2", lipu_lichunzhongmd2 as GenealogyDataset],
  ["lichaofuxj", lipu_lichaofuxj as GenealogyDataset],
  ["liruxiudp", lipu_liruxiudp as GenealogyDataset],
  ["liruxiudp2", lipu_liruxiudp2 as GenealogyDataset],
  ["lihongkaimd", lipu_lihongkaimd as GenealogyDataset],
  ["liyonganmr", lipu_liyonganmr as GenealogyDataset],
  ["liguangcansy", lipu_liguangcansy as GenealogyDataset],
  ["lishiwannz", lipu_lishiwannz as GenealogyDataset],
  ["lilianghaojs", lipu_lilianghaojs as GenealogyDataset],
  ["lilianghaojs2", lipu_lilianghaojs2 as GenealogyDataset],
  ["lilianghaojs3", lipu_lilianghaojs3 as GenealogyDataset],
  ["lishaohuajs", lipu_lishaohuajs as GenealogyDataset],
  ["lishiyuantbt", lipu_lishiyuantbt as GenealogyDataset],
  ["liwenkaotbt", lipu_liwenkaotbt as GenealogyDataset],
  ["litianxiangsy", lipu_litianxiangsy as GenealogyDataset],
  ["lishizhaobq", lipu_lishizhaobq as GenealogyDataset],
  ["lishijunzjz", lipu_lishijunzjz as GenealogyDataset],
  ["lishiqingnh", lipu_lishiqingnh as GenealogyDataset],
  ["lishiqingnh2", lipu_lishiqingnh2 as GenealogyDataset],
  ["lishiqingnh3", lipu_lishiqingnh3 as GenealogyDataset],
  ["limeiqinggm", lipu_limeiqinggm as GenealogyDataset],
  ["liyupeigm", lipu_liyupeigm as GenealogyDataset],
  ["litianfugm", lipu_litianfugm as GenealogyDataset],
  ["liqiyuanxz", lipu_liqiyuanxz as GenealogyDataset],
  ["lishichenglj", lipu_lishichenglj as GenealogyDataset],
  ["lishichenglj2", lipu_lishichenglj2 as GenealogyDataset],
  ["lishichenglj3", lipu_lishichenglj3 as GenealogyDataset],
  ["lishichenglj4", lipu_lishichenglj4 as GenealogyDataset],
  ["lishichenglj5", lipu_lishichenglj5 as GenealogyDataset],
  ["lishichenglj6", lipu_lishichenglj6 as GenealogyDataset],
  ["lishichenglj7", lipu_lishichenglj7 as GenealogyDataset],
  ["lichengzhilmt", lipu_lichengzhilmt as GenealogyDataset],
  ["lichengzhilmt2", lipu_lichengzhilmt2 as GenealogyDataset],
  ["lichengzhilmt3", lipu_lichengzhilmt3 as GenealogyDataset],
  ["lizhengfamr", lipu_lizhengfamr as GenealogyDataset],
  ["lizonghebq", lipu_lizonghebq as GenealogyDataset],
  ["lidemingnh", lipu_lidemingnh as GenealogyDataset],
  ["lilaobajb", lipu_lilaobajb as GenealogyDataset],
  ["lizongyuanhz", lipu_lizongyuanhz as GenealogyDataset],
  ["liwenpeiytt", lipu_liwenpeiytt as GenealogyDataset],
  ["liwenpeiytt2", lipu_liwenpeiytt2 as GenealogyDataset],
  ["liwenpeiytt3", lipu_liwenpeiytt3 as GenealogyDataset],
  ["lishichenxb", lipu_lishichenxb as GenealogyDataset],
  ["lishichenxb2", lipu_lishichenxb2 as GenealogyDataset],
  ["lishichenxb3", lipu_lishichenxb3 as GenealogyDataset],
  ["lishichenxb4", lipu_lishichenxb4 as GenealogyDataset],
  ["lichongxixb", lipu_lichongxixb as GenealogyDataset],
  ["lidejinzb", lipu_lidejinzb as GenealogyDataset],
  ["lijuncailz", lipu_lijuncailz as GenealogyDataset],
  ["lishiyingdlx", lipu_lishiyingdlx as GenealogyDataset],
  ["lishiyingdlx2", lipu_lishiyingdlx2 as GenealogyDataset],
  ["lichongdezb", lipu_lichongdezb as GenealogyDataset],
  ["lidejiutb", lipu_lidejiutb as GenealogyDataset],
  ["lizongrenbb", lipu_lizongrenbb as GenealogyDataset],
  ["lijunyoudyc", lipu_lijunyoudyc as GenealogyDataset],
  ["lijunyoudyc2", lipu_lijunyoudyc2 as GenealogyDataset],
  ["lishizhengsj", lipu_lishizhengsj as GenealogyDataset],
  ["lizongxiangxgz", lipu_lizongxiangxgz as GenealogyDataset],
  ["lizongkuixgz", lipu_lizongkuixgz as GenealogyDataset],
  ["lizhengjusld", lipu_lizhengjusld as GenealogyDataset],
  ["lirukunsj", lipu_lirukunsj as GenealogyDataset],
  ["liyongxihjz", lipu_liyongxihjz as GenealogyDataset],
  ["lizongfaxgz", lipu_lizongfaxgz as GenealogyDataset],
  ["lizongbaoqgj", lipu_lizongbaoqgj as GenealogyDataset],
  ["lizongbaoqgj2", lipu_lizongbaoqgj2 as GenealogyDataset],
  ["lizongbaoqgj3", lipu_lizongbaoqgj3 as GenealogyDataset],
  ["lizongbaoqgj4", lipu_lizongbaoqgj4 as GenealogyDataset],
  ["liyongkuimg", lipu_liyongkuimg as GenealogyDataset],
  ["liyongkuimg2", lipu_liyongkuimg2 as GenealogyDataset],
  ["liyongkuimg3", lipu_liyongkuimg3 as GenealogyDataset],
  ["liyongkuimg4", lipu_liyongkuimg4 as GenealogyDataset],
  ["lizongguisz", lipu_lizongguisz as GenealogyDataset],
  ["lidefunby", lipu_lidefunby as GenealogyDataset],
  ["lishijieml", lipu_lishijieml as GenealogyDataset],
  ["lishijieml2", lipu_lishijieml2 as GenealogyDataset],
  ["lipengchenaj", lipu_lipengchenaj as GenealogyDataset],
  ["lidequansg", lipu_lidequansg as GenealogyDataset],
  ["lishiyuanjs", lipu_lishiyuanjs as GenealogyDataset],
  ["lichaokaitb", lipu_lichaokaitb as GenealogyDataset],
  ["lizifengtj", lipu_lizifengtj as GenealogyDataset],
  ["lizifengtj2", lipu_lizifengtj2 as GenealogyDataset],
  ["lishaowumc", lipu_lishaowumc as GenealogyDataset],
  ["lizonghannq", lipu_lizonghannq as GenealogyDataset],
  ["lishiwandf", lipu_lishiwandf as GenealogyDataset],
  ["lishiwenzc", lipu_lishiwenzc as GenealogyDataset],
  ["lishijiezp", lipu_lishijiezp as GenealogyDataset],
  ["licanchunzp", lipu_licanchunzp as GenealogyDataset],
  ["lirimingwz", lipu_lirimingwz as GenealogyDataset],
  ["lichaomeiltk", lipu_lichaomeiltk as GenealogyDataset],
  ["liyuchush", lipu_liyuchush as GenealogyDataset],
  ["lihongshunyj", lipu_lihongshunyj as GenealogyDataset],
  ["lichaozuodb", lipu_lichaozuodb as GenealogyDataset],
  ["lichaozuodb2", lipu_lichaozuodb2 as GenealogyDataset],
  ["lichaozuodb3", lipu_lichaozuodb3 as GenealogyDataset],
  ["lichaozuodb4", lipu_lichaozuodb4 as GenealogyDataset],
  ["lichaozuodb5", lipu_lichaozuodb5 as GenealogyDataset],
  ["lichaozuodb6", lipu_lichaozuodb6 as GenealogyDataset],
  ["lichaozuodb7", lipu_lichaozuodb7 as GenealogyDataset],
  ["lishiyuants", lipu_lishiyuants as GenealogyDataset],
  ["lichuncaisb", lipu_lichuncaisb as GenealogyDataset],
  ["lichuncaisb2", lipu_lichuncaisb2 as GenealogyDataset],
  ["lishiyuanbyj", lipu_lishiyuanbyj as GenealogyDataset],
  ["lishiyuanbyj2", lipu_lishiyuanbyj2 as GenealogyDataset],
  ["lishiyuanbyj3", lipu_lishiyuanbyj3 as GenealogyDataset],
  ["lishiyuanbyj4", lipu_lishiyuanbyj4 as GenealogyDataset],
  ["lishiyuanbyj5", lipu_lishiyuanbyj5 as GenealogyDataset],
  ["lishiyuanbyj6", lipu_lishiyuanbyj6 as GenealogyDataset],
  ["lishiyuanbyj7", lipu_lishiyuanbyj7 as GenealogyDataset],
  ["lishiyuanbyj8", lipu_lishiyuanbyj8 as GenealogyDataset],
  ["lichongshoucg", lipu_lichongshoucg as GenealogyDataset],
  ["lidemingtwq", lipu_lidemingtwq as GenealogyDataset],
  ["liqingyunsc", lipu_liqingyunsc as GenealogyDataset],
  ["lichengxuefe", lipu_lichengxuefe as GenealogyDataset],
  ["lichengxuefe2", lipu_lichengxuefe2 as GenealogyDataset],
  ["lichengxuefe3", lipu_lichengxuefe3 as GenealogyDataset],
  ["liyingkuigd", lipu_liyingkuigd as GenealogyDataset],
  ["liyingkuigd2", lipu_liyingkuigd2 as GenealogyDataset],
  ["liyingkuigd3", lipu_liyingkuigd3 as GenealogyDataset],
  ["liyingkuigd4", lipu_liyingkuigd4 as GenealogyDataset],
  ["liyingkuigd5", lipu_liyingkuigd5 as GenealogyDataset],
  ["liyingkuigd6", lipu_liyingkuigd6 as GenealogyDataset],
  ["lichengkehz", lipu_lichengkehz as GenealogyDataset],
  ["lichengkehz2", lipu_lichengkehz2 as GenealogyDataset],
  ["lichengkehz3", lipu_lichengkehz3 as GenealogyDataset],
  ["liguodongzx", lipu_liguodongzx as GenealogyDataset],
  ["liguodongzx2", lipu_liguodongzx2 as GenealogyDataset],
  ["liguodongzx3", lipu_liguodongzx3 as GenealogyDataset],
  ["liguodongzx4", lipu_liguodongzx4 as GenealogyDataset],
  ["liguodongzx5", lipu_liguodongzx5 as GenealogyDataset],
  ["liguodongzx6", lipu_liguodongzx6 as GenealogyDataset],
  ["liguodongzx7", lipu_liguodongzx7 as GenealogyDataset],
  ["liguodongzx8", lipu_liguodongzx8 as GenealogyDataset],
  ["liguodongzx9", lipu_liguodongzx9 as GenealogyDataset],
  ["liguodongzx10", lipu_liguodongzx10 as GenealogyDataset],
  ["liguodongzx11", lipu_liguodongzx11 as GenealogyDataset],
  ["lixiantingdf", lipu_lixiantingdf as GenealogyDataset],
  ["lixiantingdf2", lipu_lixiantingdf2 as GenealogyDataset],
  ["lixiantingdf3", lipu_lixiantingdf3 as GenealogyDataset],
  ["lixiantingdf4", lipu_lixiantingdf4 as GenealogyDataset],
  ["lixiantingdf5", lipu_lixiantingdf5 as GenealogyDataset],
  ["lixiantingdf6", lipu_lixiantingdf6 as GenealogyDataset],
  ["lixiantingdf7", lipu_lixiantingdf7 as GenealogyDataset],
  ["lixiantingdf8", lipu_lixiantingdf8 as GenealogyDataset],
  ["lixiantingdf9", lipu_lixiantingdf9 as GenealogyDataset],
  ["lixiantingdf10", lipu_lixiantingdf10 as GenealogyDataset],
  ["lixiantingdf11", lipu_lixiantingdf11 as GenealogyDataset],
  ["lixiantingdf12", lipu_lixiantingdf12 as GenealogyDataset],
  ["lizhengkainj", lipu_lizhengkainj as GenealogyDataset],
  ["lirunmeijs", lipu_lirunmeijs as GenealogyDataset],
  ["liruqingwn", lipu_liruqingwn as GenealogyDataset],
  ["lizongwu", lipu_lizongwu as GenealogyDataset],
  ["lihongshun", lipu_lihongshun as GenealogyDataset],
  ["lihonglian", lipu_lihonglian as GenealogyDataset],
  ["liziquan", lipu_liziquan as GenealogyDataset],
  ["qxjy_a01", lipu_qxjy_a01 as GenealogyDataset],
  ["qxjy_a02", lipu_qxjy_a02 as GenealogyDataset],
  ["qxjy_a03", lipu_qxjy_a03 as GenealogyDataset],
  ["qxjy_a04", lipu_qxjy_a04 as GenealogyDataset],
  ["qxjy_a05", lipu_qxjy_a05 as GenealogyDataset],
  ["qxjy_a06", lipu_qxjy_a06 as GenealogyDataset],
  ["qxjy_a07", lipu_qxjy_a07 as GenealogyDataset],
  ["qxjy_a08", lipu_qxjy_a08 as GenealogyDataset],
  ["qxjy_a09", lipu_qxjy_a09 as GenealogyDataset],
  ["qxjy_a10", lipu_qxjy_a10 as GenealogyDataset],
  ["qxjy_a11", lipu_qxjy_a11 as GenealogyDataset],
  ["qxjy_a12", lipu_qxjy_a12 as GenealogyDataset],
  ["qxjy_a13", lipu_qxjy_a13 as GenealogyDataset],
  ["qxjy_a14", lipu_qxjy_a14 as GenealogyDataset],
  ["qxjy_a15", lipu_qxjy_a15 as GenealogyDataset],
  ["qxjy_a16", lipu_qxjy_a16 as GenealogyDataset],
  ["qxjy_a17", lipu_qxjy_a17 as GenealogyDataset],
  ["qxjy_a18", lipu_qxjy_a18 as GenealogyDataset],
  ["qxjy_a19", lipu_qxjy_a19 as GenealogyDataset],
  ["qxjy_a20", lipu_qxjy_a20 as GenealogyDataset],
  ["qxjy_a21", lipu_qxjy_a21 as GenealogyDataset],
  ["qxjy_a22", lipu_qxjy_a22 as GenealogyDataset],
  ["qxjy_a23", lipu_qxjy_a23 as GenealogyDataset],
  ["qxjy_a24", lipu_qxjy_a24 as GenealogyDataset],
  ["qxjy_a25", lipu_qxjy_a25 as GenealogyDataset],
  ["qxjy_a26", lipu_qxjy_a26 as GenealogyDataset],
  ["qxjy_a27", lipu_qxjy_a27 as GenealogyDataset],
  ["qxjy_a28", lipu_qxjy_a28 as GenealogyDataset],
  ["qxjy_a29", lipu_qxjy_a29 as GenealogyDataset],
  ["qxjy_a30", lipu_qxjy_a30 as GenealogyDataset],
  ["qxjy_a31", lipu_qxjy_a31 as GenealogyDataset],
  ["qxjy_a32", lipu_qxjy_a32 as GenealogyDataset],
  ["qxjy_a33", lipu_qxjy_a33 as GenealogyDataset],
  ["qxjy_a34", lipu_qxjy_a34 as GenealogyDataset],
  ["qxjy_a35", lipu_qxjy_a35 as GenealogyDataset],
  ["qxjy_a36", lipu_qxjy_a36 as GenealogyDataset],
  ["qxjy_b01", lipu_qxjy_b01 as GenealogyDataset],
  ["qxjy_b02", lipu_qxjy_b02 as GenealogyDataset],
  ["qxjy_b03", lipu_qxjy_b03 as GenealogyDataset],
  ["qxjy_c01", lipu_qxjy_c01 as GenealogyDataset],
  ["qxjy_c02", lipu_qxjy_c02 as GenealogyDataset],
  ["qxjy_c03", lipu_qxjy_c03 as GenealogyDataset],
  ["qxjy_c04", lipu_qxjy_c04 as GenealogyDataset],
  ["qxjy_c05", lipu_qxjy_c05 as GenealogyDataset],
  ["qxjy_c06", lipu_qxjy_c06 as GenealogyDataset],
  ["qxjy_c07", lipu_qxjy_c07 as GenealogyDataset],
  ["qxjy_c08", lipu_qxjy_c08 as GenealogyDataset],
  ["qxjy_c09", lipu_qxjy_c09 as GenealogyDataset],
  ["qxjy_c10", lipu_qxjy_c10 as GenealogyDataset],
  ["qxjy_c11", lipu_qxjy_c11 as GenealogyDataset],
  ["qxjy_c12", lipu_qxjy_c12 as GenealogyDataset],
  ["qxjy_c13", lipu_qxjy_c13 as GenealogyDataset],
  ["qxjy_c14", lipu_qxjy_c14 as GenealogyDataset],
  ["qxjy_c15", lipu_qxjy_c15 as GenealogyDataset],
  ["qxjy_c16", lipu_qxjy_c16 as GenealogyDataset],
  ["qxjy_c17", lipu_qxjy_c17 as GenealogyDataset],
  ["qxjy_c18", lipu_qxjy_c18 as GenealogyDataset],
  ["qxjy_c19", lipu_qxjy_c19 as GenealogyDataset],
  ["qxjy_c20", lipu_qxjy_c20 as GenealogyDataset],
  ["qxjy_c21", lipu_qxjy_c21 as GenealogyDataset],
  ["qxjy_c22", lipu_qxjy_c22 as GenealogyDataset],
  ["qxjy_c23", lipu_qxjy_c23 as GenealogyDataset],
  ["qxjy_c24", lipu_qxjy_c24 as GenealogyDataset],
  ["qxjy_c25", lipu_qxjy_c25 as GenealogyDataset],
  ["qxjy_c26", lipu_qxjy_c26 as GenealogyDataset],
  ["qxjy_c27", lipu_qxjy_c27 as GenealogyDataset],
  ["qxjy_c28", lipu_qxjy_c28 as GenealogyDataset],
  ["qxjy_c29", lipu_qxjy_c29 as GenealogyDataset],
  ["qxjy_c30", lipu_qxjy_c30 as GenealogyDataset],
  ["qxjy_c31", lipu_qxjy_c31 as GenealogyDataset],
  ["qxjy_c32", lipu_qxjy_c32 as GenealogyDataset],
  ["qxjy_c33", lipu_qxjy_c33 as GenealogyDataset],
  ["qxjy_c34", lipu_qxjy_c34 as GenealogyDataset],
  ["qxjy_c35", lipu_qxjy_c35 as GenealogyDataset],
  ["qxjy_c36", lipu_qxjy_c36 as GenealogyDataset],
  ["qxjy_c37", lipu_qxjy_c37 as GenealogyDataset],
  ["qxjy_c38", lipu_qxjy_c38 as GenealogyDataset],
  ["qxjy_c39", lipu_qxjy_c39 as GenealogyDataset],
  ["qxjy_c40", lipu_qxjy_c40 as GenealogyDataset],
  ["qxjy_c41", lipu_qxjy_c41 as GenealogyDataset],
  ["qxjy_c42", lipu_qxjy_c42 as GenealogyDataset],
  ["qxjy_c43", lipu_qxjy_c43 as GenealogyDataset],
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
