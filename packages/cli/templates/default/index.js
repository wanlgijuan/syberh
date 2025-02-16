const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')
const { exec } = require('child_process')
const ora = require('ora')
const { log } = require('../../dist/util/log')
const { getRootPath } = require('../../dist/util')
const {
  SOURCE_DIR
} = require('../../dist/config/index').default

// syberh app 模块目录
const platformsDirName = 'platforms'

exports.createPage = function (creater, params, cb) {
  const { projectDir, src, template } = params
  let pageCSSName
  const sourceDir = path.join(projectDir, src)
  creater.template(template, 'scss', path.join(sourceDir, 'www', pageCSSName))
  creater.fs.commit(() => {
    if (typeof cb === 'function') {
      cb()
    }
  })
}

function getTemplatePath (template = 'default') {
  return path.join(getRootPath(), 'templates', template)
}

// 只创建核心项目
exports.createCore = function () {
  log.verbose('createCore()')
  // cli 下的核心文件
  const app = path.join(getTemplatePath(), 'platforms', 'syberos', 'app')
  const vendor = path.join(getTemplatePath(), 'platforms', 'syberos', 'vendor')
  const spmJson = path.join(getTemplatePath(), 'platforms', 'syberos', 'spm.json')
  const versionPath = path.join(getTemplatePath(), 'platforms', 'syberos', 'VERSION')
  const jssdkPath = path.join(getTemplatePath(), 'www', 'lib', 'syberh.min.js')
  log.verbose('app path ', app)
  log.verbose('versionConfig', versionPath)
  log.verbose('jssdkPath', jssdkPath)
  // project dir
  const projectDir = path.resolve(process.cwd())
  log.verbose('projectDir path', projectDir)

  const projectSyberosDir = path.join(projectDir, platformsDirName, 'syberos')
  log.verbose('projectSyberosDir path', projectSyberosDir)

  const projectAppDir = path.join(projectSyberosDir, 'app')
  log.verbose('projectAppDir path', projectAppDir)

  const projectVendor = path.join(projectSyberosDir, 'vendor')
  const projectSpmJson = path.join(projectSyberosDir, 'spm.json')
  log.verbose('projectVendor path', projectVendor)

  const projectVersionPath = path.join(projectDir, platformsDirName, 'syberos', 'VERSION')
  log.verbose('projectVersionPath', projectVersionPath)

  const projecwJSSDK = path.join(projectDir, 'www', 'lib', 'syberh.min.js')
  log.verbose('projecwJSSDK', projecwJSSDK)
  // 删除 app com 目录
  fs.ensureDirSync(projectAppDir)
  log.verbose('removeSync 完成')

  // 重新拷贝app com 目录
  log.verbose('开始拷贝cli app目录')
  fs.copySync(app, projectAppDir)
  fs.copySync(versionPath, projectVersionPath)
  log.verbose('拷贝VERSION完成')
  fs.copySync(jssdkPath, projecwJSSDK)
  log.verbose('拷贝JS-SDK完成')
  fs.copySync(vendor, projectVendor)
  fs.copySync(spmJson, projectSpmJson)
  log.verbose('拷贝vendor完成')
  console.log(
    `${chalk.green('✔ ')}更新 [project] 完成`
  )
}
exports.createApp = function (creater, params, helper, cb) {
  const {
    projectName,
    projectDir,
    appName,
    webPath,
    template,
    typescript,
    src,
    css,
    sopid,
    example,
    targetName
  } = params

  // APP 模板目录
  const syberosDir = 'syberos'

  const target = 'target-armv7tnhl-' + targetName
  const targetSimulator = 'target-i686-' + targetName

  const libDir = 'lib'
  const projectPath = path.join(projectDir, projectName)
  const sourceDir = path.join(projectPath, src)
  const platformsDir = path.join(projectPath, platformsDirName)
  const version = helper.getPkgVersion()
  const yarnLockfilePath = path.join('yarn-lockfiles', `${version}-yarn.lock`)
  const shouldUseYarn = helper.shouldUseYarn()
  const useNpmrc = shouldUseYarn === false
  const useYarnLock =
    shouldUseYarn &&
    fs.existsSync(creater.templatePath(template, yarnLockfilePath))
  let pageCSSName
  // let appCSSName

  params.page = 'index'
  fs.ensureDirSync(projectPath)
  fs.ensureDirSync(sourceDir)
  fs.ensureDirSync(path.join(sourceDir, 'lib'))
  fs.ensureDirSync(platformsDir)

  // 拷贝APP模板工程
  fs.copySync(
    path.join(creater.templatePath(), template, platformsDirName),
    platformsDir
  )

  // 拷贝Lib模板工程
  fs.copySync(
    path.join(creater.templatePath(), template, libDir),
    path.join(sourceDir, 'lib')
  )

  // 创建package.json
  creater.template(template, 'pkg', path.join(projectPath, 'package.json'), {
    description: appName,
    projectName,
    version,
    css,
    typescript,
    template
  })

  // 创建project.config.json
  creater.template(
    template,
    'project',
    path.join(projectPath, 'project.config.json'),
    {
      appName,
      webPath,
      projectName,
      sopid,
      target,
      targetSimulator
    }
  )

  // 创建默认git忽略
  creater.template(template, 'gitignore', path.join(projectPath, '.gitignore'))
  creater.template(
    template,
    'editorconfig',
    path.join(projectPath, '.editorconfig')
  )

  // 是否创建demo项目
  if (example) {
    fs.copySync(
      path.join(creater.templatePath(), template, SOURCE_DIR),
      path.join(sourceDir)
    )
  } else {
    // 创建index.html
    creater.template(template, 'indexhtml', path.join(sourceDir, 'index.html'))
  }

  switch (css) {
    default:
      pageCSSName = 'index.css'
      break
  }
  // 创建 默认 index.css
  creater.template(template, 'scss', path.join(sourceDir, pageCSSName))

  // 创建syberos.pri文件
  creater.template(
    template,
    'syberconfig/syberospri',
    path.join(platformsDir, syberosDir, 'syberos.pri'),
    {
      sopid
    }
  )

  creater.template(
    template,
    'syberconfig/sopconfigxml',
    path.join(platformsDir, syberosDir, `sopconfig.xml`),
    {
      appName,
      projectName,
      sopid
    }
  )

  if (useNpmrc) {
    creater.template(template, 'npmrc', path.join(projectPath, '.npmrc'))
  }
  if (useYarnLock) {
    creater.template(
      template,
      yarnLockfilePath,
      path.join(projectPath, 'yarn.lock')
    )
  }
  creater.fs.commit(() => {
    console.log(
      `${chalk.green('✔ ')}${chalk.grey(
        `创建项目: ${chalk.grey.bold(projectName)}`
      )}`
    )
    console.log(
      `${chalk.green('✔ ')}${chalk.grey(
        `创建模板目录: ${projectName}/${platformsDirName}`
      )}`
    )

    console.log(
      `${chalk.green('✔ ')}${chalk.grey(
        `拷贝APP模板: ${projectName}/${platformsDirName}/${syberosDir}`
      )}`
    )

    console.log(
      `${chalk.green('✔ ')}${chalk.grey(`创建www目录: ${projectName}/${src}`)}`
    )

    // 是否创建demo项目
    if (example) {
      console.log(
        `${chalk.green('✔ ')}${chalk.grey(
          `创建 example : ${projectName}/${src}`
        )}`
      )
    } else {
      console.log(
        `${chalk.green('✔ ')}${chalk.grey(
          `创建文件: ${projectName}/${src}/index.html`
        )}`
      )
    }

    console.log(
      `${chalk.green('✔ ')}${chalk.grey(
        `创建文件: ${projectName}/.editorconfig`
      )}`
    )
    console.log(
      `${chalk.green('✔ ')}${chalk.grey(`创建文件: ${projectName}/.gitignore`)}`
    )
    console.log(
      `${chalk.green('✔ ')}${chalk.grey(
        `创建文件: ${projectName}/package.json`
      )}`
    )
    console.log(
      `${chalk.green('✔ ')}${chalk.grey(
        `创建文件: ${projectName}/project.config.json`
      )}`
    )
    if (useNpmrc) {
      console.log(
        `${chalk.green('✔ ')}${chalk.grey(`创建文件: ${projectName}/.npmrc`)}`
      )
    }
    if (useYarnLock) {
      console.log(
        `${chalk.green('✔ ')}${chalk.grey(
          `创建文件: ${projectName}/yarn.lock`
        )}`
      )
    }
    console.log()

    // git init
    gitInit(projectName, projectPath, () => {
      // install
      npmInstall(shouldUseYarn, projectName, helper, cb)
    })
  })
}

function gitInit (projectName, projectPath, next) {
  const gitInitSpinner = ora(
    `cd ${chalk.cyan.bold(projectName)}, 执行 ${chalk.cyan.bold('git init')}`
  ).start()
  process.chdir(projectPath)

  const cmd = exec('git init')
  cmd.on('close', code => {
    if (code === 0) {
      gitInitSpinner.color = 'green'
      gitInitSpinner.succeed(cmd.stdout.read())
      if (typeof next === 'function') {
        next()
      }
    } else {
      gitInitSpinner.color = 'red'
      gitInitSpinner.fail(cmd.stderr.read())
    }
  })
}

function npmInstall (shouldUseYarn, projectName, helper, cb) {
  // install
  let command
  if (shouldUseYarn) {
    command = 'yarn install'
  } else if (helper.shouldUseCnpm()) {
    command = 'cnpm install'
  } else {
    command = 'npm install'
  }
  const installSpinner = ora(
    `执行安装项目依赖 ${chalk.cyan.bold(command)}, 需要一会儿...`
  ).start()
  exec(command, (error, stdout, stderr) => {
    if (error) {
      installSpinner.color = 'red'
      installSpinner.fail(chalk.red('安装项目依赖失败，请自行重新安装！'))
      console.log(error)
    } else {
      installSpinner.color = 'green'
      installSpinner.succeed('安装成功')
      console.log(`${stderr}${stdout}`)
    }
    console.log(
      chalk.green(`创建项目 ${chalk.green.bold(projectName)} 成功！`)
    )
    console.log(
      chalk.green(
        `请进入项目目录 ${chalk.green.bold(projectName)} 开始工作吧！😝`
      )
    )
    if (typeof cb === 'function') {
      cb()
    }
  })
}
