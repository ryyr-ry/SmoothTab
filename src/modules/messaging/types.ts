/**
 * 型付きメッセージプロトコルの定義。
 * 判別共用体により、全メッセージが型安全に送受信される。
 */

export interface ContentScriptReadyMessage {
  readonly type: 'CONTENT_SCRIPT_READY';
}

export interface InitMessage {
  readonly type: 'INIT';
  readonly payload: {
    readonly blacklisted: boolean;
    readonly delay: number;
    readonly enableYouTubeFix: boolean;
    readonly enableRightDoubleClickClose: boolean;
    readonly rightDoubleClickDelay: number;
  };
}

export interface NewTabMessage {
  readonly type: 'NEW_TAB';
  readonly url: string;
}

export interface CloseTabMessage {
  readonly type: 'CLOSE_TAB';
}

export interface OptionsUpdatedMessage {
  readonly type: 'OPTIONS_UPDATED';
  readonly payload: {
    readonly delay?: number;
    readonly blacklist?: Record<string, boolean>;
    readonly rightDoubleClickDelay?: number;
  };
}

export interface YouTubeFixToggledMessage {
  readonly type: 'YOUTUBE_FIX_TOGGLED';
  readonly payload: {
    readonly enabled: boolean;
  };
}

export interface RightClickCloseToggledMessage {
  readonly type: 'RIGHT_CLICK_CLOSE_TOGGLED';
  readonly payload: {
    readonly enabled: boolean;
  };
}

export type ExtensionMessage =
  | ContentScriptReadyMessage
  | InitMessage
  | NewTabMessage
  | CloseTabMessage
  | OptionsUpdatedMessage
  | YouTubeFixToggledMessage
  | RightClickCloseToggledMessage;

export type MessageType = ExtensionMessage['type'];
