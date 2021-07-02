import * as babel from "@babel/standalone"
import { Project } from "ts-morph"
// @ts-ignore
import reactRefreshPlugin from "react-refresh/babel"
//@ts-ignore
import * as babelTransformReactJsxSource from "@babel/plugin-transform-react-jsx-source"

import { JS_EXTENSIONS } from "../util/constants"
import { changeImports, stripExtension } from "./codeHandlers"

export interface IFiles {
  [path: string]: string
}

babel &&
  babel.registerPreset("iteriaPreset", {
    presets: [
      [babel.availablePresets.typescript],
      [babel.availablePresets.react],
      [
        babel.availablePresets.env,
        {
          targets: {
            esmodules: true,
          },
          modules: false,
        },
      ],
    ],
    plugins: [
      [babelTransformReactJsxSource],
      [reactRefreshPlugin, { skipEnvCheck: true }],
    ],
  })

const project = new Project({ useInMemoryFileSystem: true })

const transpileBabelStandalone = (code: string, filename: string) =>
  babel.transform(code, { filename, presets: ["iteriaPreset"] })

export const transpileFiles = (files: IFiles) => {
  const mappedFiles: IFiles = {}

  for (const filePath in files) {
    if (filePath.startsWith("/node_modules/")) {
      mappedFiles[filePath] = files[filePath]
      continue
    }

    if (JS_EXTENSIONS.some(e => filePath.endsWith(e))) {
      const newPath = stripExtension(filePath)

      try {
        const data = transpileBabelStandalone(files[filePath], filePath)
        if (data?.code) {
          const importsCode = changeImports(
            project.createSourceFile(filePath, data.code, {
              overwrite: true,
            }),
            filePath
          )
          const finalCode = addCustomRefreshReg(importsCode, filePath)
          mappedFiles[newPath] = finalCode
        }
      } catch (err) {
        console.error(err)
        return { error: err }
      }
    } else if (filePath.endsWith(".json")) {
      mappedFiles[filePath] = "export default" + files[filePath]
    }
  }
  return mappedFiles
}

export const transpileSingleFile = (path: string, data: string) => {
  if (path.endsWith(".json")) return "export default" + data

  try {
    const transpiled = transpileBabelStandalone(data, path)

    const importsCode = changeImports(
      project.createSourceFile(path, transpiled.code, {
        overwrite: true,
      }),
      path
    )

    const finalCode = addCustomRefreshReg(importsCode, path)
    return finalCode
  } catch (err) {
    console.error(err.message)
    return { error: err }
  }
}

const addCustomRefreshReg = (code: string, path: string) =>
  `
    function $RefreshReg$(c, id) {
      const path = "${path}"
      window.$RefreshRegGlobal$(c, path + '/' + id)
    }
    ` + code
