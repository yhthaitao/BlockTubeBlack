import { kit } from "../../../../src/kit/kit";
import PopupBase from "../../../../src/kit/manager/popupManager/PopupBase";
import Common from "../../../../src/config/Common";
import CConst from "../../../../src/config/CConst";
import DataManager, { LangChars } from "../../../../src/config/DataManager";

const { ccclass, property } = cc._decorator;
@ccclass
export default class Setting extends PopupBase {

    @property(cc.Node) uiBack: cc.Node = null;
    @property(cc.Node) uiSignOn: cc.Node = null;
    @property(cc.Node) uiSignOff: cc.Node = null;
    @property(cc.Node) labelTitle: cc.Node = null;
    @property(cc.Node) labelOn: cc.Node = null;
    @property(cc.Node) labelOff: cc.Node = null;

    isMoving: boolean = false;
    xMin: number = 0;
    xMax: number = 0;

    protected onLoad(): void {
        this.initLabel();
    }

    async initLabel(){
        let charsTitle = await DataManager.getString(LangChars.SETTING);
        this.labelTitle.getComponent(cc.Label).string = charsTitle;

        let charsOn = await DataManager.getString(LangChars.ON);
        this.labelOn.getComponent(cc.Label).string = charsOn;

        let charsOff = await DataManager.getString(LangChars.OFF);
        this.labelOff.getComponent(cc.Label).string = charsOff;
    }

    protected start(): void {
        this.initData();
        this.initUI();
    }

    initData(){
        this.isMoving = false;
        this.xMin = this.uiSignOff.x;
        this.xMax = this.uiSignOn.x;
    }

    async initUI(){
        this.uiSignOn.active = false;
        this.uiSignOff.active = false;
        let config = kit.Audio.config;
        if (config.isPlayMusic) {
            this.uiSignOn.x = this.xMax;
            this.uiSignOn.active = true;
        }
        else{
            this.uiSignOff.x = this.xMin;
            this.uiSignOff.active = true;
        }
    }

    /** 按钮事件 音频 */
    eventBtnSound() {
        if (this.isMoving) {
            return;
        }
        kit.Audio.playEffect(CConst.sound_path_click);
        let funcPre = (uiSign: cc.Node, xStart: number, xFinish: number)=>{
            uiSign.active = true;
            uiSign.x = xStart;
            let time = Common.getMoveTime(cc.v3(xStart), cc.v3(xFinish), 1, 1000);
            cc.tween(uiSign).to(time, {x: xFinish}).call(funcAfter).start();
        };
        let funcAfter = ()=>{
            this.isMoving = false;
        };

        this.isMoving = true;
        this.uiSignOn.active = false;
        this.uiSignOff.active = false;
        let config = kit.Audio.config;
        if (config.isPlayMusic) {
            kit.Audio.setIsSound(false);
            funcPre(this.uiSignOff, this.xMax, this.xMin);
        }
        else{
            kit.Audio.setIsSound(true);
            kit.Audio.playMusic(CConst.sound_path_music);
            funcPre(this.uiSignOn, this.xMin, this.xMax);
        }
    }

    eventBtnExit(){
        kit.Audio.playEffect(CConst.sound_path_click);
        kit.Popup.hide();
    }
}
