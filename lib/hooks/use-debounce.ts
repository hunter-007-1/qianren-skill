import { useState, useEffect, useRef, useCallback } from "react";

/**
 * 防抖 Hook
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * 防抖函数 Hook
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * 节流 Hook
 */
export function useThrottle<T>(value: T, limit: number = 300): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();
    
    if (now - lastRan.current >= limit) {
      setThrottledValue(value);
      lastRan.current = now;
    }
  }, [value, limit]);

  return throttledValue;
}

/**
 * 文件上传进度 Hook
 */
export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFiles = useCallback(
    async (
      url: string,
      files: File[],
      additionalData?: Record<string, string>
    ): Promise<{ success: boolean; data?: any; error?: string }> => {
      setUploading(true);
      setProgress(0);

      try {
        const formData = new FormData();
        
        files.forEach((file) => {
          formData.append("files", file);
        });

        if (additionalData) {
          Object.entries(additionalData).forEach(([key, value]) => {
            formData.append(key, value);
          });
        }

        // 模拟进度（实际项目中可以用 XMLHttpRequest）
        const progressInterval = setInterval(() => {
          setProgress((prev) => Math.min(prev + 10, 90));
        }, 100);

        const response = await fetch(url, {
          method: "POST",
          body: formData,
        });

        clearInterval(progressInterval);
        setProgress(100);

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "上传失败");
        }

        return { success: true, data };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "上传失败",
        };
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    []
  );

  return { uploading, progress, uploadFiles };
}