import React from 'react';
import { WritableApp } from '@/components/WritableApp';
import { ReadonlySharePage } from '@/components/ReadonlyShare';
import { useHashRoute } from '@/hooks/useHashRoute';

const App: React.FC = () => {
  const route = useHashRoute();

  // 模式归属完全由 URL 决定：
  // - 根路径（及任何非 share 的 hash）：可写界面
  // - #/share/<token>：只读界面，且语音识别、三栏写入控件均不挂载，
  //   入口失效/权限不足时停留在只读错误态，绝不退化为可写
  if (route.name === 'share') {
    return <ReadonlySharePage token={route.token} />;
  }

  return <WritableApp />;
};

export default App;
