export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS 处理
    if (request.method === 'OPTIONS') {
      return createResponse(null, {}, 200);
    }
    
    // API 路由处理
    if (url.pathname.startsWith('/api/movie/')) {
      const movieId = url.pathname.split('/').pop();
      return handleMovieRequest(movieId, env);
    }
    
    // API 状态路由
    if (url.pathname === '/api/status') {
      return createResponse({
        status: "🚀 生产就绪",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        endpoints: {
          "/api/movie/:id": "获取完整电影数据",
          "/api/status": "API服务状态"
        }
      });
    }
    
    // 默认返回前端页面
    return createFrontendResponse();
  }
};

// 创建前端页面响应
function createFrontendResponse() {
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>猫眼电影API - 现代化电影信息检索工具</title>
    <meta name="description" content="获取完整的猫眼电影数据，包括票房信息、评分、剧情简介等详细内容">
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { font-family: 'Inter', sans-serif; }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
        .backdrop-blur-lg { backdrop-filter: blur(16px); }
        .backdrop-blur-sm { backdrop-filter: blur(4px); }
        body { margin: 0; padding: 0; }
    </style>
</head>
<body>
    <div id="root"></div>
    
    <script type="text/babel">
        const { useState, useEffect } = React;
        
        // 图标组件
        const IconComponent = ({ d, className = "w-5 h-5" }) => (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
            </svg>
        );
        
        const SearchIcon = (props) => <IconComponent d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" {...props} />;
        const FilmIcon = (props) => <IconComponent d="M7 4V2a1 1 0 011-1h3a1 1 0 011 1v2h4a1 1 0 011 1v14a1 1 0 01-1 1H7a1 1 0 01-1-1V5a1 1 0 011-1zm2 0h6v2H9V4z" {...props} />;
        const StarIcon = (props) => <IconComponent d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" {...props} />;
        const UserIcon = (props) => <IconComponent d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" {...props} />;
        const CalendarIcon = (props) => <IconComponent d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" {...props} />;
        const ClockIcon = (props) => <IconComponent d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" {...props} />;
        const MapPinIcon = (props) => <IconComponent d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" {...props} />;
        const AwardIcon = (props) => <IconComponent d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" {...props} />;
        const CopyIcon = (props) => <IconComponent d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" {...props} />;
        const CheckIcon = (props) => <IconComponent d="M5 13l4 4L19 7" {...props} />;
        const ExternalLinkIcon = (props) => <IconComponent d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" {...props} />;
        const LoaderIcon = ({ className = "w-5 h-5" }) => (
            <svg className={\`\${className} animate-spin\`} fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
            </svg>
        );
        const GithubIcon = ({ className = "w-4 h-4" }) => (
            <svg className={className} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
        );

        const MaoyanMovieAPI = () => {
            const [movieId, setMovieId] = useState('');
            const [movieData, setMovieData] = useState(null);
            const [loading, setLoading] = useState(false);
            const [error, setError] = useState(null);
            const [copied, setCopied] = useState(false);

            const exampleIds = ['1294273', '1413252', '1203084', '1297192', '1302425'];

            const handleSearch = async () => {
                if (!movieId.trim()) return;
                
                setLoading(true);
                setError(null);
                
                try {
                    const response = await fetch(\`/api/movie/\${movieId}\`);
                    const data = await response.json();
                    
                    if (response.ok && data.success !== false) {
                        setMovieData(data);
                    } else {
                        setError(data.error || '获取电影信息失败');
                    }
                } catch (err) {
                    setError('网络请求失败，请检查网络连接');
                } finally {
                    setLoading(false);
                }
            };

            const handleKeyPress = (e) => {
                if (e.key === 'Enter') {
                    handleSearch();
                }
            };

            const copyApiUrl = () => {
                const url = \`\${window.location.origin}/api/movie/\${movieId}\`;
                navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            };

            const openApiInNewTab = () => {
                if (movieId.trim()) {
                    window.open(\`/api/movie/\${movieId}\`, '_blank');
                }
            };

            return (
                <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pb-20">
                    {/* Animated background */}
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute -inset-10 opacity-20">
                            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
                            <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
                            <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
                        </div>
                    </div>

                    <main className="relative z-10 container mx-auto px-4 py-8">
                        {/* Header */}
                        <div className="text-center mb-12">
                            <div className="flex justify-center items-center mb-6">
                                <FilmIcon className="w-12 h-12 text-purple-400 mr-4" />
                                <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                                    猫眼电影 API
                                </h1>
                            </div>
                            <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                                获取完整的电影数据，包括票房信息、评分、剧情简介等详细内容
                            </p>
                        </div>

                        {/* Search Section */}
                        <div className="max-w-4xl mx-auto mb-12">
                            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
                                <div className="text-center mb-6">
                                    <h2 className="text-2xl font-semibold text-white mb-2">输入电影ID</h2>
                                    <p className="text-slate-300">输入猫眼电影的ID来获取详细信息</p>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            value={movieId}
                                            onChange={(e) => setMovieId(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            placeholder="例如: 1413252"
                                            className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 backdrop-blur-sm text-lg"
                                        />
                                        <SearchIcon className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    </div>
                                    <button
                                        onClick={handleSearch}
                                        disabled={loading || !movieId.trim()}
                                        className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg"
                                    >
                                        {loading ? (
                                            <LoaderIcon className="w-5 h-5 mx-auto" />
                                        ) : (
                                            '搜索电影'
                                        )}
                                    </button>
                                </div>

                                {/* Example IDs */}
                                <div className="text-center">
                                    <p className="text-slate-400 mb-3">试试这些示例ID：</p>
                                    <div className="flex flex-wrap justify-center gap-2">
                                        {exampleIds.map((id) => (
                                            <button
                                                key={id}
                                                onClick={() => setMovieId(id)}
                                                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white rounded-lg transition-colors duration-200 border border-white/10 hover:border-white/30"
                                            >
                                                {id}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* API URL Section */}
                                {movieId.trim() && (
                                    <div className="mt-6 p-4 bg-black/20 rounded-xl border border-white/10">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="text-slate-400 text-sm mb-1">API 端点:</p>
                                                <p className="text-white font-mono text-sm break-all">
                                                    {window.location.origin}/api/movie/{movieId}
                                                </p>
                                            </div>
                                            <div className="flex gap-2 ml-4">
                                                <button
                                                    onClick={copyApiUrl}
                                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors duration-200"
                                                    title="复制API链接"
                                                >
                                                    {copied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4 text-slate-400" />}
                                                </button>
                                                <button
                                                    onClick={openApiInNewTab}
                                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors duration-200"
                                                    title="在新窗口打开API"
                                                >
                                                    <ExternalLinkIcon className="w-4 h-4 text-slate-400" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="max-w-4xl mx-auto mb-8">
                                <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-6 backdrop-blur-sm">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3">
                                            <span className="text-white font-bold">!</span>
                                        </div>
                                        <p className="text-red-200">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Movie Data Display */}
                        {movieData && (
                            <div className="max-w-6xl mx-auto">
                                <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        {/* Movie Poster */}
                                        <div className="lg:col-span-1">
                                            <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl">
                                                {movieData.basic?.movieImg ? (
                                                    <img
                                                        src={movieData.basic.movieImg}
                                                        alt={movieData.basic?.movieName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                                                        <FilmIcon className="w-20 h-20 text-slate-500" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Movie Info */}
                                        <div className="lg:col-span-2 space-y-6">
                                            <div>
                                                <h3 className="text-3xl font-bold text-white mb-2">
                                                    {movieData.basic?.movieName || '未知电影'}
                                                </h3>
                                                {movieData.basic?.movieEnName && (
                                                    <p className="text-xl text-slate-300 mb-4">{movieData.basic.movieEnName}</p>
                                                )}
                                            </div>

                                            {/* Ratings */}
                                            <div className="flex flex-wrap gap-4">
                                                {movieData.rating?.MaoYanRating && (
                                                    <div className="flex items-center bg-yellow-500/20 px-4 py-2 rounded-lg">
                                                        <StarIcon className="w-5 h-5 text-yellow-400 mr-2" />
                                                        <span className="text-white font-semibold">猫眼 {movieData.rating.MaoYanRating}</span>
                                                    </div>
                                                )}
                                                {movieData.rating?.IMDBRating && (
                                                    <div className="flex items-center bg-blue-500/20 px-4 py-2 rounded-lg">
                                                        <StarIcon className="w-5 h-5 text-blue-400 mr-2" />
                                                        <span className="text-white font-semibold">IMDB {movieData.rating.IMDBRating}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Movie Details */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {movieData.basic?.director && (
                                                    <div className="flex items-center">
                                                        <UserIcon className="w-5 h-5 text-purple-400 mr-3" />
                                                        <div>
                                                            <p className="text-slate-400 text-sm">导演</p>
                                                            <p className="text-white">{movieData.basic.director}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {movieData.basic?.category && (
                                                    <div className="flex items-center">
                                                        <FilmIcon className="w-5 h-5 text-cyan-400 mr-3" />
                                                        <div>
                                                            <p className="text-slate-400 text-sm">类型</p>
                                                            <p className="text-white">{movieData.basic.category}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {movieData.basic?.releaseDate && (
                                                    <div className="flex items-center">
                                                        <CalendarIcon className="w-5 h-5 text-green-400 mr-3" />
                                                        <div>
                                                            <p className="text-slate-400 text-sm">上映日期</p>
                                                            <p className="text-white">{movieData.basic.releaseDate}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {movieData.basic?.duration && (
                                                    <div className="flex items-center">
                                                        <ClockIcon className="w-5 h-5 text-orange-400 mr-3" />
                                                        <div>
                                                            <p className="text-slate-400 text-sm">时长</p>
                                                            <p className="text-white">{movieData.basic.duration}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {movieData.basic?.region && (
                                                    <div className="flex items-center">
                                                        <MapPinIcon className="w-5 h-5 text-pink-400 mr-3" />
                                                        <div>
                                                            <p className="text-slate-400 text-sm">地区</p>
                                                            <p className="text-white">{movieData.basic.region}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {movieData.basic?.boxOffice && (
                                                    <div className="flex items-center">
                                                        <AwardIcon className="w-5 h-5 text-yellow-400 mr-3" />
                                                        <div>
                                                            <p className="text-slate-400 text-sm">票房</p>
                                                            <p className="text-white font-semibold">{movieData.basic.boxOffice}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Plot Summary */}
                                            {movieData.plot?.summary && (
                                                <div className="bg-black/20 rounded-xl p-6">
                                                    <h4 className="text-lg font-semibold text-white mb-3">剧情简介</h4>
                                                    <p className="text-slate-300 leading-relaxed">{movieData.plot.summary}</p>
                                                </div>
                                            )}

                                            {/* Meta Information */}
                                            {movieData._meta && (
                                                <div className="text-xs text-slate-500 space-y-1">
                                                    <p>数据来源: {movieData._meta.dataSources?.join(', ')}</p>
                                                    <p>请求时间: {movieData._meta.requestTime}</p>
                                                    {movieData._meta.fromCache && <p>数据来自缓存</p>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>

                    {/* 底部版权和版本信息 */}
                    <footer className="fixed bottom-0 w-full bg-gradient-to-t from-slate-900/95 via-slate-900/80 to-slate-900/0 backdrop-blur-sm">
                        <div className="container mx-auto px-4 py-4">
                            {/* 版本号显示 - 独立元素固定在右下角 */}
                            <div className="fixed bottom-4 right-4">
                                <p className="text-xs text-slate-400 opacity-60">
                                    v1.0.0
                                </p>
                            </div>
                            
                            <div className="flex items-center justify-center">
                                <a
                                    href="https://github.com/Ahua9527/maoyan_movie_api_cf"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-2 text-slate-300 hover:text-purple-400 transition-colors duration-200"
                                >
                                    <GithubIcon />
                                    <span>GitHub</span>
                                </a>
                            </div>
                            <p className="mt-2 text-xs text-center text-slate-400">
                                🎬 猫眼电影数据API © 2025 | Designed & Developed by  哆啦Ahua🌱
                            </p>
                        </div>
                    </footer>
                </div>
            );
        };

        ReactDOM.render(<MaoyanMovieAPI />, document.getElementById('root'));
    </script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}

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