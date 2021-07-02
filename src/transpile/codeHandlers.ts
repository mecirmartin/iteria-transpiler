import { ImportDeclaration, SourceFile } from "ts-morph"

export const stripExtension = (fileName: string) => {
  const dot = fileName.lastIndexOf(".")
  const hasExtension = dot > 0 && dot < fileName.length
  if (hasExtension) {
    return fileName.substring(0, dot)
  }

  return fileName
}

export const changeImports = (sourceFile: SourceFile, filePath: string) => {
  const imports = sourceFile.getImportDeclarations()

  imports.forEach(i => {
    let importString = i.getModuleSpecifierValue()
    // TODO Node resolve
    if (importString === "./" || importString === ".") {
      i.setModuleSpecifier("./index")
    }

    if (!i.isModuleSpecifierRelative() && importString.startsWith("src/")) {
      // Here i am processing absolute imports
      // https://dev.to/mr_frontend/absolute-imports-in-create-react-app-3ge8
      let relativePath = absoluteToRelativePath(
        prefixString(importString, "/"),
        filePath
      )

      i.setModuleSpecifier(relativePath)
    } else if (
      !i.isModuleSpecifierRelative() &&
      !importString.endsWith(".css")
    ) {
      replaceDependencyImports(i)
    } else if (importString.endsWith(".css")) {
      // Comment out CSS Imports
      i.replaceWithText(`//${i.getText()}`)
    }
  })
  return sourceFile.print()
}

const absoluteToRelativePath = (absolutePath: string, currentPath: string) => {
  const folders = currentPath.split("/")
  let relativePath = ""

  folders.pop()
  const current = folders[folders.length - 1]
  if (absolutePath.match(`/${current}/`)) {
    const substring = absolutePath.substring(
      absolutePath.lastIndexOf(`/${current}/`) + `/${current}/`.length
    )
    return "./" + substring
  } else {
    relativePath += "../"
    folders.pop()
  }

  while (folders.length > 0) {
    const current = folders.pop()
    if (absolutePath.match(`/${current}/`)) {
      const substring = absolutePath.substring(
        absolutePath.lastIndexOf(`/${current}/`) + `/${current}/`.length
      )
      return relativePath + substring
    } else {
      relativePath += "../"
    }
  }
  return absolutePath
}

const replaceDependencyImports = (i: ImportDeclaration) => {
  const defaultImport = `const ${
    i.getDefaultImport()?.print() ?? i.getNamespaceImport()?.print()
  } = requireDefault('${i.getModuleSpecifierValue()}')`

  const namedImports = `const { ${i
    .getNamedImports()
    .map(imp => imp.print().replaceAll(/as/g, ":"))
    .join(",")} } = require('${i.getModuleSpecifierValue()}')`

  if (i.getNamedImports().length && i.getDefaultImport()) {
    i.replaceWithText(defaultImport + "\n" + namedImports)
  } else if (i.getDefaultImport() || i.getNamespaceImport()) {
    i.replaceWithText(defaultImport)
  } else if (i.getNamedImports()) {
    i.replaceWithText(namedImports)
  }
}

const prefixString = (string: string, prefix: string) =>
  string.startsWith(prefix) ? string : prefix + string
