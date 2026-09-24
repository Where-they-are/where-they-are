import { varlockNextConfigPlugin } from "@varlock/nextjs-integration/plugin";

const withVarlock = varlockNextConfigPlugin();

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	output: "standalone",
	reactCompiler: true,
	typedRoutes: true,
};

export default withVarlock(nextConfig);
