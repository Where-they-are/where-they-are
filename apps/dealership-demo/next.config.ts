import { varlockNextConfigPlugin } from "@varlock/nextjs-integration/plugin";
import type { NextConfig } from "next";

const withVarlock = varlockNextConfigPlugin();

const nextConfig: NextConfig = {
	images: {
		formats: ["image/avif", "image/webp"],
	},
	output: "standalone",
	poweredByHeader: false,
	typedRoutes: true,
};

export default withVarlock(nextConfig);
