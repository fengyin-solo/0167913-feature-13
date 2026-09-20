import { useEffect, useState } from 'react';

export type RouteState =
  | { name: 'home' }
  | { name: 'share'; token: string };

// 解析当前 hash。只有形如 #/share/<token> 的路径是只读分享入口，
// 其余任意值一律视为可写首页，避免脏 hash 影响归属。
const parseHash = (): RouteState => {
  const hash = window.location.hash.replace(/^#/, '');
  const match = hash.match(/^\/share\/([^/]+)\/?$/);
  if (match) {
    return { name: 'share', token: decodeURIComponent(match[1]) };
  }
  return { name: 'home' };
};

// hash 路由：模式归属完全由 URL 决定，刷新、重开、前进后退都保持一致
export const useHashRoute = (): RouteState => {
  const [route, setRoute] = useState<RouteState>(() =>
    typeof window === 'undefined' ? { name: 'home' } : parseHash()
  );

  useEffect(() => {
    const onChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return route;
};
