import { defineConfig } from "vite"
import * as cryptoBrowserify from "crypto-browserify"
// ...
export default defineConfig({
  // ...
  define: {
    "process.env": {},
    // crypto: cryptoBrowserify,
  },
})
