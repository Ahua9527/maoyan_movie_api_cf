var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-BPILNh/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// src/index.js
var src_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/movie/")) {
      const movieId = url.pathname.split("/").pop();
      return handleSingleMovieRequest(movieId, env);
    }
    return new Response(JSON.stringify({
      message: "Maoyan Movie Box Office API (\u7B80\u5316\u7248)",
      endpoints: {
        "/api/movie/:id": "\u83B7\u53D6\u5355\u4E2A\u7535\u5F71\u6570\u636E"
      }
    }, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
};
async function handleSingleMovieRequest(movieId, env) {
  try {
    const result = await fetchMovieData(movieId, null, env);
    return new Response(JSON.stringify(result, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}
__name(handleSingleMovieRequest, "handleSingleMovieRequest");
async function fetchMovieData(movieId, index, env) {
  try {
    const cacheKey = `movie:${movieId}`;
    const cached = await env.MOVIE_CACHE?.get(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      if (index !== null) data.index = index;
      return data;
    }
    const urls = [
      `https://piaofang.maoyan.com/movie/${movieId}`,
      `https://m.maoyan.com/cinema/movie/${movieId}`,
      // 移动端URL
      `https://maoyan.com/films/${movieId}`
      // 主站URL
    ];
    let movieData = null;
    let lastError = null;
    for (const url of urls) {
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
            "Referer": "https://piaofang.maoyan.com/"
          }
        });
        if (response.ok) {
          const html = await response.text();
          movieData = parseMovieData(html, movieId);
          if (movieData.movieName && movieData.movieName !== "\u672A\u77E5\u7535\u5F71") {
            const boxOfficeData = await fetchBoxOfficeFromAPI(movieId, env);
            if (boxOfficeData) {
              movieData = { ...movieData, ...boxOfficeData };
            }
            break;
          }
        }
      } catch (error) {
        lastError = error;
        console.error(`Error fetching from ${url}:`, error.message);
      }
    }
    if (!movieData) {
      throw lastError || new Error("\u4ECE\u6240\u6709\u6570\u636E\u6E90\u83B7\u53D6\u7535\u5F71\u6570\u636E\u5931\u8D25");
    }
    if (index !== null) {
      movieData.index = index;
    }
    if (env.MOVIE_CACHE && movieData.movieName) {
      await env.MOVIE_CACHE.put(cacheKey, JSON.stringify(movieData), {
        expirationTtl: 3600
        // 缓存1小时
      });
    }
    return movieData;
  } catch (error) {
    console.error(`\u83B7\u53D6\u7535\u5F71 ${movieId} \u6570\u636E\u65F6\u51FA\u9519:`, error);
    return {
      movieId,
      index: index || null,
      error: error.message,
      hasData: false
    };
  }
}
__name(fetchMovieData, "fetchMovieData");
async function fetchBoxOfficeFromAPI(movieId, env) {
  try {
    const apiUrl = `https://piaofang.maoyan.com/second-box?movieId=${movieId}`;
    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Referer": `https://piaofang.maoyan.com/movie/${movieId}`,
        "X-Requested-With": "XMLHttpRequest"
      }
    });
    if (response.ok) {
      const data = await response.json();
      if (data && data.data) {
        return {
          boxOffice: data.data.sumBoxDesc || data.data.totalBoxDesc || "\u672A\u627E\u5230\u7968\u623F\u6570\u636E",
          realtimeBoxOffice: data.data.boxDesc || "",
          boxOfficeUnit: data.data.boxUnit || ""
        };
      }
    }
  } catch (error) {
    console.error("\u4ECEAPI\u83B7\u53D6\u7968\u623F\u6570\u636E\u65F6\u51FA\u9519:", error);
  }
  return null;
}
__name(fetchBoxOfficeFromAPI, "fetchBoxOfficeFromAPI");
function parseMovieData(html, movieId) {
  try {
    const scriptMatch = html.match(/<script[^>]*>[\s\S]*?(\{[^{}]*"movieId"[^{}]*\})[^<]*<\/script>/);
    if (scriptMatch) {
      try {
        const jsonMatch = scriptMatch[0].match(/\{[^{}]*"movieId":\s*\d+[^{}]*"movieName":[^{}]*\}/);
        if (jsonMatch) {
          const jsonString = jsonMatch[0];
          const data = JSON.parse(jsonString);
          if (data.movieId && data.movieName) {
            const boxOffice2 = extractBoxOffice(html);
            const boxOfficeDetails2 = extractBoxOfficeDetails(html);
            return {
              movieId: String(data.movieId),
              movieName: data.movieName,
              movieEnName: data.movieEnName || "",
              movieImg: data.movieImg || "",
              director: data.director || extractDirector(html),
              boxOffice: boxOffice2 || "\u672A\u4E0A\u6620",
              category: data.category || "",
              releaseDate: data.releaseDate || extractReleaseDate(html),
              hasData: true,
              ...boxOfficeDetails2
            };
          }
        }
      } catch (e) {
        console.error("JSON\u89E3\u6790\u9519\u8BEF:", e);
      }
    }
    const movieName = extractByRegex(html, /<h1[^>]*class="[^"]*navBarTitle[^"]*"[^>]*>([^<]+)<\/h1>/) || extractByRegex(html, /<h1[^>]*class="[^"]*movie-name[^"]*"[^>]*>([^<]+)<\/h1>/) || extractByRegex(html, /<h1[^>]*class="[^"]*name[^"]*"[^>]*>([^<]+)<\/h1>/) || extractByRegex(html, /<span[^>]*class="[^"]*info-title-content[^"]*"[^>]*>([^<]+)<\/span>/) || extractByRegex(html, /<div[^>]*class="[^"]*movie-brief-container[^"]*"[^>]*>[\s\S]*?<h1[^>]*>([^<]+)<\/h1>/) || extractByRegex(html, /<title>([^<\-]+)/) || "\u672A\u77E5\u7535\u5F71";
    const director = extractDirector(html);
    const releaseDate = extractReleaseDate(html);
    const boxOffice = extractBoxOffice(html);
    const boxOfficeDetails = extractBoxOfficeDetails(html);
    const movieImg = extractByRegex(html, /<meta[^>]*property="og:image"[^>]*content="([^"]+)"/) || extractByRegex(html, /<img[^>]*class="[^"]*avatar[^"]*"[^>]*src="([^"]+)"/) || extractByRegex(html, /<img[^>]*src="([^"]+)"[^>]*alt="[^"]*"[^>]*class="need-handle-pic"/) || "";
    return {
      movieId,
      movieName: movieName.trim(),
      movieEnName: "",
      movieImg,
      director,
      boxOffice: boxOffice || "\u672A\u627E\u5230\u7968\u623F\u6570\u636E",
      category: "",
      releaseDate: releaseDate || "\u672A\u627E\u5230\u4E0A\u6620\u65E5\u671F",
      hasData: !!movieName && movieName !== "\u672A\u77E5\u7535\u5F71",
      ...boxOfficeDetails
    };
  } catch (error) {
    console.error("\u89E3\u6790\u9519\u8BEF:", error);
    return {
      movieId,
      error: error.message,
      hasData: false
    };
  }
}
__name(parseMovieData, "parseMovieData");
function extractDirector(html) {
  const patterns = [
    /导演[：:]\s*([^<\n]+)/,
    /导演<\/[^>]+>\s*<[^>]+>([^<]+)/,
    /"director"\s*:\s*"([^"]+)"/
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return "\u672A\u77E5";
}
__name(extractDirector, "extractDirector");
function extractReleaseDate(html) {
  const patterns = [
    /"releaseDate"\s*:\s*"([^"]+)"/
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const rawDate = match[1].trim();
      if (!rawDate) continue;
      const dateMatch = rawDate.match(/(\d{4}-\d{2}-\d{2})|(\d{4}\/\d{2}\/\d{2})/);
      if (dateMatch) return dateMatch[0];
      return formatDate(rawDate) || rawDate;
    }
  }
  return "\u672A\u77E5";
}
__name(extractReleaseDate, "extractReleaseDate");
function formatDate(raw) {
  const cnMatch = raw.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (cnMatch) {
    const [, year, month, day] = cnMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  const enMatch = raw.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})/i);
  if (enMatch) {
    const [, month, day, year] = enMatch;
    const monthMap = {
      jan: "01",
      feb: "02",
      mar: "03",
      apr: "04",
      may: "05",
      jun: "06",
      jul: "07",
      aug: "08",
      sep: "09",
      oct: "10",
      nov: "11",
      dec: "12"
    };
    return `${year}-${monthMap[month.toLowerCase().substring(0, 3)]}-${day.padStart(2, "0")}`;
  }
  return null;
}
__name(formatDate, "formatDate");
function extractBoxOffice(html) {
  const patterns = [
    /累计票房[\s\S]*?<\/p>\s*<p[^>]*class="info-detail-content"[^>]*>\s*<span[^>]*class="detail-num"[^>]*>([^<]+)<\/span>[\s\S]*?<span[^>]*class="detail-unit"[^>]*>([^<]+)<\/span>/,
    /累计票房[\s\S]{0,100}?detail-num[^>]*>([^<]+)<\/span>[\s\S]{0,50}?detail-unit[^>]*>([^<]+)<\/span>/,
    /累计票房[\s\S]{0,200}?<span[^>]*>([0-9.]+)<\/span>[\s\S]{0,50}?<span[^>]*>([万亿]+)<\/span>/,
    /<p[^>]*>累计票房[\s\S]*?<\/p>[\s\S]{0,100}?<span[^>]*>([0-9.]+)<\/span>[\s<!--]*?<span[^>]*>([万亿]+)<\/span>/,
    /累计票房[^<]*<[^>]*class="[^"]*detail-num[^"]*"[^>]*>([^<]+)<\/[^>]+>\s*<[^>]*class="[^"]*detail-unit[^"]*"[^>]*>([^<]+)/,
    /累计票房[^<]*<[^>]*class="[^"]*info-detail-content[^"]*"[^>]*>[\s\S]*?<[^>]*>([^<]+)<\/[^>]+>\s*<[^>]*>([^<]+)/,
    /累计票房[\s\S]*?detail-num">([^<]+)<\/span><!--[\s\S]*?-->[\s]*<span[^>]*detail-unit">([^<]+)<\/span>/,
    /"boxOffice"\s*:\s*"([^"]+)"/,
    /"totalBoxOffice"\s*:\s*"([^"]+)"/
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      if (match[2]) {
        return `${match[1].trim()}${match[2].trim()}`;
      } else if (match[1]) {
        return match[1].trim();
      }
    }
  }
  const boxOfficeSection = html.match(/累计票房[\s\S]{0,300}?([0-9.]+)\s*([万亿])/);
  if (boxOfficeSection && boxOfficeSection[1] && boxOfficeSection[2]) {
    return `${boxOfficeSection[1]}${boxOfficeSection[2]}`;
  }
  return null;
}
__name(extractBoxOffice, "extractBoxOffice");
function extractBoxOfficeDetails(html) {
  const details = {};
  return details;
}
__name(extractBoxOfficeDetails, "extractBoxOfficeDetails");
function extractByRegex(html, regex) {
  const match = html.match(regex);
  return match ? match[1] : null;
}
__name(extractByRegex, "extractByRegex");

// ../../../opt/homebrew/lib/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../opt/homebrew/lib/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-BPILNh/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../../../opt/homebrew/lib/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-BPILNh/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
