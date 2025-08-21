import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import ContextMenuProvider from './Contexts/ContextMenuProvider.tsx'
import { ConfigProvider, ThemeConfig } from 'antd';

const antdTheme: ThemeConfig = {
  cssVar: true,
  token: {
    colorPrimary: "#EB5E0F"
  },
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ContextMenuProvider>
      <ConfigProvider theme={antdTheme}>
        <App />
      </ConfigProvider>
    </ContextMenuProvider>
  </React.StrictMode>,
)
