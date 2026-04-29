import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const serverOnlyPath = path.join(process.cwd(), "node_modules/server-only/index.js");

let originalContent = "";
if (fs.existsSync(serverOnlyPath)) {
  originalContent = fs.readFileSync(serverOnlyPath, "utf8");
}

try {
  if (originalContent) {
    // Comment out the throw statement
    const commentedContent = originalContent.replace(
      /throw new Error\([\s\S]*?\);/,
      "/* commented out by auth:generate script */"
    );
    fs.writeFileSync(serverOnlyPath, commentedContent, "utf8");
  }

  console.log("Running better-auth CLI schema generation...");
  
  // Forward all CLI arguments to the actual CLI
  const args = process.argv.slice(2).join(" ");
  execSync(`bun x @better-auth/cli@latest generate --config ./lib/auth/auth.ts --output ./db/schema/new-auth-schema.ts ${args}`, {
    stdio: "inherit",
  });

} catch (error) {
  // Error is printed by stdio: inherit
} finally {
  if (originalContent && fs.existsSync(serverOnlyPath)) {
    fs.writeFileSync(serverOnlyPath, originalContent, "utf8");
  }
}
