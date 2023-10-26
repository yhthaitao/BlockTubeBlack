import {kit} from "../../../../src/kit/kit";
import Common from "../../../../src/config/Common";
import CConst from "../../../../src/config/CConst";
import SortBlock from "./SortBlock";
import GameSort from "./GameSort";

const {ccclass, property} = cc._decorator;
@ccclass
export default class SortTube extends cc.Component {

    @property(cc.Node) nodeMain: cc.Node = null;// 动物父节点
    @property(cc.Node) nodeTop: cc.Node = null;// 瓶子上层
    @property(cc.Node) particle: cc.Node = null;// 锁定效果

    dis: number = 70;
    heightTop: number = 190;
    yParticle: number = -10;
    isMovingTube: boolean = false;//瓶子是否正在移动
    isPutting: boolean = false;//瓶子是否正在放入羽毛球
    zIndexInit: number = 0;
    blockNum: number = 4;

    init(blockNum: number) {
        this.particle.opacity = 0;
        this.isMovingTube = false;//瓶子是否正在移动
        this.isPutting = false;
        this.blockNum = blockNum;
        this.particle.y = this.yParticle + this.dis * (blockNum - 1);
        this.nodeTop.height = this.heightTop + this.dis * (blockNum - 1);
        this.clearBlocks();
    };

    addTubeSet(blockNum: number) {
        this.blockNum = blockNum;
        this.nodeTop.height = this.heightTop + this.dis * (blockNum - 1);
    };

    initName(namePre: string, index: number) {
        this.zIndexInit = index;
        this.node.name = namePre + index;
    };

    resetIndex() {
        this.node.zIndex = this.zIndexInit;
    }

    eventBtn() {
        let scriptMain = this.getScriptMain();
        if (scriptMain) {
            let isEnough = this.checkIsEnough(scriptMain.dataObj.blockTotal);
            if (isEnough) {
                Common.log(' 瓶子已满 name: ', this.node.name);
            } else {
                // console.log("===eventBtn===", this.node.name, '==isMovingTube==', this.isMovingTube)
                if (!this.isMovingTube) {
                    scriptMain.eventTouchTube(this.node);
                }
            }
        } else {
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
            } else {
                res(false);
            }
        });
    };

    checkIsEnough(blocksTotal) {
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
        } else {
            block = null;
        }
        return block;
    };

    getCoverBlockTop() {
        let block: cc.Node;
        let covers = []
        let blocks = Common.getArrByPosY(this.nodeMain);
        let length = blocks.length;
        if (length > 0) {
            block = blocks[blocks.length - 1];
            let blockScript: SortBlock = block.getComponent(SortBlock);
            covers = [block]

            for (let i = blocks.length - 1; i >= 0; i--) {
                if (i != blocks.length - 1) {
                    let newScript: SortBlock = blocks[i].getComponent(SortBlock);
                    if (blockScript.number == newScript.number) {
                        covers.push(blocks[i])
                    } else break;
                }
            }
        }
        return covers;
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
        // console.log("===hideBlockTopCover===", this.node.name)
        let blockTop = this.getCoverBlockTop();
        // console.log("===blockTop===", blockTop)
        if (blockTop.length > 0) {
            for (let i = 0; i < blockTop.length; i++) {
                let scriptBlock = blockTop[i].getComponent('SortBlock');
                if (scriptBlock.isCover) {
                    scriptBlock.hideCover();
                }
            }
        }
    };

    zIndexBlocks() {
        // 羽毛球是 zIndex越大，y越小，因为羽毛球特殊 底层要在最外侧显示，包裹上面的
        // index = 3、2、1、0  y = 285 215 145 75
        // childrenCount中，最后一个是最上
        let scriptMain = this.getScriptMain();
        // for (let index = this.nodeMain.childrenCount - 1; index >= 0; index--) {
        //     console.log("==1=zIndexBlocks===blockTotal=====", scriptMain.dataObj.blockTotal, "========childrenCount===", (index + 1), "======y=====", this.nodeMain.children[index].y, "========zIndex===", this.nodeMain.children[index].zIndex)
        //     // block.y = this.block_y.start + this.block_y.dis * (scriptTube.nodeMain.childrenCount - 1);
        //     this.nodeMain.children[index].y = scriptMain.block_y.start + scriptMain.block_y.dis * (this.nodeMain.childrenCount - index - 1);
        //     // block.zIndex = this.dataObj.blockTotal - scriptTube.nodeMain.childrenCount;
        //     this.nodeMain.children[index].zIndex = index;// 游戏开始时候数childrenCount，所以zIndex是0123
        //     console.log("==2=zIndexBlocks===blockTotal=====", scriptMain.dataObj.blockTotal, "========childrenCount===", (index + 1), "======y=====", this.nodeMain.children[index].y, "========zIndex===", this.nodeMain.children[index].zIndex)
        // }
        for (let index = this.nodeMain.childrenCount - 1; index >= 0; index--) {
            // console.log("==1==indexNumber===", this.nodeMain.children[index].getComponent(SortBlock).indexNumber, "======y=====", this.nodeMain.children[index].y, "========zIndex===", this.nodeMain.children[index].zIndex)
            // block.y = this.block_y.start + this.block_y.dis * (scriptTube.nodeMain.childrenCount - 1);
            this.nodeMain.children[index].y = scriptMain.block_y.start + scriptMain.block_y.dis * (this.nodeMain.children[index].getComponent(SortBlock).indexNumber - 1);
            // block.zIndex = this.dataObj.blockTotal - scriptTube.nodeMain.childrenCount;
            this.nodeMain.children[index].zIndex = scriptMain.dataObj.blockTotal - this.nodeMain.children[index].getComponent(SortBlock).indexNumber;// 游戏开始时候数childrenCount，所以zIndex是0123
            // console.log("==2======indexNumber===", this.nodeMain.children[index].getComponent(SortBlock).indexNumber, "======y=====", this.nodeMain.children[index].y, "========zIndex===", this.nodeMain.children[index].zIndex)
        }
    };
}