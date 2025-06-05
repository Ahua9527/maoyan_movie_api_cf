export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS 处理
    if (request.method === 'OPTIONS') {
      return createResponse(null, {}, 200);
    }
    
    // 路由处理
    if (url.pathname.startsWith('/api/movie/')) {
      const movieId = url.pathname.split('/').pop();
      return handleMovieRequest(movieId, env);
    }
    
    // 默认首页
    return createResponse({
      message: "🎬 猫眼电影数据API - v1.0.0",
      status: "🚀 生产就绪",
      endpoints: {
        "/api/movie/:id": "获取完整电影数据",
        "/api/status": "API服务状态"
      },
      examples: {
        movie: "/api/movie/1413252"
      }
    });
  }
};

// 统一响应创建函数
function createResponse(data, headers = {}, status = 200) {
  const defaultHeaders = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  
  return new Response(
    data ? JSON.stringify(data, null, 2) : null,
    { status, headers: { ...defaultHeaders, ...headers } }
  );
}

// 主要的电影请求处理
async function handleMovieRequest(movieId, env) {
  const cacheKey = `movie:${movieId}:v1.0.0`;
  
  // 检查缓存
  const cached = await env.MOVIE_CACHE?.get(cacheKey);
  if (cached) {
    const data = JSON.parse(cached);
    data._meta.fromCache = true;
    data._meta.cacheTime = new Date().toISOString();
    return createResponse(data);
  }
  
  try {
    console.log(`🚀 开始获取电影 ${movieId} 完整数据`);
    const startTime = Date.now();
    
    // 并行获取数据
    const [boxOfficeData, apiData] = await Promise.all([
      fetchBoxOfficeData(movieId),
      fetchApiData(movieId)
    ]);
    
    // 构建响应数据
    const movieData = buildMovieData(boxOfficeData, apiData, movieId);
    movieData._meta = {
      requestTime: getUTC8Time(),
      dataType: 'complete',
      version: '1.0.0',
      fromCache: false,
      processingTime: Date.now() - startTime,
      dataSources: ['piaofang.maoyan.com', 'api.maoyan.com'],
      success: true
    };
    
    // 缓存数据
    if (env.MOVIE_CACHE && movieData.basic?.movieName && movieData.basic.movieName !== '未知电影') {
      await env.MOVIE_CACHE.put(cacheKey, JSON.stringify(movieData), { expirationTtl: 1800 });
      console.log(`✅ 数据已缓存，TTL: 1800秒`);
    }
    
    return createResponse(movieData);
    
  } catch (error) {
    console.error(`❌ 获取电影数据失败:`, error);
    return createResponse({
      success: false,
      error: error.message,
      movieId: movieId,
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    }, {}, 500);
  }
}

// 获取票房数据
async function fetchBoxOfficeData(movieId) {
  const response = await fetch(`https://piaofang.maoyan.com/movie/${movieId}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Referer': 'https://piaofang.maoyan.com/'
    }
  });
  
  if (!response.ok) {
    throw new Error(`票房数据获取失败: HTTP ${response.status}`);
  }
  
  const html = await response.text();
  console.log(`✅ 票房数据获取成功，长度: ${html.length}`);
  return html;
}

// 获取API数据
async function fetchApiData(movieId) {
  const response = await fetch(`https://api.maoyan.com/mmdb/movie/v3/${movieId}.json`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'zh-CN,zh;q=0.9',
      'Referer': 'https://www.maoyan.com/',
      'X-Requested-With': 'XMLHttpRequest'
    }
  });
  
  if (!response.ok) {
    throw new Error(`API数据获取失败: HTTP ${response.status}`);
  }
  
  const data = await response.json();
  console.log(`✅ API数据获取成功`);
  return data;
}

// 构建电影数据
function buildMovieData(boxOfficeHtml, apiData, movieId) {
  const result = { movieId };
  
  // 基础信息
  result.basic = extractBasicInfo(boxOfficeHtml, apiData, movieId);
  
  // 评分数据
  result.rating = {
    MaoYanRating: extract(boxOfficeHtml, /<span class="rating-num">([\d.]+)<\/span>/, 1),
    IMDBRating: extract(boxOfficeHtml, /IMDb\s+([\d.]+)/, 1)
  };
  
  // 剧情简介
  result.plot = {
    summary: apiData?.data?.movie?.dra || null,
    ...(apiData ? {} : { error: 'API数据获取失败' })
  };
  
  // 演职人员和奖项（受限）
  result.castCrew = {
    actors: [],
    note: '受数据源限制，演员详细信息暂不可用',
    limitation: '已测试多个API接口，均返回404错误'
  };
  
  result.awards = {
    list: [],
    note: '受数据源限制，奖项信息暂不可用',
    limitation: '已测试多个API接口，均返回404错误'
  };
  
  return result;
}

// 提取基础信息
function extractBasicInfo(html, apiData, movieId) {
  // 从票房页面提取基础信息
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
  
  // 如果有API数据，进行补充和覆盖
  if (apiData?.data?.movie) {
    const movie = apiData.data.movie;
    return {
      ...boxOfficeInfo,
      movieId: String(movie.id || movieId),
      movieName: movie.nm || boxOfficeInfo.movieName || '未知电影',
      movieEnName: movie.enm || boxOfficeInfo.movieEnName || '',
      movieImg: formatImageUrl(movie.img || boxOfficeInfo.movieImg || ''),
      category: movie.cat || boxOfficeInfo.category || '未知类型',
      releaseDate: movie.rt ? movie.rt.split(' ')[0] : boxOfficeInfo.releaseDate || '未知日期',
      duration: movie.dur ? `${movie.dur}分钟` : extract(html, /(\d+分钟)/, 1),
      region: movie.src || extract(html, /(中国大陆|美国|日本|韩国|英国|法国)/, 1) || '未知地区'
    };
  }
  
  return boxOfficeInfo;
}

// 通用提取函数
function extract(html, regex, groupIndex = 1) {
  if (!html || !regex) return null;
  const match = html.match(regex);
  return match && match[groupIndex] ? match[groupIndex].trim() : null;
}

// 提取票房数据
function extractBoxOffice(html) {
  const patterns = [
    /累计票房\s*<\/p>\s*<p[^>]*>\s*<span[^>]*class="[^"]*detail-num[^"]*"[^>]*>([\d.,]+)<\/span>[\s\S]*?<span[^>]*class="[^"]*detail-unit[^"]*"[^>]*>([^<]+)<\/span>/i,
    /累计票房[\s\S]*?detail-num[^>]*>([\d.,]+)<\/span>[\s\S]*?detail-unit[^>]*>([^<]+)<\/span>/i,
    /累计票房[\s\S]*?([\d.,]+)[\s\S]*?([万亿]元?)/i
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match.length >= 3 && match[2]) {
      const value = match[1].replace(/[,，]/g, '');
      const unit = match[2].trim();
      return `${value}${unit}`;
    }
  }
  
  return '未找到票房数据';
}

// 格式化图片URL
function formatImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('//')) return 'https:' + url;
  if (url.startsWith('/')) return 'https://piaofang.maoyan.com' + url;
  return url;
}

// 获取UTC+8时间
function getUTC8Time() {
  const now = new Date();
  const utc8Time = new Date(now.getTime() + (8 * 60 * 60 * 1000));
  return utc8Time.toISOString().replace('Z', ' UTC+8');
}