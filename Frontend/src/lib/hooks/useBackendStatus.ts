"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import { HealthResponse, InferenceStatusResponse } from "@/types/backend";

export interface BackendStatusState {
  isOnline: boolean;
  isLoading: boolean;
  latencyMs: number | null;
  health: HealthResponse | null;
  inferenceStatus: InferenceStatusResponse | null;
  loadedModels: string[];
  activeSlots: number;
  maxSlots: number;
  error: string | null;
}

export function useBackendStatus(pollIntervalMs: number = 8000) {
  const [state, setState] = useState<BackendStatusState>({
    isOnline: false,
    isLoading: true,
    latencyMs: null,
    health: null,
    inferenceStatus: null,
    loadedModels: [],
    activeSlots: 0,
    maxSlots: 2,
    error: null,
  });

  const isMounted = useRef(true);

  const checkStatus = useCallback(async () => {
    const startTime = performance.now();
    try {
      const healthData = await api.getHealth();
      const latency = Math.round(performance.now() - startTime);

      let inferenceData: InferenceStatusResponse | null = null;
      let loadedModelsList: string[] = [];

      try {
        inferenceData = await api.getInferenceStatus();
        const modelsDict = inferenceData.models?.models || {};
        loadedModelsList =
          inferenceData.models?.loaded_models?.length
            ? inferenceData.models.loaded_models
            : Object.keys(modelsDict);
      } catch {
        // inference status optional fallback
      }

      if (!isMounted.current) return;

      setState({
        isOnline: true,
        isLoading: false,
        latencyMs: latency,
        health: healthData,
        inferenceStatus: inferenceData,
        loadedModels: loadedModelsList,
        activeSlots: inferenceData?.resource_manager?.active_inference ?? 0,
        maxSlots: inferenceData?.resource_manager?.max_concurrent_inference ?? 2,
        error: null,
      });
    } catch (err: unknown) {
      if (!isMounted.current) return;
      const message = err instanceof Error ? err.message : "Failed to connect to backend";
      setState((prev) => ({
        ...prev,
        isOnline: false,
        isLoading: false,
        latencyMs: null,
        error: message,
      }));
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    checkStatus();

    if (pollIntervalMs > 0) {
      const interval = setInterval(checkStatus, pollIntervalMs);
      return () => {
        isMounted.current = false;
        clearInterval(interval);
      };
    }

    return () => {
      isMounted.current = false;
    };
  }, [checkStatus, pollIntervalMs]);

  return {
    ...state,
    refetch: checkStatus,
  };
}
