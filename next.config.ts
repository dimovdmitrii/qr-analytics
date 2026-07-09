import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // enables the slim Docker image in ./Dockerfile
};

export default nextConfig;
