import * as Comlink from "comlink"

import { transpileFiles, transpileSingleFile } from "../transpile"

Comlink.expose({ transpileFiles, transpileSingleFile })
