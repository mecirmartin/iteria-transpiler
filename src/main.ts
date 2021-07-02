import * as Comlink from "comlink"
import { IFiles } from "./transpile"

import transpileWorker from "./workers/transpileWorker?worker"

interface ITranspiler {
  transpileFiles: (files: IFiles) => IFiles | { error: any }
  transpileSingleFile: (path: string, data: string) => string | { error: any }
}

const worker = new transpileWorker()
const IteriaTranspiler: Comlink.Remote<ITranspiler> = Comlink.wrap(worker)

export default IteriaTranspiler
