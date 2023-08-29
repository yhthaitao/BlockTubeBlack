import {kit} from "../../../../src/kit/kit";
import CConst from "../../../../src/config/CConst";
import Common from "../../../../src/config/Common";

const {ccclass, property} = cc._decorator;
@ccclass
export default class GameWin extends cc.Component {

    @property(cc.Node) mask: cc.Node = null;
    @property(cc.Node) content: cc.Node = null;

    @property(cc.Node) nodeParticle: cc.Node = null;
    @property(cc.Node) nodeTop: cc.Node = null;
    @property(cc.Node) nodeSign: cc.Node = null;
    @property(cc.Node) nodeNext: cc.Node = null;

    isLock: boolean = false;

    protected onLoad(): void {
        Common.log('GameWin onLoad()');
        this.mask.width = cc.winSize.width;
        this.mask.height = cc.winSize.height;
    }

    protected start(): void {
        this.playAniEnter();
    }

    /** 播放动画 进入结算界面 */
    playAniEnter() {
        kit.Audio.playEffect(CConst.sound_path_win);

        // 隐藏 win标签
        this.nodeSign.opacity = 0;
        // 隐藏 粒子
        let particleLeft = this.nodeParticle.getChildByName('particleLeft');
        let particleRight = this.nodeParticle.getChildByName('particleRight');
        particleLeft.opacity = 0;
        particleRight.opacity = 0;
        // 隐藏 开始按钮
        this.nodeNext.opacity = 0;

        // 横幅动画
        let aniTop = this.nodeTop.getComponent(cc.Animation);
        let timeTop = aniTop.defaultClip.duration;
        // 按时播放动画
        cc.tween(this.node).call(() => {
            // mask节点 出现
            let opaMask = this.mask.opacity;
            this.mask.opacity = 0;
            cc.tween(this.mask).to(0.5, {opacity: opaMask}).start();
            // 横幅动画播放
            aniTop.play();
            // 右侧粒子出现
            particleRight.opacity = 255;
            particleRight.getComponent(cc.ParticleSystem).resetSystem();
        }).delay(timeTop / 3).call(() => {
            // 左侧粒子出现
            particleLeft.opacity = 255;
            particleLeft.getComponent(cc.ParticleSystem).resetSystem();
        }).delay(timeTop / 3).call(() => {
            // win标签出现
            this.nodeSign.opacity = 255;
            let heightMax = cc.winSize.height * 0.5;
            let sign = this.nodeSign.getChildByName('sign');
            let p1 = cc.v3(0, heightMax * 1.0);
            let p2 = cc.v3(0, 195);
            let p3 = cc.v3(0, 315);
            let p4 = cc.v3(0, 235);
            sign.opacity = 0;
            sign.position = p1;
            cc.tween(sign).parallel(
                cc.tween().to(0.383, {position: p2}, {easing: 'sineOut'})
                    .to(0.383, {position: p3}, {easing: 'sineInOut'})
                    .to(0.383, {position: p4}, {easing: 'sineInOut'}),
                cc.tween().to(0.4, {opacity: 255}),
            ).call(() => {
                this.nodeNext.active = true;
                this.nodeNext.opacity = 255;
            }).start();
        }).start();
    }

    eventBtnNext() {
        if (this.nodeNext.opacity != 255) return;
        if (this.isLock) {
            return;
        }
        this.isLock = true;
        kit.Audio.playEffect(CConst.sound_path_click);
        this.playAniLeave();
    }

    /** 播放动画 离开结算界面 */
    playAniLeave() {
        // 动画结束后 进入下一关
        let funcAfter = () => {
            this.node.removeFromParent();
            kit.Event.emit(CConst.event_enter_nextLevel, false, true);
        };
        let heightMax = cc.winSize.height * 0.5;
        let sign = this.nodeSign.getChildByName('sign');
        cc.tween(sign).parallel(
            cc.tween().to(0.383, {y: heightMax}, {easing: 'sineInOut'}),
            cc.tween().to(0.383, {opacity: 0}),
        ).call(funcAfter).start();

        cc.tween(this.nodeNext).to(0.2, {opacity: 0}).start();
    }
}
