import { isMuted, setMuted } from './audio';

export interface YandexSDK {
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
}

declare global {
  interface Window {
    YaGames?: {
      init: (options?: unknown) => Promise<YandexSDK>;
    };
    ysdk?: YandexSDK;
  }
}

class YandexService {
  private ysdk: YandexSDK | null = null;
  private isInitialized = false;
  private lastAdTime = 0;
  private adCooldownMs = 65000; // 65 seconds cooldown between interstitial ads
  private wasMutedBeforeAd = false;
  private wasMutedBeforeBlur = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Automatic sound mute on window blur / tab switch (Mandatory for Yandex Games)
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.wasMutedBeforeBlur = isMuted();
          setMuted(true);
          this.ysdk?.features.GameplayAPI?.stop();
        } else {
          if (!this.wasMutedBeforeBlur) {
            setMuted(false);
          }
          this.ysdk?.features.GameplayAPI?.start();
        }
      });
    }
  }

  public async init(): Promise<YandexSDK | null> {
    if (this.isInitialized) return this.ysdk;
    if (typeof window === 'undefined' || !window.YaGames) {
      console.log('[YandexSDK] Not running in Yandex Games environment.');
      return null;
    }

    try {
      this.ysdk = await window.YaGames.init();
      window.ysdk = this.ysdk;
      this.isInitialized = true;
      console.log('[YandexSDK] Initialized successfully.');

      // Notify Yandex that the game is loaded and ready
      this.notifyGameReady();
      return this.ysdk;
    } catch (err) {
      console.warn('[YandexSDK] Init error:', err);
      return null;
    }
  }

  public notifyGameReady(): void {
    if (this.ysdk?.features.LoadingAPI?.ready) {
      this.ysdk.features.LoadingAPI.ready();
      console.log('[YandexSDK] LoadingAPI.ready() sent.');
    }
  }

  public notifyGameplayStart(): void {
    this.ysdk?.features.GameplayAPI?.start();
  }

  public notifyGameplayStop(): void {
    this.ysdk?.features.GameplayAPI?.stop();
  }

  /**
   * Shows a full-screen interstitial ad with safety cooldown and audio pause.
   */
  public showFullscreenAd(options?: {
    onClose?: () => void;
    onError?: () => void;
  }): void {
    if (!this.ysdk) {
      options?.onClose?.();
      return;
    }

    const now = Date.now();
    if (now - this.lastAdTime < this.adCooldownMs) {
      // Cooldown active, skip ad silently
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
      this.ysdk.adv.showFullscreenAdv({
        callbacks: {
          onOpen: () => {
            console.log('[YandexSDK] Interstitial ad opened.');
          },
          onClose: () => {
            restoreAudioAndResume();
            options?.onClose?.();
          },
          onError: (err) => {
            console.warn('[YandexSDK] Interstitial ad error:', err);
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
      console.warn('[YandexSDK] Failed to trigger ad:', err);
      restoreAudioAndResume();
      options?.onClose?.();
    }
  }
}

export const yandex = new YandexService();
