import React, { useEffect, useMemo, useState } from "react";

const INSTALL_COMPLETED_STORAGE_KEY = "noxa_install_prompt_installed";

const isStandaloneMode = () => {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.navigator?.standalone === true
  );
};

const isIosSafari = () => {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent || "";
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
  return isIOS && isSafari;
};

const isInstallCompleted = () => {
  if (typeof window === "undefined") return false;
  if (isStandaloneMode()) return true;
  return window.localStorage.getItem(INSTALL_COMPLETED_STORAGE_KEY) === "true";
};

const saveInstalled = () => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(INSTALL_COMPLETED_STORAGE_KEY, "true");
};

const InstallPrompt = () => {
  const showIosHint = useMemo(
    () => isIosSafari() && !isStandaloneMode(),
    []
  );
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(() => showIosHint && !isInstallCompleted());

  useEffect(() => {
    if (isInstallCompleted()) return;

    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      if (!isInstallCompleted()) {
        setVisible(true);
      }
    };

    const onAppInstalled = () => {
      saveInstalled();
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, [showIosHint]);

  if (!visible || isInstallCompleted()) return null;

  const closePrompt = () => {
    setVisible(false);
  };

  const installApp = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);

    if (choice?.outcome === "accepted") {
      saveInstalled();
      setVisible(false);
      return;
    }

    setVisible(false);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-4 md:right-4 md:max-w-sm z-[120]">
      <div className="rounded-xl border border-teal-200 bg-white shadow-lg p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">Install Noxa</p>
            <p className="text-xs text-gray-600 mt-1">
              {showIosHint
                ? 'In Safari, tap Share then "Add to Home Screen".'
                : "Add Noxa to your home screen for faster access and mobile push alerts."}
            </p>
          </div>
          <button
            type="button"
            onClick={closePrompt}
            className="text-gray-500 hover:text-gray-700 text-sm"
            aria-label="Close install prompt"
          >
            x
          </button>
        </div>

        {!showIosHint && deferredPrompt && (
          <button
            type="button"
            onClick={installApp}
            className="mt-3 w-full rounded-lg bg-[#3d9b9b] text-white py-2 text-sm font-medium hover:bg-[#2f8686] transition-colors"
          >
            Install App
          </button>
        )}
      </div>
    </div>
  );
};

export default InstallPrompt;
