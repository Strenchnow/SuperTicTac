import { isMuted, setMuted } from './audio';

export interface PlayhopSDK {
  features: {
    LoadingAPI?: {
      ready: () => void;
    };
    GameplayAPI?: {
      start: () => void;
      stop: () => void;
    };
  };
  adv: {
    showFullscreenAdv: (options: {
      callbacks?: {
        onOpen?: () => void;
        onClose?: (wasShown: boolean) => void;
        onError?: (error: unknown) => void;
        onOffline?: () => void;
      };
    }) => void;
    showRewardedVideo?: (options: {
      callbacks?: {
        onOpen?: () => void;
        onRewarded?: () => void;
        onClose?: () => void;
        onError?: (error: unknown) => void;
      };
    }) => void;
  };
  deviceInfo: {
    type: string;
    isMobile: () => boolean;
    isTablet: () => boolean;
    isDesktop: () => boolean;
  };
  environment?: {
    i18n?: {
      lang?: string;
    };
  };
}

declare global {
  interface Window {
    YaGames?: {
      init: (options?: unknown) => Promise<PlayhopSDK>;
    };
    PlayhopGames?: {
      init: (options?: unknown) => Promise<PlayhopSDK>;
    };
    ysdk?: PlayhopSDK;
  }
}

class PlayhopService {
  private sdk: PlayhopSDK | null = null;
  private isInitialized = false;
  private lastAdTime = 0;
  private adCooldownMs = 60000; // 60 seconds cooldown between interstitial ads
  private wasMutedBeforeAd = false;
  private wasMutedBeforeBlur = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Auto-mute on tab switch / window blur
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.wasMutedBeforeBlur = isMuted();
          setMuted(true);
          this.sdk?.features.GameplayAPI?.stop();
        } else {
          if (!this.wasMutedBeforeBlur) {
            setMuted(false);
          }
          this.sdk?.features.GameplayAPI?.start();
        }
      });
    }
  }

  public async init(): Promise<PlayhopSDK | null> {
    if (this.isInitialized) return this.sdk;
    if (typeof window === 'undefined') return null;

    const initFn = window.YaGames?.init || window.PlayhopGames?.init;
    if (!initFn) {
      console.log('[PlayhopSDK] Running outside Playhop / WebGL portal.');
      return null;
    }

    try {
      this.sdk = await initFn();
      window.ysdk = this.sdk;
      this.isInitialized = true;
      console.log('[PlayhopSDK] Initialized successfully.');

      this.notifyGameReady();
      return this.sdk;
    } catch (err) {
      console.warn('[PlayhopSDK] Init error:', err);
      return null;
    }
  }

  public getLanguage(): string {
    return this.sdk?.environment?.i18n?.lang || (typeof navigator !== 'undefined' ? navigator.language.slice(0, 2) : 'en');
  }

  public notifyGameReady(): void {
    if (this.sdk?.features.LoadingAPI?.ready) {
      this.sdk.features.LoadingAPI.ready();
      console.log('[PlayhopSDK] LoadingAPI.ready() sent.');
    }
  }

  public notifyGameplayStart(): void {
    this.sdk?.features.GameplayAPI?.start();
  }

  public notifyGameplayStop(): void {
    this.sdk?.features.GameplayAPI?.stop();
  }

  /**
   * Shows a full-screen interstitial ad with safety cooldown and audio pause.
   */
  public showFullscreenAd(options?: {
    onClose?: () => void;
    onError?: () => void;
  }): void {
    if (!this.sdk) {
      options?.onClose?.();
      return;
    }

    const now = Date.now();
    if (now - this.lastAdTime < this.adCooldownMs) {
      options?.onClose?.();
      return;
    }

    this.wasMutedBeforeAd = isMuted();
    setMuted(true);
    this.notifyGameplayStop();

    const restoreAudioAndResume = () => {
      if (!this.wasMutedBeforeAd) {
        setMuted(false);
      }
      this.notifyGameplayStart();
      this.lastAdTime = Date.now();
    };

    try {
      this.sdk.adv.showFullscreenAdv({
        callbacks: {
          onOpen: () => {
            console.log('[PlayhopSDK] Interstitial ad opened.');
          },
          onClose: () => {
            restoreAudioAndResume();
            options?.onClose?.();
          },
          onError: (err) => {
            console.warn('[PlayhopSDK] Interstitial ad error:', err);
            restoreAudioAndResume();
            options?.onError?.();
          },
          onOffline: () => {
            restoreAudioAndResume();
            options?.onClose?.();
          },
        },
      });
    } catch (err) {
      console.warn('[PlayhopSDK] Failed to trigger ad:', err);
      restoreAudioAndResume();
      options?.onClose?.();
    }
  }
}

export const playhop = new PlayhopService();
