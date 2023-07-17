import { kit } from "../../../../src/kit/kit";
import Common from "../../../../src/config/Common";
import CConst from "../../../../src/config/CConst";

const { ccclass, property } = cc._decorator;
@ccclass
export default class SortTube extends cc.Component {

    @property(cc.Node) nodeMain: cc.Node = null;// 动物父节点
    @property(cc.Node) nodeTop: cc.Node = null;// 瓶子上层
    @property(cc.Node) particle: cc.Node = null;// 锁定效果

    dis: number = 70;
    heightTop: number = 190;
    yParticle: number = -10;

    init(blockNum: number) {
        this.particle.opacity = 0;
        this.particle.y = this.yParticle + this.dis * (blockNum - 1);
        this.nodeTop.height = this.heightTop + this.dis * (blockNum - 1);
        this.clearBlocks();
    };

    eventBtn() {
        let scriptMain = this.getScriptMain();
        if (scriptMain) {
            let isEnough = this.checkIsEnough(scriptMain.dataObj.blockTotal);
            if (isEnough) {
                Common.log(' 瓶子已满 name: ', this.node.name);
            }
            else{
                scriptMain.eventTouchTube(this.node);
            }
        }
        else {
            Common.log(' 异常 找不到脚本 scriptMain ');
            return;
        }
    };

    /** 瓶子选中效果 */
    tubeSelect(isSelect) {
        // let opaStart = isSelect ? 0 : 255;
        // let opaFinish = isSelect ? 255 : 0;
        // this.nodeLight.opacity = opaStart;
        // cc.tween(this.nodeLight).to(.383, {opacity: opaFinish}).start();
    };

    /** 瓶子锁定效果 */
    tubesuccess(blocksTotal: number): Promise<boolean> {
        return new Promise(res => {
            // 第一个条件 4个小动物
            let isTubeEnough = this.checkIsEnough(blocksTotal);
            if (isTubeEnough) {
                kit.Audio.playEffect(CConst.sound_path_finish);
                this.particle.opacity = 255;
                this.particle.getComponent(cc.ParticleSystem).resetSystem();

                // cc.tween(this.particle).to(0.5, { opacity: 255 }).to(1, { opacity: 0 }).call(() => {
                //     res(true);
                // }).start();
                res(true);
            }
            else {
                res(false);
            }
        });
    };

    checkIsEnough(blocksTotal){
        // 第一个条件 4个小动物
        let isTubeEnough = this.nodeMain.childrenCount == blocksTotal;
        if (isTubeEnough) {
            // 第二个条件 小动物种类一致
            let blockOne = this.nodeMain.children[0];
            let blockNum = blockOne.getComponent('SortBlock').number;
            for (let i = 1; i < blocksTotal; i++) {
                let blockI = this.nodeMain.children[i];
                let scriptI = blockI.getComponent('SortBlock');
                if (scriptI.isCover || scriptI.number != blockNum) {
                    isTubeEnough = false;
                    break;
                }
            }
        }
        return isTubeEnough;
    };

    getScriptMain() {
        let gameMain = null;
        let tubeMain = this.node.parent;
        if (tubeMain) {
            gameMain = tubeMain.parent;
        }
        if (gameMain) {
            return gameMain.getComponent('GameSort');
        }
        return null;
    }

    clearBlocks(): void {
        for (let index = this.nodeMain.childrenCount - 1; index >= 0; index--) {
            this.nodeMain.children[index].destroy();
        }
    };

    getBlockTop() {
        let block: cc.Node;
        let blocks = Common.getArrByPosY(this.nodeMain);
        let length = blocks.length;
        if (length > 0) {
            block = blocks[blocks.length - 1];
        }
        else {
            block = null;
        }
        return block;
    };

    initCover() {
        let blocks = Common.getArrByPosY(this.nodeMain);
        for (let index = 0, length = blocks.length; index < length; index++) {
            const block = blocks[index];
            let scriptBlock = block.getComponent('SortBlock');
            scriptBlock.setCover(index == length - 1 ? false : true);
        }
    };

    hideBlockTopCover() {
        let blockTop = this.getBlockTop();
        if (blockTop) {
            let scriptBlock = blockTop.getComponent('SortBlock');
            if (scriptBlock.isCover) {
                scriptBlock.hideCover();
            }
        }
    };
}