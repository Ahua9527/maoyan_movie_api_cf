var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-vIqWoI/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// .wrangler/tmp/bundle-vIqWoI/strip-cf-connecting-ip-header.js
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
    if (request.method === "OPTIONS") {
      return createResponse(null, {}, 200);
    }
    if (url.pathname.startsWith("/api/movie/")) {
      const movieId = url.pathname.split("/").pop();
      return handleMovieRequest(movieId, env);
    }
    return createResponse({
      message: "\u{1F3AC} \u732B\u773C\u7535\u5F71\u6570\u636EAPI - v1.0.0",
      status: "\u{1F680} \u751F\u4EA7\u5C31\u7EEA",
      endpoints: {
        "/api/movie/:id": "\u83B7\u53D6\u5B8C\u6574\u7535\u5F71\u6570\u636E",
        "/api/status": "API\u670D\u52A1\u72B6\u6001"
      },
      examples: {
        movie: "/api/movie/1413252"
      }
    });
  }
};
function createResponse(data, headers = {}, status = 200) {
  const defaultHeaders = {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  return new Response(
    data ? JSON.stringify(data, null, 2) : null,
    { status, headers: { ...defaultHeaders, ...headers } }
  );
}
__name(createResponse, "createResponse");
async function handleMovieRequest(movieId, env) {
  const cacheKey = `movie:${movieId}:v1.0.0`;
  const cached = await env.MOVIE_CACHE?.get(cacheKey);
  if (cached) {
    const data = JSON.parse(cached);
    data._meta.fromCache = true;
    data._meta.cacheTime = (/* @__PURE__ */ new Date()).toISOString();
    return createResponse(data);
  }
  try {
    console.log(`\u{1F680} \u5F00\u59CB\u83B7\u53D6\u7535\u5F71 ${movieId} \u5B8C\u6574\u6570\u636E`);
    const startTime = Date.now();
    const [boxOfficeData, apiData] = await Promise.all([
      fetchBoxOfficeData(movieId),
      fetchApiData(movieId)
    ]);
    const movieData = buildMovieData(boxOfficeData, apiData, movieId);
    movieData._meta = {
      requestTime: getUTC8Time(),
      dataType: "complete",
      version: "1.0.0",
      fromCache: false,
      processingTime: Date.now() - startTime,
      dataSources: ["piaofang.maoyan.com", "api.maoyan.com"],
      success: true
    };
    if (env.MOVIE_CACHE && movieData.basic?.movieName && movieData.basic.movieName !== "\u672A\u77E5\u7535\u5F71") {
      await env.MOVIE_CACHE.put(cacheKey, JSON.stringify(movieData), { expirationTtl: 1800 });
      console.log(`\u2705 \u6570\u636E\u5DF2\u7F13\u5B58\uFF0CTTL: 1800\u79D2`);
    }
    return createResponse(movieData);
  } catch (error) {
    console.error(`\u274C \u83B7\u53D6\u7535\u5F71\u6570\u636E\u5931\u8D25:`, error);
    return createResponse({
      success: false,
      error: error.message,
      movieId,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      version: "1.0.0"
    }, {}, 500);
  }
}
__name(handleMovieRequest, "handleMovieRequest");
async function fetchBoxOfficeData(movieId) {
  const response = await fetch(`https://piaofang.maoyan.com/movie/${movieId}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      "Referer": "https://piaofang.maoyan.com/"
    }
  });
  if (!response.ok) {
    throw new Error(`\u7968\u623F\u6570\u636E\u83B7\u53D6\u5931\u8D25: HTTP ${response.status}`);
  }
  const html = await response.text();
  console.log(`\u2705 \u7968\u623F\u6570\u636E\u83B7\u53D6\u6210\u529F\uFF0C\u957F\u5EA6: ${html.length}`);
  return html;
}
__name(fetchBoxOfficeData, "fetchBoxOfficeData");
async function fetchApiData(movieId) {
  const response = await fetch(`https://api.maoyan.com/mmdb/movie/v3/${movieId}.json`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "zh-CN,zh;q=0.9",
      "Referer": "https://www.maoyan.com/",
      "X-Requested-With": "XMLHttpRequest"
    }
  });
  if (!response.ok) {
    throw new Error(`API\u6570\u636E\u83B7\u53D6\u5931\u8D25: HTTP ${response.status}`);
  }
  const data = await response.json();
  console.log(`\u2705 API\u6570\u636E\u83B7\u53D6\u6210\u529F`);
  return data;
}
__name(fetchApiData, "fetchApiData");
function buildMovieData(boxOfficeHtml, apiData, movieId) {
  const result = { movieId };
  result.basic = extractBasicInfo(boxOfficeHtml, apiData, movieId);
  result.rating = {
    MaoYanRating: extract(boxOfficeHtml, /<span class="rating-num">([\d.]+)<\/span>/, 1),
    IMDBRating: extract(boxOfficeHtml, /IMDb\s+([\d.]+)/, 1)
  };
  result.plot = {
    summary: apiData?.data?.movie?.dra || null,
    ...apiData ? {} : { error: "API\u6570\u636E\u83B7\u53D6\u5931\u8D25" }
  };
  result.castCrew = {
    actors: [],
    note: "\u53D7\u6570\u636E\u6E90\u9650\u5236\uFF0C\u6F14\u5458\u8BE6\u7EC6\u4FE1\u606F\u6682\u4E0D\u53EF\u7528",
    limitation: "\u5DF2\u6D4B\u8BD5\u591A\u4E2AAPI\u63A5\u53E3\uFF0C\u5747\u8FD4\u56DE404\u9519\u8BEF"
  };
  result.awards = {
    list: [],
    note: "\u53D7\u6570\u636E\u6E90\u9650\u5236\uFF0C\u5956\u9879\u4FE1\u606F\u6682\u4E0D\u53EF\u7528",
    limitation: "\u5DF2\u6D4B\u8BD5\u591A\u4E2AAPI\u63A5\u53E3\uFF0C\u5747\u8FD4\u56DE404\u9519\u8BEF"
  };
  return result;
}
__name(buildMovieData, "buildMovieData");
function extractBasicInfo(html, apiData, movieId) {
  const boxOfficeInfo = {
    movieId: String(movieId),
    movieName: extract(html, /<h1[^>]*class="[^"]*(name|movie-name|navBarTitle)[^"]*"[^>]*>([^<]+)<\/h1>/, 2),
    movieEnName: extract(html, /<span class="info-etitle-content">([^<]+)<\/span>/, 1),
    movieImg: formatImageUrl(extract(html, /<img[^>]*src="([^"]+)"[^>]*alt="[^"]*"[^>]*class="need-handle-pic"/, 1)),
    director: extract(html, /"director"\s*:\s*"([^"]+)"/, 1),
    category: extract(html, /<p class="info-category">\s*([^<\s]+)/, 1),
    releaseDate: extract(html, /"releaseDate"\s*:\s*"([^"]+)"/, 1),
    boxOffice: extractBoxOffice(html)
  };
  if (apiData?.data?.movie) {
    const movie = apiData.data.movie;
    return {
      ...boxOfficeInfo,
      movieId: String(movie.id || movieId),
      movieName: movie.nm || boxOfficeInfo.movieName || "\u672A\u77E5\u7535\u5F71",
      movieEnName: movie.enm || boxOfficeInfo.movieEnName || "",
      movieImg: formatImageUrl(movie.img || boxOfficeInfo.movieImg || ""),
      category: movie.cat || boxOfficeInfo.category || "\u672A\u77E5\u7C7B\u578B",
      releaseDate: movie.rt ? movie.rt.split(" ")[0] : boxOfficeInfo.releaseDate || "\u672A\u77E5\u65E5\u671F",
      duration: movie.dur ? `${movie.dur}\u5206\u949F` : extract(html, /(\d+分钟)/, 1),
      region: movie.src || extract(html, /(中国大陆|美国|日本|韩国|英国|法国)/, 1) || "\u672A\u77E5\u5730\u533A"
    };
  }
  return boxOfficeInfo;
}
__name(extractBasicInfo, "extractBasicInfo");
function extract(html, regex, groupIndex = 1) {
  if (!html || !regex) return null;
  const match = html.match(regex);
  return match && match[groupIndex] ? match[groupIndex].trim() : null;
}
__name(extract, "extract");
function extractBoxOffice(html) {
  const patterns = [
    /累计票房\s*<\/p>\s*<p[^>]*>\s*<span[^>]*class="[^"]*detail-num[^"]*"[^>]*>([\d.,]+)<\/span>[\s\S]*?<span[^>]*class="[^"]*detail-unit[^"]*"[^>]*>([^<]+)<\/span>/i,
    /累计票房[\s\S]*?detail-num[^>]*>([\d.,]+)<\/span>[\s\S]*?detail-unit[^>]*>([^<]+)<\/span>/i,
    /累计票房[\s\S]*?([\d.,]+)[\s\S]*?([万亿]元?)/i
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match.length >= 3 && match[2]) {
      const value = match[1].replace(/[,，]/g, "");
      const unit = match[2].trim();
      return `${value}${unit}`;
    }
  }
  return "\u672A\u627E\u5230\u7968\u623F\u6570\u636E";
}
__name(extractBoxOffice, "extractBoxOffice");
function formatImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("//")) return "https:" + url;
  if (url.startsWith("/")) return "https://piaofang.maoyan.com" + url;
  return url;
}
__name(formatImageUrl, "formatImageUrl");
function getUTC8Time() {
  const now = /* @__PURE__ */ new Date();
  const utc8Time = new Date(now.getTime() + 8 * 60 * 60 * 1e3);
  return utc8Time.toISOString().replace("Z", " UTC+8");
}
__name(getUTC8Time, "getUTC8Time");

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

// .wrangler/tmp/bundle-vIqWoI/middleware-insertion-facade.js
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

// .wrangler/tmp/bundle-vIqWoI/middleware-loader.entry.ts
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
