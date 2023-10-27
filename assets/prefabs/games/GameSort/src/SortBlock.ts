import {kit} from "../../../../src/kit/kit";
import Common from "../../../../src/config/Common";
import CConst from "../../../../src/config/CConst";
import SortTube from "./SortTube";

const {ccclass, property} = cc._decorator;
@ccclass
export default class SortBlock extends cc.Component {

    @property(cc.Node) nodeIcon: cc.Node = null;
    @property(cc.Node) nodeCover: cc.Node = null;
    @property([cc.SpriteFrame]) textures: cc.SpriteFrame[] = [];

    number: number = 0;
    isCover: boolean = false;
    baseTime = 1;// 基础时间 用于计算移动时间
    baseDis = 2500;// 基础距离 用于计算移动时间
    indexNumber: number = 0;

    width: number = 229 * 0.4;
    height: number = 322 * 0.4;

    init(type: number, cover: boolean) {
        this.setColor(type);
        this.setCover(cover);
    };

    setColor(tNumber) {
        this.number = tNumber;
        let length = this.textures.length;
        if (this.number < 1) {
            this.number = 1;
        } else if (this.number > length) {
            this.number = length;
        }
        this.nodeIcon.getComponent(cc.Sprite).spriteFrame = this.textures[this.number - 1];
        this.nodeIcon.width = this.width;
        this.nodeIcon.height = this.height;
    };

    setCover(cover) {
        this.isCover = cover;
        this.nodeCover.opacity = this.isCover ? 255 : 0;
        if (this.nodeCover.opacity == 255) {
            this.nodeCover.width = this.width;
            this.nodeCover.height = this.height;
        }
    };

    hideCover() {
        this.isCover = false;
        this.nodeCover.opacity = 255;
        cc.tween(this.nodeCover).to(0.383, {opacity: 0}, cc.easeSineInOut()).start();
    };

    /** 移动 */
    fly(objMove: any, oldTube: cc.Node, newTube: cc.Node, nodeGame: cc.Node, adFunc: any): Promise<void> {
        let timeStart = Common.getMoveTime(objMove.p1_start, objMove.p1_finish, this.baseTime, this.baseDis);
        if (timeStart > 0.12) timeStart = 0.12
        // console.log("====timeStart===", timeStart)
        let objBesizr = Common.getBezierObj(objMove.p2_start, objMove.p2_finish, !objMove.isLast);
        let timeBezier = Common.getBezierTime(objBesizr, this.baseTime * 0.6, this.baseDis);
        let oldTubeScript = oldTube.getComponent(SortTube);
        let newTubeScript = newTube.getComponent(SortTube);
        // console.log("====timeBezier===", timeBezier)
        let timeRotate1 = 0;
        let timeRotate2 = timeBezier - timeRotate1;
        let lastRotate = 360;
        let dirBesizr = objBesizr.p1.x > objBesizr.p2.x ? 1 : -1;
        let scaleTube = oldTube.scale;
        let scaleBlock = this.node.scale;
        // let timeFinish = Common.getMoveTime(objMove.p3_start, objMove.p3_finish, this.baseTime, this.baseDis);
        let timeFinish = 0.08
        // console.log("====timeFinish===", timeFinish)
        return new Promise(res => {
            let isDelay = objMove.isLast && objMove.moveNum > 1;
            // console.log("====isDelay===", isDelay ? 0.25 : 0)
            // console.log("====飞行总计===", timeFinish + timeBezier + (isDelay ? 0.25 : 0))
            cc.tween(this.node).delay(isDelay ? 0.25 : 0).to(timeStart, {position: objMove.p1_finish}, cc.easeSineOut()).call(() => {
                this.node.parent = nodeGame;
                this.node.scale = scaleTube;
                this.node.position = objMove.p2_start;
                kit.Audio.playEffect(objMove.isLast ? CConst.sound_path_ballLong : CConst.sound_path_ballSort);
                res();
            }).parallel(
                cc.tween().bezierTo(timeBezier, objBesizr.p1, objBesizr.p2, objBesizr.pTo),
                cc.tween().to(timeRotate1, {angle: dirBesizr * 180}).to(timeRotate2, {angle: dirBesizr * lastRotate}),
            ).call(() => {
                this.node.parent = newTube.getComponent('SortTube').nodeMain;
                this.indexNumber = newTube.getComponent('SortTube').nodeMain.childrenCount;
                this.node.scale = scaleBlock;
                this.node.angle = 0;
                this.node.position = objMove.p3_start;
                // this.node.zIndex = objMove.blocksNum - newTube.getComponent('SortTube').nodeMain.childrenCount - 1;
                this.node.zIndex = objMove.blocksNum - this.indexNumber;
            }).call(() => {
                newTube.getComponent('SortTube').isPutting = true;
                if (typeof adFunc == "function" && cc.isValid(adFunc)) adFunc();
            }).to(timeFinish, {position: objMove.p3_finish}, cc.easeSineInOut()).call(() => {
                this.node.angle = 0;
                // oldTube.zIndex = 0;
                // newTube.zIndex = 0;
                oldTubeScript.resetIndex();
                newTubeScript.resetIndex();
                newTube.getComponent('SortTube').zIndexBlocks();
                objMove.callback && objMove.callback();
            }).start();
        });
    };

    /** 移动 */
    flyLast(objMove: any, oldTube: cc.Node, newTube: cc.Node, nodeGame: cc.Node): Promise<void> {
        let time1 = Common.getMoveTime(objMove.p1_start, objMove.p1_finish, this.baseTime, this.baseDis);
        let time2 = Common.getMoveTime(objMove.p2_start, objMove.p2_finish, this.baseTime, this.baseDis);
        let lastRotate = 360;
        if (objMove.isLast) {
            let pAngle1 = cc.v2(objMove.p2_start.x, objMove.p2_start.y);
            let pAngle2 = cc.v2(objMove.p2_finish.x, objMove.p2_finish.y);
            lastRotate = Common.getAngleFromPoints(pAngle1, pAngle2) + 90;
        }
        let scaleTube = oldTube.scale;
        let scaleBlock = this.node.scale;
        // let timeFinish = Common.getMoveTime(objMove.p3_start, objMove.p3_finish, this.baseTime, this.baseDis);
        let timeFinish = 0.08
        return new Promise(res => {
            let isDelay = objMove.isLast && objMove.moveNum > 1;
            this.node.angle = 180;
            cc.tween(this.node).delay(isDelay ? 0.25 : 0).to(time1 * 1.5, {position: objMove.p1_finish}, cc.easeSineInOut()).call(() => {
                this.node.parent = nodeGame;
                this.node.scale = scaleTube;
                this.node.angle = lastRotate;
                this.node.position = objMove.p2_start;
                kit.Audio.playEffect(objMove.isLast ? CConst.sound_path_ballLong : CConst.sound_path_ballSort);
                res();
            }).to(time2 * 2, {position: objMove.p2_finish}, cc.easeSineOut()).call(() => {
                this.node.parent = newTube.getComponent('SortTube').nodeMain;
                this.indexNumber = newTube.getComponent('SortTube').nodeMain.childrenCount;
                this.node.scale = scaleBlock;
                this.node.angle = 0;
                this.node.position = objMove.p3_start;
                // this.node.zIndex = objMove.blocksNum - newTube.getComponent('SortTube').nodeMain.childrenCount;
                this.node.zIndex = objMove.blocksNum - this.indexNumber;
            }).to(timeFinish * 2, {position: objMove.p3_finish}, cc.easeSineInOut()).call(() => {
                this.node.angle = 0;
                oldTube.zIndex = 0;
                newTube.zIndex = 0;
                newTube.getComponent('SortTube').zIndexBlocks();
            }).to(0.15, {angle: -5}).to(0.15, {angle: 5}).to(0.15, {angle: -5}).to(0.15, {angle: 0}).call(() => {
                objMove.callback && objMove.callback();
            }).start();
        });
    };
}