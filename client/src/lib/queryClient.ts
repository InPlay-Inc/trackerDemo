import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    try {
      const contentType = res.headers.get('content-type');
      const responseText = await res.text();
      
      if (contentType?.includes('application/json')) {
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
        } catch (e) {
          errorMessage = responseText;
        }
      } else if (contentType?.includes('text/html')) {
        // Extract error message from HTML if possible
        const preMatch = responseText.match(/<pre>([^]*?)<\/pre>/);
        const bodyMatch = responseText.match(/<body>([^]*?)<\/body>/);
        errorMessage = (preMatch || bodyMatch) ? 
          (preMatch?.[1] || bodyMatch?.[1])?.trim() || 'Server returned an HTML error page' :
          'Server returned an HTML error page';
      } else {
        errorMessage = responseText;
      }
    } catch (e) {
      console.error('Error parsing error response:', e);
    }
    throw new Error(`HTTP ${res.status}: ${errorMessage}`);
  }
}

export async function apiRequest<T = any>(
  options: {
    url: string;
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  }
): Promise<T> {
  const opts: RequestInit = {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "X-Requested-With": "XMLHttpRequest",
      ...options.headers,
    },
    credentials: "include",
  };

  if (options.body) {
    opts.body = JSON.stringify(options.body);
  }

  const url = options.url.startsWith("/") ? options.url : `/${options.url}`;
  
  try {
    console.log('Making API request:', {
      url,
      method: opts.method,
      headers: opts.headers,
      body: opts.body ? JSON.parse(opts.body as string) : undefined
    });

    const res = await fetch(url, opts);
    
    // Log response details for debugging
    console.log('API Response:', {
      url,
      status: res.status,
      statusText: res.statusText,
      headers: Object.fromEntries(res.headers.entries()),
      method: opts.method
    });
    
    // 如果状态码不是2xx，抛出错误
    if (!res.ok) {
      await throwIfResNotOk(res);
      return {} as T; // TypeScript 需要这个返回，但实际上不会执行到这里
    }
    
    const contentType = res.headers.get('content-type');
    if (!contentType) {
      console.warn('No content type in response headers');
      // 尝试解析为 JSON
      try {
        const text = await res.text();
        return JSON.parse(text);
      } catch (e) {
        throw new Error('No content type specified and failed to parse response as JSON');
      }
    }
    
    if (contentType.includes('application/json')) {
      return await res.json();
    }
    
    // 如果不是 JSON，记录响应内容并抛出错误
    const responseText = await res.text();
    console.error('Unexpected response type:', {
      contentType,
      responseText: responseText.substring(0, 200) + '...',
      status: res.status,
      headers: Object.fromEntries(res.headers.entries())
    });
    throw new Error(`Expected JSON response but got ${contentType}`);
  } catch (error) {
    console.error('API request failed:', {
      url,
      method: opts.method,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : String(error)
    });
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
