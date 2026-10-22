import type { NextConfig } from "next";

// GitHub Pages 的项目站点会部署在 /karzone-demo 子路径下
const isGitHubPages = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  // 导出为纯静态网页，方便演示、压缩和部署到静态托管平台
  output: "export",
  // 每个页面生成独立目录，普通静态服务器也能正确处理页面跳转
  trailingSlash: true,
  // 本地开发仍使用根路径，GitHub 构建时自动补上仓库路径
  basePath: isGitHubPages ? "/karzone-demo" : "",
};

export default nextConfig;
