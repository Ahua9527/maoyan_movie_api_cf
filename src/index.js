export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS handler
    if (request.method === 'OPTIONS') {
      return createResponse(null, {}, 200);
    }
    
    // API routing
    if (url.pathname.startsWith('/api/movie/')) {
      const movieId = url.pathname.split('/').pop();
      return handleMovieRequest(movieId, env);
    }
    
    // API status route
    if (url.pathname === '/api/status') {
      return createResponse({
        status: "🚀 Production Ready",
        version: "1.1.0",
        timestamp: new Date().toISOString(),
        endpoints: {
          "/api/movie/:id": "Get full movie data",
          "/api/status": "API service status"
        }
      });
    }
    
    // Default to serving the frontend
    return createFrontendResponse();
  }
};

// Creates the frontend page response
function createFrontendResponse() {
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>猫眼电影API - 一个运行在Cloudflare Workers的电影API</title>
    <meta name="description" content="获取完整的猫眼电影数据，包括票房信息、评分、剧情简介等详细内容">
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { font-family: 'Inter', sans-serif; }
        body { margin: 0; padding: 0; }

        /* CSS Variables for Global Glass Control */
        :root {
            --glass-blur: 16px;
            --glass-saturation: 150%;
            --glass-corner-radius: 36px;
            --glass-rgb-separation: 0px;
            --glass-edge-distortion: 8;
            --glass-thickness: 2px;
            --glass-hover-blur-boost: 4px;
        }
        
        /* Glass Thickness and Depth Effects */
        .glass-interior-effects::before {
            content: '';
            position: absolute;
            top: var(--glass-thickness);
            left: var(--glass-thickness);
            right: var(--glass-thickness);
            bottom: var(--glass-thickness);
            background: linear-gradient(145deg, 
                rgba(255, 255, 255, 0.15) 0%,
                rgba(255, 255, 255, 0.05) 25%,
                rgba(255, 255, 255, 0.02) 50%,
                rgba(0, 0, 0, 0.02) 75%,
                rgba(0, 0, 0, 0.05) 100%);
            border-radius: calc(var(--glass-corner-radius) - var(--glass-thickness));
            pointer-events: none;
            z-index: 8;
        }
        
        /* Glass Interior Effects - RGB Separation & Saturation */
        .glass-interior-effects::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
                /* RGB Channel Separation */
                radial-gradient(ellipse at 30% 40%, rgba(255, 0, 0, var(--glass-rgb-separation-opacity, 0)) 0%, transparent 50%),
                radial-gradient(ellipse at 70% 60%, rgba(0, 255, 255, var(--glass-rgb-separation-opacity, 0)) 0%, transparent 50%),
                radial-gradient(ellipse at 50% 80%, rgba(0, 0, 255, var(--glass-rgb-separation-opacity, 0)) 0%, transparent 50%),
                /* Saturation Enhancement Overlay */
                linear-gradient(135deg, 
                    hsla(270, var(--glass-saturation-intensity, 0%), 70%, var(--glass-saturation-opacity, 0)) 0%,
                    hsla(180, var(--glass-saturation-intensity, 0%), 60%, var(--glass-saturation-opacity, 0)) 30%,
                    hsla(300, var(--glass-saturation-intensity, 0%), 65%, var(--glass-saturation-opacity, 0)) 60%,
                    hsla(240, var(--glass-saturation-intensity, 0%), 75%, var(--glass-saturation-opacity, 0)) 100%);
            mix-blend-mode: soft-light;
            opacity: var(--glass-effects-intensity, 0);
            border-radius: inherit;
            pointer-events: none;
            z-index: 10;
        }
        
        /* Liquid Glass 2025 - Enhanced Modern Version with Global Controls */
        .liquidGlass-wrapper {
            position: relative;
            display: flex;
            overflow: hidden;
            padding: var(--glass-thickness);
            border-radius: var(--glass-corner-radius);
            cursor: pointer;
            backdrop-filter: blur(var(--glass-blur));
            background: linear-gradient(145deg, 
                rgba(255, 255, 255, 0.12) 0%,
                rgba(255, 255, 255, 0.08) 25%,
                rgba(255, 255, 255, 0.04) 50%,
                rgba(255, 255, 255, 0.02) 75%,
                rgba(0, 0, 0, 0.02) 100%);
            border: var(--glass-thickness) solid rgba(255, 255, 255, 0.25);
            box-shadow: 
                /* Outer depth shadow */
                0 calc(var(--glass-thickness) * 6) calc(var(--glass-thickness) * 20) rgba(0, 0, 0, 0.15),
                0 calc(var(--glass-thickness) * 2) calc(var(--glass-thickness) * 6) rgba(0, 0, 0, 0.08),
                /* Inner glass highlights */
                inset 0 var(--glass-thickness) 0 rgba(255, 255, 255, 0.3),
                inset 0 calc(var(--glass-thickness) * -1) 0 rgba(255, 255, 255, 0.1),
                inset var(--glass-thickness) 0 0 rgba(255, 255, 255, 0.15),
                inset calc(var(--glass-thickness) * -1) 0 0 rgba(255, 255, 255, 0.05);
            transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
        }
        .liquidGlass-wrapper:hover {
            transform: translateY(-6px) scale(1.02);
            backdrop-filter: blur(calc(var(--glass-blur) + var(--glass-hover-blur-boost)));
            background: linear-gradient(145deg, 
                rgba(255, 255, 255, 0.18) 0%,
                rgba(255, 255, 255, 0.12) 25%,
                rgba(255, 255, 255, 0.06) 50%,
                rgba(255, 255, 255, 0.03) 75%,
                rgba(0, 0, 0, 0.03) 100%);
            border: var(--glass-thickness) solid rgba(255, 255, 255, 0.35);
            box-shadow: 
                /* Enhanced outer depth */
                0 calc(var(--glass-thickness) * 12) calc(var(--glass-thickness) * 40) rgba(0, 0, 0, 0.25),
                0 calc(var(--glass-thickness) * 6) calc(var(--glass-thickness) * 20) rgba(0, 0, 0, 0.15),
                /* Enhanced inner highlights */
                inset 0 calc(var(--glass-thickness) * 2) 0 rgba(255, 255, 255, 0.4),
                inset 0 calc(var(--glass-thickness) * -2) 0 rgba(255, 255, 255, 0.15),
                inset calc(var(--glass-thickness) * 2) 0 0 rgba(255, 255, 255, 0.2),
                inset calc(var(--glass-thickness) * -2) 0 0 rgba(255, 255, 255, 0.08);
        }
        .liquidGlass-inner {
            position: relative;
            width: 100%;
            border-radius: calc(var(--glass-corner-radius) - var(--glass-thickness));
            overflow: hidden;
            background: linear-gradient(145deg, 
                rgba(255, 255, 255, 0.06) 0%,
                rgba(255, 255, 255, 0.03) 50%,
                rgba(255, 255, 255, 0.01) 100%);
            box-shadow: 
                inset 0 var(--glass-thickness) calc(var(--glass-thickness) * 2) rgba(0, 0, 0, 0.05),
                inset 0 calc(var(--glass-thickness) * -1) var(--glass-thickness) rgba(255, 255, 255, 0.1);
        }
        .liquidGlass-content {
            position: relative;
            z-index: 3;
            padding: 2rem;
            backdrop-filter: blur(calc(var(--glass-blur) * 0.5));
        }
        .liquidGlass-wrapper.error {
            background: linear-gradient(135deg, 
                rgba(239, 68, 68, 0.15) 0%,
                rgba(239, 68, 68, 0.08) 50%,
                rgba(239, 68, 68, 0.03) 100%);
            border: 1px solid rgba(239, 68, 68, 0.25);
        }
        .liquidGlass-wrapper.error:hover {
            background: linear-gradient(135deg, 
                rgba(239, 68, 68, 0.2) 0%,
                rgba(239, 68, 68, 0.12) 50%,
                rgba(239, 68, 68, 0.05) 100%);
            border: 1px solid rgba(239, 68, 68, 0.35);
        }
        .menu-item {
            padding: 0.5rem 1rem;
            border-radius: var(--glass-corner-radius);
            transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
            color: #e2e8f0;
            background: linear-gradient(135deg, 
                rgba(255, 255, 255, 0.05) 0%,
                rgba(255, 255, 255, 0.02) 100%);
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(var(--glass-blur));
        }
        .menu-item:hover {
            background: linear-gradient(135deg, 
                rgba(255, 255, 255, 0.15) 0%,
                rgba(255, 255, 255, 0.08) 100%);
            border: 1px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(calc(var(--glass-blur) + var(--glass-hover-blur-boost)));
            color: #fff;
            transform: translateY(-2px) scale(1.05);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
        
        /* Enhanced input field styling */
        .glass-input {
            background: linear-gradient(145deg, 
                rgba(255, 255, 255, 0.1) 0%,
                rgba(255, 255, 255, 0.06) 50%,
                rgba(255, 255, 255, 0.02) 100%);
            border: 1px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation));
            transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
            border-radius: var(--glass-corner-radius);
            box-shadow: 
                0 calc(var(--glass-thickness) * 2) calc(var(--glass-thickness) * 8) rgba(0, 0, 0, 0.08),
                inset 0 var(--glass-thickness) 0 rgba(255, 255, 255, 0.2),
                inset 0 calc(var(--glass-thickness) * -1) 0 rgba(255, 255, 255, 0.1);
        }
        .glass-input:focus {
            background: linear-gradient(135deg, 
                rgba(255, 255, 255, 0.12) 0%,
                rgba(255, 255, 255, 0.05) 100%);
            border: 1px solid rgba(147, 51, 234, 0.4);
            backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation));
            box-shadow: 
                0 0 0 2px rgba(147, 51, 234, 0.1),
                0 4px 20px rgba(147, 51, 234, 0.15);
        }
        
        /* Enhanced button styling with glass effect */
        .glass-button {
            background: linear-gradient(135deg, 
                rgba(255, 255, 255, 0.1) 0%,
                rgba(255, 255, 255, 0.05) 50%,
                rgba(255, 255, 255, 0.02) 100%);
            border: 1px solid rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation));
            transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
            border-radius: var(--glass-corner-radius);
            position: relative;
            overflow: hidden;
            box-shadow: 
                0 calc(var(--glass-thickness) * 2) calc(var(--glass-thickness) * 8) rgba(0, 0, 0, 0.1),
                inset 0 var(--glass-thickness) 0 rgba(255, 255, 255, 0.2),
                inset 0 calc(var(--glass-thickness) * -1) 0 rgba(255, 255, 255, 0.1);
        }
        .glass-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, 
                rgba(255, 255, 255, 0.08) 0%,
                rgba(255, 255, 255, 0.04) 50%,
                rgba(255, 255, 255, 0.02) 100%);
            border-radius: inherit;
            pointer-events: none;
            z-index: 1;
        }
        .glass-button:hover:not(:disabled) {
            background: linear-gradient(135deg, 
                rgba(255, 255, 255, 0.15) 0%,
                rgba(255, 255, 255, 0.08) 50%,
                rgba(255, 255, 255, 0.04) 100%);
            border: 1px solid rgba(255, 255, 255, 0.35);
            backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation));
            transform: translateY(-2px) scale(1.02);
            box-shadow: 
                0 calc(var(--glass-thickness) * 4) calc(var(--glass-thickness) * 16) rgba(0, 0, 0, 0.15),
                0 var(--glass-thickness) calc(var(--glass-thickness) * 4) rgba(0, 0, 0, 0.08),
                inset 0 calc(var(--glass-thickness) * 2) 0 rgba(255, 255, 255, 0.3),
                inset 0 calc(var(--glass-thickness) * -2) 0 rgba(255, 255, 255, 0.15);
        }
        .glass-button:disabled {
            background: linear-gradient(135deg, 
                rgba(255, 255, 255, 0.05) 0%,
                rgba(255, 255, 255, 0.02) 100%);
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(var(--glass-blur));
            transform: none;
            opacity: 0.5;
        }
        
        /* API endpoint container glass styling */
        .glass-api-container {
            background: linear-gradient(135deg, 
                rgba(0, 0, 0, 0.3) 0%,
                rgba(0, 0, 0, 0.15) 100%);
            border: 1px solid rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation));
            border-radius: var(--glass-corner-radius);
            transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
            position: relative;
            overflow: hidden;
        }
        .glass-api-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, 
                rgba(255, 255, 255, 0.05) 0%,
                rgba(255, 255, 255, 0.02) 50%,
                rgba(255, 255, 255, 0.01) 100%);
            border-radius: inherit;
            pointer-events: none;
        }
        
        /* Small glass button for API actions */
        .glass-icon-button {
            background: linear-gradient(135deg, 
                rgba(255, 255, 255, 0.08) 0%,
                rgba(255, 255, 255, 0.03) 100%);
            border: 1px solid rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation));
            border-radius: var(--glass-corner-radius);
            transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
            position: relative;
            overflow: hidden;
        }
        .glass-icon-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, 
                rgba(255, 255, 255, 0.08) 0%,
                rgba(255, 255, 255, 0.03) 100%);
            border-radius: inherit;
            pointer-events: none;
        }
        .glass-icon-button:hover {
            background: linear-gradient(135deg, 
                rgba(255, 255, 255, 0.15) 0%,
                rgba(255, 255, 255, 0.08) 100%);
            border: 1px solid rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation));
            transform: translateY(-1px) scale(1.05);
            box-shadow: 
                0 4px 16px rgba(0, 0, 0, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        
        /* Rating badge glass styling */
        .glass-rating-badge {
            background: linear-gradient(135deg, 
                rgba(255, 255, 255, 0.12) 0%,
                rgba(255, 255, 255, 0.06) 100%);
            border: 1px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation));
            border-radius: var(--glass-corner-radius);
            transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
            position: relative;
            overflow: hidden;
        }
        .glass-rating-badge::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, 
                rgba(255, 255, 255, 0.08) 0%,
                rgba(255, 255, 255, 0.03) 100%);
            border-radius: inherit;
            pointer-events: none;
        }
        .glass-rating-badge:hover {
            background: linear-gradient(135deg, 
                rgba(255, 255, 255, 0.18) 0%,
                rgba(255, 255, 255, 0.1) 100%);
            border: 1px solid rgba(255, 255, 255, 0.3);
            backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation));
            transform: translateY(-2px) scale(1.03);
            box-shadow: 
                0 6px 36px rgba(0, 0, 0, 0.12),
                inset 0 1px 0 rgba(255, 255, 255, 0.25);
        }
        
        /* Plot summary glass container */
        .glass-plot-container {
            background: linear-gradient(135deg, 
                rgba(0, 0, 0, 0.25) 0%,
                rgba(0, 0, 0, 0.12) 100%);
            border: 1px solid rgba(255, 255, 255, 0.12);
            backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation));
            border-radius: var(--glass-corner-radius);
            transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
            position: relative;
            overflow: hidden;
        }
        .glass-plot-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, 
                rgba(255, 255, 255, 0.04) 0%,
                rgba(255, 255, 255, 0.02) 50%,
                rgba(255, 255, 255, 0.01) 100%);
            border-radius: inherit;
            pointer-events: none;
        }
        .glass-plot-container:hover {
            background: linear-gradient(135deg, 
                rgba(0, 0, 0, 0.3) 0%,
                rgba(0, 0, 0, 0.15) 100%);
            border: 1px solid rgba(255, 255, 255, 0.18);
            backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation));
            transform: translateY(-2px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        }
        
        /* Movie poster interaction */
        .glass-movie-poster {
            transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
            position: relative;
            overflow: hidden;
            border-radius: var(--glass-corner-radius);
            cursor: pointer;
        }
        .glass-movie-poster::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border: 2px solid rgba(255, 255, 255, 0);
            border-radius: inherit;
            transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
            pointer-events: none;
            z-index: 2;
        }
        .glass-movie-poster:hover {
            transform: translateY(-8px) scale(1.03);
            box-shadow: 
                0 20px 60px rgba(0, 0, 0, 0.3),
                0 8px 36px rgba(0, 0, 0, 0.15),
                inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        .glass-movie-poster:hover::after {
            border-color: rgba(255, 255, 255, 0.3);
        }
        .glass-movie-poster img {
            transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
            position: relative;
            z-index: 1;
        }
        .glass-movie-poster:hover img {
            transform: scale(1.05);
            filter: brightness(1.1) contrast(1.05) saturate(1.1);
        }
        
        /* Movie basic info glass interaction */
        .glass-movie-info {
            background: linear-gradient(135deg, 
                rgba(255, 255, 255, 0.05) 0%,
                rgba(255, 255, 255, 0.02) 100%);
            border: 2px solid rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation));
            border-radius: var(--glass-corner-radius);
            padding: 1.5rem;
            transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
            position: relative;
            overflow: hidden;
        }
        .glass-movie-info::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, 
                rgba(255, 255, 255, 0.03) 0%,
                rgba(255, 255, 255, 0.01) 100%);
            border-radius: inherit;
            pointer-events: none;
            z-index: 1;
        }
        .glass-movie-info > * {
            position: relative;
            z-index: 2;
        }
        .glass-movie-info:hover {
            background: linear-gradient(135deg, 
                rgba(255, 255, 255, 0.08) 0%,
                rgba(255, 255, 255, 0.04) 100%);
            border: 1px solid rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation));
            transform: translateY(-3px);
            box-shadow: 
                0 8px 32px rgba(0, 0, 0, 0.1),
                0 2px 8px rgba(0, 0, 0, 0.05),
                inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }
        
        /* Footer glass styling */
        .glass-footer-link {
            background: linear-gradient(135deg, 
                rgba(255, 255, 255, 0.08) 0%,
                rgba(255, 255, 255, 0.03) 100%);
            border: 1px solid rgba(255, 255, 255, 0.12);
            backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation));
            border-radius: var(--glass-corner-radius);
            padding: 0.75rem 1.25rem;
            transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
            position: relative;
            overflow: hidden;
        }
        .glass-footer-link::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, 
                rgba(255, 255, 255, 0.05) 0%,
                rgba(255, 255, 255, 0.02) 100%);
            border-radius: inherit;
            pointer-events: none;
            z-index: 1;
        }
        .glass-footer-link > * {
            position: relative;
            z-index: 2;
        }
        .glass-footer-link:hover {
            background: linear-gradient(135deg, 
                rgba(255, 255, 255, 0.15) 0%,
                rgba(255, 255, 255, 0.08) 100%);
            border: 1px solid rgba(255, 255, 255, 0.25);
            backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation));
            transform: translateY(-2px) scale(1.02);
            box-shadow: 
                0 6px 36px rgba(0, 0, 0, 0.1),
                0 2px 8px rgba(0, 0, 0, 0.05),
                inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        
        /* Version badge glass styling */
        .glass-version-badge {
            background: linear-gradient(135deg, 
                rgba(255, 255, 255, 0.06) 0%,
                rgba(255, 255, 255, 0.02) 100%);
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation));
            border-radius: var(--glass-corner-radius);
            padding: 0.5rem 0.75rem;
            transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
            position: relative;
            overflow: hidden;
        }
        .glass-version-badge::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, 
                rgba(255, 255, 255, 0.03) 0%,
                rgba(255, 255, 255, 0.01) 100%);
            border-radius: inherit;
            pointer-events: none;
            z-index: 1;
        }
        .glass-version-badge > * {
            position: relative;
            z-index: 2;
        }
        .glass-version-badge:hover {
            background: linear-gradient(135deg, 
                rgba(255, 255, 255, 0.1) 0%,
                rgba(255, 255, 255, 0.04) 100%);
            border: 1px solid rgba(255, 255, 255, 0.18);
            backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation));
            transform: translateY(-1px) scale(1.05);
            box-shadow: 
                0 4px 16px rgba(0, 0, 0, 0.08),
                inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }
    </style>
</head>
<body>
    <div id="root"></div>
    
    <svg style="display: none">
        <defs>
            <filter id="glass-distortion" x="-50%" y="-50%" width="200%" height="200%">
                <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="8" scale="var(--glass-edge-distortion, 8)" result="turbulence"/>
                <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="var(--glass-edge-distortion, 8)" xChannelSelector="R" yChannelSelector="G" result="displacement"/>
                <feGaussianBlur in="displacement" stdDeviation="0.5" result="blur"/>
            </filter>
        </defs>
    </svg>
    
    <script type="text/babel">
        const { useState, useEffect } = React;
        
        // ═══════════════════════════════════════════════════════════════
        // 🎛️ GLOBAL LIQUID GLASS CONFIGURATION
        // ═══════════════════════════════════════════════════════════════
        // Modify these values to control all glass effects in the project
        const GLASS_CONFIG = {
            edgeDistortion: 8,           // Edge distortion (0-30) - SVG turbulence scale
            blurIntensity: 0,           // Blur intensity (4-40px) - backdrop-filter blur
            saturation: 100,             // Saturation (100-200%) - backdrop-filter saturate  
            rgbSeparation: 3,            // RGB separation (0-5px) - glitch effect
            cursorMagnetism: 0,       // Cursor magnetism (0-0.1) - glass follows mouse
            cornerRoundness: 36,         // Corner roundness (8-40px) - border-radius
            glassThickness: 2,           // Glass thickness (1-10px) - border and shadow depth
            hoverBlurBoost: 2            // Hover blur boost (0-20px) - additional blur on hover
        };
        // ═══════════════════════════════════════════════════════════════
        
        // Apply global glass configuration
        const applyGlassConfig = () => {
            const root = document.documentElement;
            root.style.setProperty('--glass-blur', GLASS_CONFIG.blurIntensity + 'px');
            root.style.setProperty('--glass-saturation', GLASS_CONFIG.saturation + '%');
            root.style.setProperty('--glass-corner-radius', GLASS_CONFIG.cornerRoundness + 'px');
            root.style.setProperty('--glass-edge-distortion', GLASS_CONFIG.edgeDistortion);
            root.style.setProperty('--glass-thickness', GLASS_CONFIG.glassThickness + 'px');
            root.style.setProperty('--glass-hover-blur-boost', GLASS_CONFIG.hoverBlurBoost + 'px');
            
            // Update SVG filter for edge distortion
            const turbulenceElement = document.querySelector('#glass-distortion feTurbulence');
            if (turbulenceElement) {
                turbulenceElement.setAttribute('scale', GLASS_CONFIG.edgeDistortion);
            }
            const displacementElement = document.querySelector('#glass-distortion feDisplacementMap');
            if (displacementElement) {
                displacementElement.setAttribute('scale', GLASS_CONFIG.edgeDistortion);
            }
            
            // Apply interior effects (RGB separation & saturation)
            applyGlassInteriorEffects();
        };
        
        // Cursor magnetism effect
        let cursorX = 0, cursorY = 0;
        const handleMouseMove = (e) => {
            cursorX = e.clientX;
            cursorY = e.clientY;
            
            if (GLASS_CONFIG.cursorMagnetism > 0) {
                document.querySelectorAll('.liquidGlass-wrapper, .glass-rating-badge, .glass-movie-poster').forEach(element => {
                    const rect = element.getBoundingClientRect();
                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;
                    
                    const deltaX = (cursorX - centerX) * GLASS_CONFIG.cursorMagnetism;
                    const deltaY = (cursorY - centerY) * GLASS_CONFIG.cursorMagnetism;
                    
                    element.style.transform = 'translate(' + deltaX + 'px, ' + deltaY + 'px)';
                });
            }
        };
        
        // Apply Interior Glass Effects (RGB Separation & Saturation)
        const applyGlassInteriorEffects = () => {
            const root = document.documentElement;
            
            // Calculate RGB separation
            const rgbIntensity = GLASS_CONFIG.rgbSeparation / 5; // Normalize to 0-1
            const rgbOpacity = Math.min(rgbIntensity * 0.3, 0.15); // Max opacity 0.15
            
            // Calculate saturation enhancement
            const satIntensity = Math.max(0, (GLASS_CONFIG.saturation - 100) / 100); // Normalize enhancement above 100%
            const satOpacity = Math.min(satIntensity * 0.1, 0.08); // Subtle saturation overlay
            
            // Set CSS variables
            root.style.setProperty('--glass-rgb-separation-intensity', rgbIntensity);
            root.style.setProperty('--glass-rgb-separation-opacity', rgbOpacity);
            root.style.setProperty('--glass-saturation-intensity', satIntensity * 50 + '%'); // Convert to percentage
            root.style.setProperty('--glass-saturation-opacity', satOpacity);
            
            // Overall effects intensity
            const overallIntensity = Math.max(rgbIntensity, satIntensity * 0.5);
            root.style.setProperty('--glass-effects-intensity', overallIntensity);
            
            // Apply effects class to all glass elements
            const glassElements = document.querySelectorAll('.liquidGlass-wrapper, .glass-input, .glass-button, .glass-rating-badge, .glass-api-container, .glass-plot-container, .glass-movie-info, .glass-footer-link, .glass-version-badge');
            
            if (overallIntensity > 0) {
                glassElements.forEach(element => {
                    element.classList.add('glass-interior-effects');
                });
            } else {
                glassElements.forEach(element => {
                    element.classList.remove('glass-interior-effects');
                });
            }
        };
        
        // Icon components (unchanged)
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
            
            // Apply glass configuration on component mount
            useEffect(() => {
                applyGlassConfig();
                
                // Add cursor magnetism event listener if enabled
                if (GLASS_CONFIG.cursorMagnetism > 0) {
                    document.addEventListener('mousemove', handleMouseMove);
                    return () => document.removeEventListener('mousemove', handleMouseMove);
                }
            }, []);

            const handleSearch = async () => {
                if (!movieId.trim()) return;
                
                setLoading(true);
                setError(null);
                setMovieData(null);
                
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
                <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900 pb-20 relative overflow-hidden">
                    {/* Animated Background Layers */}
                    <div className="absolute inset-0 overflow-hidden">
                        
                        {/* Moving Gradient Waves */}
                        <div className="absolute inset-0">
                            <div className="absolute w-full h-full bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-cyan-500/10 animate-pulse"></div>
                            <div className="absolute w-full h-full bg-gradient-to-l from-violet-500/8 via-transparent to-emerald-500/8 animate-pulse" style={{animationDelay: '2s'}}></div>
                            <div className="absolute w-full h-full bg-gradient-to-t from-indigo-500/6 via-transparent to-teal-500/6 animate-pulse" style={{animationDelay: '4s'}}></div>
                        </div>
                        
                        {/* Floating Particles */}
                        <div className="absolute inset-0">
                            <div className="absolute w-2 h-2 bg-cyan-400/60 rounded-full animate-bounce" style={{top: '10%', left: '20%', animationDelay: '0s', animationDuration: '3s'}}></div>
                            <div className="absolute w-1 h-1 bg-blue-400/40 rounded-full animate-bounce" style={{top: '30%', left: '70%', animationDelay: '1s', animationDuration: '4s'}}></div>
                            <div className="absolute w-3 h-3 bg-purple-400/50 rounded-full animate-bounce" style={{top: '60%', left: '15%', animationDelay: '2s', animationDuration: '5s'}}></div>
                            <div className="absolute w-1 h-1 bg-emerald-400/70 rounded-full animate-bounce" style={{top: '80%', left: '80%', animationDelay: '3s', animationDuration: '3.5s'}}></div>
                            <div className="absolute w-2 h-2 bg-violet-400/55 rounded-full animate-bounce" style={{top: '25%', left: '45%', animationDelay: '1.5s', animationDuration: '4.5s'}}></div>
                            <div className="absolute w-1 h-1 bg-teal-400/45 rounded-full animate-bounce" style={{top: '70%', left: '60%', animationDelay: '0.5s', animationDuration: '6s'}}></div>
                        </div>
                        
                        {/* Rotating Glass Orbs */}
                        <div className="absolute -inset-10 opacity-25">
                            <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-full filter blur-3xl animate-spin" style={{animationDuration: '20s'}}></div>
                            <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/25 to-teal-500/25 rounded-full filter blur-3xl animate-spin" style={{animationDuration: '30s', animationDirection: 'reverse'}}></div>
                            <div className="absolute bottom-1/4 left-1/2 w-72 h-72 bg-gradient-to-r from-violet-500/30 to-indigo-500/30 rounded-full filter blur-3xl animate-spin" style={{animationDuration: '25s'}}></div>
                            <div className="absolute top-1/2 right-1/3 w-88 h-88 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-full filter blur-3xl animate-spin" style={{animationDuration: '35s', animationDirection: 'reverse'}}></div>
                        </div>
                        
                        {/* Moving Stars */}
                        <div className="absolute inset-0">
                            <div className="absolute w-1 h-1 bg-white rounded-full opacity-70 animate-ping" style={{top: '15%', left: '10%', animationDelay: '0s', animationDuration: '2s'}}></div>
                            <div className="absolute w-1 h-1 bg-white rounded-full opacity-50 animate-ping" style={{top: '25%', left: '85%', animationDelay: '1s', animationDuration: '3s'}}></div>
                            <div className="absolute w-1 h-1 bg-white rounded-full opacity-80 animate-ping" style={{top: '45%', left: '25%', animationDelay: '2s', animationDuration: '2.5s'}}></div>
                            <div className="absolute w-1 h-1 bg-white rounded-full opacity-60 animate-ping" style={{top: '65%', left: '75%', animationDelay: '0.5s', animationDuration: '4s'}}></div>
                            <div className="absolute w-1 h-1 bg-white rounded-full opacity-90 animate-ping" style={{top: '85%', left: '35%', animationDelay: '1.5s', animationDuration: '2.8s'}}></div>
                            <div className="absolute w-1 h-1 bg-white rounded-full opacity-40 animate-ping" style={{top: '35%', left: '55%', animationDelay: '3s', animationDuration: '3.5s'}}></div>
                        </div>
                        
                        {/* Animated Grid Pattern */}
                        <div className="absolute inset-0 opacity-5 animate-pulse" style={{
                            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                            backgroundSize: '50px 50px',
                            animationDuration: '8s'
                        }}></div>
                        
                        {/* Floating Geometric Shapes */}
                        <div className="absolute inset-0">
                            <div className="absolute w-4 h-4 border border-cyan-400/30 rotate-45 animate-spin" style={{top: '20%', left: '30%', animationDuration: '10s'}}></div>
                            <div className="absolute w-6 h-6 border border-purple-400/20 rotate-45 animate-spin" style={{top: '70%', left: '20%', animationDuration: '15s', animationDirection: 'reverse'}}></div>
                            <div className="absolute w-3 h-3 border border-emerald-400/40 rotate-45 animate-spin" style={{top: '40%', left: '80%', animationDuration: '12s'}}></div>
                            <div className="absolute w-5 h-5 border border-violet-400/25 rotate-45 animate-spin" style={{top: '60%', left: '50%', animationDuration: '18s', animationDirection: 'reverse'}}></div>
                        </div>
                    </div>

                    <main className="relative z-10 container mx-auto px-4 py-8">
                        {/* Header */}
                        <div className="text-center mb-12">
                            <div className="flex justify-center items-center mb-6">
                                <FilmIcon className="w-12 h-12 text-cyan-400 mr-4" />
                                <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                                    猫眼电影 API
                                </h1>
                            </div>
                            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                                获取完整的电影数据，包括票房信息、评分、剧情简介等详细内容
                            </p>
                        </div>

                        {/* Search Section */}
                        <div className="max-w-4xl mx-auto mb-12">
                             <div className="liquidGlass-wrapper">
                                <div className="liquidGlass-inner">
                                    <div className="liquidGlass-content">
                                    <div className="text-center mb-6">
                                        <h2 className="text-2xl font-semibold text-white mb-2">输入电影ID</h2>
                                        <p className="text-gray-300">输入猫眼电影的ID来获取详细信息</p>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                        <div className="flex-1 relative">
                                            <input
                                                type="text"
                                                value={movieId}
                                                onChange={(e) => setMovieId(e.target.value)}
                                                onKeyPress={handleKeyPress}
                                                placeholder="例如: 1413252"
                                                className="glass-input w-full px-6 py-4 text-white placeholder-gray-400 focus:outline-none text-lg"
                                            />
                                            <SearchIcon className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        </div>
                                        <button
                                            onClick={handleSearch}
                                            disabled={loading || !movieId.trim()}
                                            className="glass-button px-8 py-4 text-white font-semibold disabled:cursor-not-allowed"
                                        >
                                            {loading ? <LoaderIcon className="w-5 h-5 mx-auto" /> : '搜索电影'}
                                        </button>
                                    </div>
                                    
                                    <div className="text-center">
                                        <p className="text-gray-300 mb-3">试试这些示例ID：</p>
                                        <div className="flex flex-wrap justify-center gap-2">
                                            {exampleIds.map((id) => (
                                                <button key={id} onClick={() => { setMovieId(id); handleSearch(); }} className="menu-item">
                                                    {id}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {movieId.trim() && (
                                        <div className="mt-6 p-4 glass-movie-info">
                                            <div className="flex items-center justify-between relative z-10">
                                                <div className="flex-1">
                                                    <p className="text-slate-300 text-sm mb-1">API 端点:</p>
                                                    <p className="text-slate-300 font-mono text-sm break-all">
                                                        {window.location.origin}/api/movie/{movieId}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2 ml-4">
                                                    <button onClick={copyApiUrl} className="p-2 glass-icon-button" title="复制API链接">
                                                        <div className="relative z-10">
                                                            {copied ? <CheckIcon className="w-4 h-4 text-green-600" /> : <CopyIcon className="w-4 h-4 text-slate-300" />}
                                                        </div>
                                                    </button>
                                                    <button onClick={openApiInNewTab} className="p-2 glass-icon-button" title="在新窗口打开API">
                                                        <div className="relative z-10">
                                                            <ExternalLinkIcon className="w-4 h-4 text-slate-300" />
                                                        </div>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="max-w-4xl mx-auto mb-8">
                                <div className="liquidGlass-wrapper error">
                                    <div className="liquidGlass-inner">
                                        <div className="liquidGlass-content">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                                                    <span className="text-white font-bold">!</span>
                                                </div>
                                                <p className="text-red-700">{error}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Movie Data Display */}
                        {movieData && (
                            <div className="max-w-6xl mx-auto">
                                <div className="liquidGlass-wrapper">
                                    <div className="liquidGlass-inner">
                                        <div className="liquidGlass-content">
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                            {/* Movie Poster */}
                                            <div className="lg:col-span-1">
                                                <div className="aspect-[3/4] glass-movie-poster shadow-2xl">
                                                    {movieData.basic?.movieImg ? (
                                                        <img src={movieData.basic.movieImg} alt={movieData.basic?.movieName} className="w-full h-full object-cover" />
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
                                                    <h3 className="text-3xl font-bold text-white mb-2">{movieData.basic?.movieName || '未知电影'}</h3>
                                                    {movieData.basic?.movieEnName && <p className="text-xl text-slate-300 mb-4">{movieData.basic.movieEnName}</p>}
                                                </div>
                                                <div className="flex flex-wrap gap-4">
                                                    {movieData.rating?.MaoYanRating && (
                                                        <div className="glass-rating-badge px-5 py-3" style={{background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(239, 68, 68, 0.12) 50%, rgba(239, 68, 68, 0.08) 100%)'}}>
                                                            <div className="relative z-10 flex items-center">
                                                                <StarIcon className="w-5 h-5 text-red-400 mr-2" />
                                                                <span className="text-white font-semibold">猫眼 {movieData.rating.MaoYanRating}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {movieData.rating?.IMDBRating && (
                                                        <div className="glass-rating-badge px-5 py-3" style={{background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.25) 0%, rgba(251, 191, 36, 0.12) 50%, rgba(251, 191, 36, 0.08) 100%)'}}>
                                                            <div className="relative z-10 flex items-center">
                                                                <StarIcon className="w-5 h-5 text-yellow-400 mr-2" />
                                                                <span className="text-white font-semibold">IMDB {movieData.rating.IMDBRating}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="glass-movie-info">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {movieData.basic?.director && (
                                                        <div className="flex items-center">
                                                            <UserIcon className="w-5 h-5 text-purple-400 mr-3" />
                                                            <div>
                                                                <p className="text-white text-sm">导演</p>
                                                                <p className="text-slate-300">{movieData.basic.director}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {movieData.basic?.category && (
                                                        <div className="flex items-center">
                                                            <FilmIcon className="w-5 h-5 text-cyan-400 mr-3" />
                                                            <div>
                                                                <p className="text-white text-sm">类型</p>
                                                                <p className="text-slate-300">{movieData.basic.category}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {movieData.basic?.releaseDate && (
                                                         <div className="flex items-center">
                                                            <CalendarIcon className="w-5 h-5 text-green-400 mr-3" />
                                                            <div>
                                                                <p className="text-white text-sm">上映日期</p>
                                                                <p className="text-slate-300">{movieData.basic.releaseDate}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {movieData.basic?.duration && (
                                                        <div className="flex items-center">
                                                            <ClockIcon className="w-5 h-5 text-orange-400 mr-3" />
                                                            <div>
                                                                <p className="text-white text-sm">时长</p>
                                                                <p className="text-slate-300">{movieData.basic.duration}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {movieData.basic?.region && (
                                                        <div className="flex items-center">
                                                            <MapPinIcon className="w-5 h-5 text-pink-400 mr-3" />
                                                            <div>
                                                                <p className="text-white text-sm">地区</p>
                                                                <p className="text-slate-300">{movieData.basic.region}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {movieData.basic?.boxOffice && (
                                                        <div className="flex items-center">
                                                            <AwardIcon className="w-5 h-5 text-yellow-400 mr-3" />
                                                            <div>
                                                                <p className="text-white text-sm">票房</p>
                                                                <p className="text-slate-300 font-semibold">{movieData.basic.boxOffice}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    </div>
                                                </div>
                                                {movieData.plot?.summary && (
                                                    <div className="glass-movie-info p-6">
                                                        <div className="relative z-10">
                                                            <h4 className="text-lg font-semibold text-white mb-3">剧情简介</h4>
                                                            <p className="text-slate-300 leading-relaxed">{movieData.plot.summary}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {movieData._meta && (
                                                    <div className="text-xs text-slate-900 space-y-1 mt-4 pt-4 border-t border-white/10">
                                                        <p>数据来源: {movieData._meta.dataSources?.join(', ')}</p>
                                                        <p>请求时间: {movieData._meta.requestTime}</p>
                                                        {movieData._meta.fromCache && <p>数据来自缓存</p>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>

                    {/* Footer */}
                    <footer className="fixed bottom-0 w-full">
                        <div className="container mx-auto px-4 py-4">
                            <div className="fixed bottom-4 right-4">
                                <div className="glass-version-badge">
                                    <p className="text-xs text-white/70 font-medium">v1.1.0</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-center">
                                <a href="https://github.com/Ahua9527/maoyan_movie_api_cf" target="_blank" rel="noopener noreferrer" className="glass-footer-link text-white/70 hover:text-white/70 transition-colors duration-200">
                                    <div className="flex items-center space-x-2">
                                        <GithubIcon />
                                        <span>GitHub</span>
                                    </div>
                                </a>
                            </div>
                            <p className="mt-4 text-xs text-center text-white/50">
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

// Unified response creation function
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

// Main movie request handler
async function handleMovieRequest(movieId, env) {
  const cacheKey = `movie:${movieId}:v1.1.0`; // Version bump for new structure
  
  // Check cache
  const cached = await env.MOVIE_CACHE?.get(cacheKey);
  if (cached) {
    const data = JSON.parse(cached);
    data._meta.fromCache = true;
    data._meta.cacheTime = new Date().toISOString();
    return createResponse(data);
  }
  
  try {
    console.log(`🚀 Fetching full data for movie ${movieId}`);
    const startTime = Date.now();
    
    // Fetch data in parallel
    const [boxOfficeData, apiData] = await Promise.all([
      fetchBoxOfficeData(movieId),
      fetchApiData(movieId)
    ]);
    
    // Build response data
    const movieData = buildMovieData(boxOfficeData, apiData, movieId);
    movieData._meta = {
      requestTime: getUTC8Time(),
      dataType: 'complete',
      version: '1.1.0',
      fromCache: false,
      processingTime: Date.now() - startTime,
      dataSources: ['piaofang.maoyan.com', 'api.maoyan.com'],
      success: true
    };
    
    // Cache the data
    if (env.MOVIE_CACHE && movieData.basic?.movieName && movieData.basic.movieName !== '未知电影') {
      await env.MOVIE_CACHE.put(cacheKey, JSON.stringify(movieData), { expirationTtl: 3600 }); // Cache for 1 hour
      console.log(`✅ Data cached, TTL: 3600s`);
    }
    
    return createResponse(movieData);
    
  } catch (error) {
    console.error(`❌ Failed to fetch movie data:`, error);
    return createResponse({
      success: false,
      error: error.message,
      movieId: movieId,
      timestamp: new Date().toISOString(),
      version: "1.1.0"
    }, {}, 500);
  }
}

// Fetches box office data
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
    throw new Error(`Box office data fetch failed: HTTP ${response.status}`);
  }
  
  const html = await response.text();
  console.log(`✅ Box office data fetched successfully, length: ${html.length}`);
  return html;
}

// Fetches API data
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
    throw new Error(`API data fetch failed: HTTP ${response.status}`);
  }
  
  const data = await response.json();
  console.log(`✅ API data fetched successfully`);
  return data;
}

// Builds the movie data object
function buildMovieData(boxOfficeHtml, apiData, movieId) {
  const result = { movieId };
  
  // Basic info
  result.basic = extractBasicInfo(boxOfficeHtml, apiData, movieId);
  
  // Rating data
  result.rating = {
    MaoYanRating: extract(boxOfficeHtml, /<span class="rating-num">([\d.]+)<\/span>/, 1),
    IMDBRating: extract(boxOfficeHtml, /IMDb\s+([\d.]+)/, 1)
  };
  
  // Plot summary
  result.plot = {
    summary: apiData?.data?.movie?.dra || null,
    ...(apiData ? {} : { error: 'API data fetch failed' })
  };
  
  // Cast & Awards (limited)
  result.castCrew = {
    actors: [],
    note: 'Due to data source limitations, detailed actor information is currently unavailable',
    limitation: 'Multiple API endpoints tested, all return 404 errors'
  };
  
  result.awards = {
    list: [],
    note: 'Due to data source limitations, award information is currently unavailable',
    limitation: 'Multiple API endpoints tested, all return 404 errors'
  };
  
  return result;
}

// Extracts basic info
function extractBasicInfo(html, apiData, movieId) {
  // Extract basic info from box office page
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
  
  // Supplement and override with API data if available
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

// Generic extraction function
function extract(html, regex, groupIndex = 1) {
  if (!html || !regex) return null;
  const match = html.match(regex);
  return match && match[groupIndex] ? match[groupIndex].trim() : null;
}

// Extracts box office data
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

// Formats image URL
function formatImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('//')) return 'https:' + url;
  if (url.startsWith('/')) return 'https://piaofang.maoyan.com' + url;
  return url;
}

// Gets UTC+8 time
function getUTC8Time() {
  const now = new Date();
  const utc8Time = new Date(now.getTime() + (8 * 60 * 60 * 1000));
  return utc8Time.toISOString().replace('Z', '+08:00');
}
