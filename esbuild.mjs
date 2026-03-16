import esbuild from "esbuild";

const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
	name: "esbuild-problem-matcher",

	setup(build) {
		build.onStart(() => {
			console.log("[watch] build started");
		});
		build.onEnd((result) => {
			result.errors.forEach(({ text, location }) => {
				console.error(`✘ [ERROR] ${text}`);
				console.error(`    ${location.file}:${location.line}:${location.column}:`);
			});
			console.log("[watch] build finished");
		});
	},
};

const baseConfig = {
	bundle: true,
	minify: production,
	sourcemap: !production,
	sourcesContent: false,
	define: {
		APP_NAME: JSON.stringify("CodeChat"),
	},
};

async function main() {
	const extCtx = await esbuild.context({
		...baseConfig,
		entryPoints: ["src/extension.ts"],
		format: "cjs",
		platform: "node",
		outfile: "dist/extension.js",
		external: ["vscode"],
		logLevel: "silent",
		plugins: [
			/* add to the end of plugins array */
			esbuildProblemMatcherPlugin,
		],
	});
	// --- Webview React ---
	const webviewCtx = await esbuild.context({
		...baseConfig,
		entryPoints: ["src/webview/views/main.tsx"],
		format: "iife", // navigateur, pas node
		platform: "browser",
		outdir: "dist/views",
	});

	if (watch) {
		await Promise.all([extCtx.watch(), webviewCtx.watch()]);
		console.log("👀 Watching...");
		return;
	}

	await Promise.all([extCtx.rebuild(), webviewCtx.rebuild()]);
	await Promise.all([extCtx.dispose(), webviewCtx.dispose()]);
	console.log("✅ Build done");
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
