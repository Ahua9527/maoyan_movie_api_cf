// Cloudflare Workers 版本的猫眼电影票房爬虫（简化版）

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 只保留单个电影查询路由
    if (url.pathname.startsWith('/api/movie/')) {
      const movieId = url.pathname.split('/').pop();
      return handleSingleMovieRequest(movieId, env);
    } 
    
    // 返回简化的使用说明
    return new Response(JSON.stringify({
      message: "Maoyan Movie Box Office API (简化版)",
      endpoints: {
        "/api/movie/:id": "获取单个电影数据"
      }
    }, null, 2), {
      headers: { 
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};

// 处理单个电影请求
async function handleSingleMovieRequest(movieId, env) {
  try {
    const result = await fetchMovieData(movieId, null, env);
    return new Response(JSON.stringify(result, null, 2), {
      headers: { 
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// 获取单个电影数据
async function fetchMovieData(movieId, index, env) {
  try {
    // 检查缓存
    const cacheKey = `movie:${movieId}`;
    const cached = await env.MOVIE_CACHE?.get(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      if (index !== null) data.index = index;
      return data;
    }
    
    // 尝试多个URL来获取数据
    const urls = [
      `https://piaofang.maoyan.com/movie/${movieId}`,
      `https://m.maoyan.com/cinema/movie/${movieId}`, // 移动端URL
      `https://maoyan.com/films/${movieId}` // 主站URL
    ];
    
    let movieData = null;
    let lastError = null;
    
    for (const url of urls) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Referer': 'https://piaofang.maoyan.com/'
          }
        });
        
        if (response.ok) {
          const html = await response.text();
          movieData = parseMovieData(html, movieId);
          
          // 如果主要数据获取成功，尝试获取更多信息
          if (movieData.movieName && movieData.movieName !== '未知电影') {
            // 尝试从API获取票房数据
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
      throw lastError || new Error('从所有数据源获取电影数据失败');
    }
    
    // 添加索引
    if (index !== null) {
      movieData.index = index;
    }
    
    // 缓存单个电影数据
    if (env.MOVIE_CACHE && movieData.movieName) {
      await env.MOVIE_CACHE.put(cacheKey, JSON.stringify(movieData), {
        expirationTtl: 3600 // 缓存1小时
      });
    }
    
    return movieData;
    
  } catch (error) {
    console.error(`获取电影 ${movieId} 数据时出错:`, error);
    return {
      movieId,
      index: index || null,
      error: error.message,
      hasData: false
    };
  }
}

// 尝试从API获取票房数据
async function fetchBoxOfficeFromAPI(movieId, env) {
  try {
    // 尝试调用猫眼的API接口
    const apiUrl = `https://piaofang.maoyan.com/second-box?movieId=${movieId}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': `https://piaofang.maoyan.com/movie/${movieId}`,
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.data) {
        return {
          boxOffice: data.data.sumBoxDesc || data.data.totalBoxDesc || '未找到票房数据',
          realtimeBoxOffice: data.data.boxDesc || '',
          boxOfficeUnit: data.data.boxUnit || ''
        };
      }
    }
  } catch (error) {
    console.error('从API获取票房数据时出错:', error);
  }
  
  return null;
}

// 解析电影数据
function parseMovieData(html, movieId) {
  try {
    // 1. 尝试从script标签中提取JSON数据
    const scriptMatch = html.match(/<script[^>]*>[\s\S]*?(\{[^{}]*"movieId"[^{}]*\})[^<]*<\/script>/);
    
    if (scriptMatch) {
      try {
        // 尝试找到更完整的JSON对象
        const jsonMatch = scriptMatch[0].match(/\{[^{}]*"movieId":\s*\d+[^{}]*"movieName":[^{}]*\}/);
        if (jsonMatch) {
          const jsonString = jsonMatch[0];
          const data = JSON.parse(jsonString);
          
          if (data.movieId && data.movieName) {
            // 提取票房数据
            const boxOffice = extractBoxOffice(html);
            const boxOfficeDetails = extractBoxOfficeDetails(html);
            
            return {
              movieId: String(data.movieId),
              movieName: data.movieName,
              movieEnName: data.movieEnName || '',
              movieImg: data.movieImg || '',
              director: data.director || extractDirector(html),
              boxOffice: boxOffice || '未上映',
              category: data.category || '',
              releaseDate: data.releaseDate || extractReleaseDate(html),
              hasData: true,
              ...boxOfficeDetails
            };
          }
        }
      } catch (e) {
        console.error('JSON解析错误:', e);
      }
    }
    
    // 2. 使用正则表达式提取数据
    const movieName = extractByRegex(html, /<h1[^>]*class="[^"]*navBarTitle[^"]*"[^>]*>([^<]+)<\/h1>/) ||
                     extractByRegex(html, /<h1[^>]*class="[^"]*movie-name[^"]*"[^>]*>([^<]+)<\/h1>/) ||
                     extractByRegex(html, /<h1[^>]*class="[^"]*name[^"]*"[^>]*>([^<]+)<\/h1>/) ||
                     extractByRegex(html, /<span[^>]*class="[^"]*info-title-content[^"]*"[^>]*>([^<]+)<\/span>/) ||
                     extractByRegex(html, /<div[^>]*class="[^"]*movie-brief-container[^"]*"[^>]*>[\s\S]*?<h1[^>]*>([^<]+)<\/h1>/) ||
                     extractByRegex(html, /<title>([^<\-]+)/) ||
                     '未知电影';
    
    const director = extractDirector(html);
    const releaseDate = extractReleaseDate(html);
    const boxOffice = extractBoxOffice(html);
    const boxOfficeDetails = extractBoxOfficeDetails(html);
    const movieImg = extractByRegex(html, /<meta[^>]*property="og:image"[^>]*content="([^"]+)"/) || 
                    extractByRegex(html, /<img[^>]*class="[^"]*avatar[^"]*"[^>]*src="([^"]+)"/) || 
                    extractByRegex(html, /<img[^>]*src="([^"]+)"[^>]*alt="[^"]*"[^>]*class="need-handle-pic"/) || '';
    
    return {
      movieId,
      movieName: movieName.trim(),
      movieEnName: '',
      movieImg,
      director,
      boxOffice: boxOffice || '未找到票房数据',
      category: '',
      releaseDate: releaseDate || '未找到上映日期',
      hasData: !!movieName && movieName !== '未知电影',
      ...boxOfficeDetails
    };
    
  } catch (error) {
    console.error('解析错误:', error);
    return {
      movieId,
      error: error.message,
      hasData: false
    };
  }
}

// 提取导演信息
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
  return '未知';
}

// 提取上映日期
function extractReleaseDate(html) {
  const patterns = [
    /"releaseDate"\s*:\s*"([^"]+)"/,
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const rawDate = match[1].trim();
      if (!rawDate) continue; // 跳过空值
      
      // 尝试匹配标准日期格式
      const dateMatch = rawDate.match(/(\d{4}-\d{2}-\d{2})|(\d{4}\/\d{2}\/\d{2})/);
      if (dateMatch) return dateMatch[0]; // 返回标准格式日期
      
      // 转换常见中文日期格式
      return formatDate(rawDate) || rawDate;
    }
  }
  return '未知';
}

// 上映日期格式化工具函数
function formatDate(raw) {
  // 处理中文日期格式：2023年05月20日
  const cnMatch = raw.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (cnMatch) {
    const [, year, month, day] = cnMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // 处理英文日期格式：March 8, 2024
  const enMatch = raw.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})/i);
  if (enMatch) {
    const [, month, day, year] = enMatch;
    const monthMap = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
    };
    return `${year}-${monthMap[month.toLowerCase().substring(0, 3)]}-${day.padStart(2, '0')}`;
  }
  
  return null; // 无法识别的格式
}

// 提取票房数据
function extractBoxOffice(html) {
  // 查找累计票房的多种模式
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
        // 有数字和单位分开的情况
        return `${match[1].trim()}${match[2].trim()}`;
      } else if (match[1]) {
        // 数字和单位在一起的情况
        return match[1].trim();
      }
    }
  }
  
  // 尝试查找任何包含票房相关数据的内容
  const boxOfficeSection = html.match(/累计票房[\s\S]{0,300}?([0-9.]+)\s*([万亿])/);
  if (boxOfficeSection && boxOfficeSection[1] && boxOfficeSection[2]) {
    return `${boxOfficeSection[1]}${boxOfficeSection[2]}`;
  }
  
  return null;
}

// 提取其他票房数据
function extractBoxOfficeDetails(html) {
  const details = {};
  return details;
}

// 通用正则提取函数
function extractByRegex(html, regex) {
  const match = html.match(regex);
  return match ? match[1] : null;
}
