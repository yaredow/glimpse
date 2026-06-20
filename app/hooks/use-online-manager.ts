import { useEffect } from "react";
import { onlineManager } from "@tanstack/react-query";
import * as Network from "expo-network";

export function useOnlineManager() {
  useEffect(() => {
    const unsubscribe = onlineManager.setEventListener((setOnline) => {
      let initialised = false;

      const eventSubscription = Network.addNetworkStateListener((state) => {
        initialised = true;
        setOnline(!!state.isConnected);
      });

      Network.getNetworkStateAsync()
        .then((state) => {
          if (!initialised) {
            setOnline(!!state.isConnected);
          }
        })
        .catch(() => {});

      return eventSubscription.remove;
    });

    return unsubscribe;
  }, []);
}
