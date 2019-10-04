import os, osproc, parsecfg, parseopt, rdstdin, strutils, terminal, times

import contra        # https://github.com/juancarlospaco/nim-contra#contra

import
  nimwcpkg/constants/constants, nimwcpkg/enums/enums,
  nimwcpkg/databases/databases, nimwcpkg/files/files

when defined(postgres): import db_postgres
else:                   import db_sqlite

when not defined(firejail): {. warning: "Firejail is disabled, running unsecure." .}
else:                       from firejail import firejailVersion, firejailFeatures

hardenedBuild()


when not defined(contracts): {.warning: "Design by Contract is Disabled, Running Unassertive.".}
when not defined(ssl):       {.warning: "SSL is Disabled, Running Unsecure.".}
when not defined(firejail):  {.warning: "Firejail is Disabled, Running Unsecure.".}


var
  runInLoop = true
  nimwcMain: Process


macro configExists(): untyped =
  ## Macro to check if the config file is present
  let dir = parentDir(currentSourcePath())
  if not fileExists(replace(dir, "/nimwcpkg", "") & "/config/config.cfg"):
    echo config_not_found_msg
    discard staticExec("cp " & dir & "/config/config_default.cfg " & dir & "/config/config.cfg")

configExists()


proc updateNimwc() =
  ## GIT hard update
  preconditions(existsDir"plugins/", existsDir"public/css/", existsDir"public/js/",
    existsFile"plugins/plugin_import.txt", existsFile"public/css/style_custom.css",
    existsFile"public/js/js_custom.js", findExe"git".len > 0)
  # No postconditions because we directly quit anyways.
  const cmd = "git fetch --all ; git reset --hard origin/master"
  let
    pluginImport = readFile"plugins/plugin_import.txt"  # Save contents
    styleCustom = readFile"public/css/style_custom.css"
    jsCustom = readFile"public/js/js_custom.js"
    humansTxt = readFile"public/humans.txt"
  when not defined(release): echo cmd
  discard execCmd(cmd)
  writeFile("plugins/plugin_import.txt", pluginImport)  # Write contents back
  writeFile("public/css/style_custom.css", styleCustom)
  writeFile("public/js/js_custom.js", jsCustom)
  writeFile("public/humans.txt", humansTxt)
  echo "\n\n\nTo finish the update:\n - Compile NimWC\n - Run with the arg `--newdb`\n"
  quit("Git fetch done\n", 0)


proc pluginSkeleton() =
  ## Creates the skeleton (folders and files) for a plugin
  styledEcho(fgCyan, bgBlack, skeletonMsg)
  let pluginName = normalize(readLineFromStdin("Plugin name?: "))
  assert pluginName.len > 1, "Plugin name must not be empty string: " & pluginName

  # Create dirs
  discard existsOrCreateDir("tmp")
  let folder = "tmp" / pluginName
  let user = getEnv("USER", "YourUser")
  discard existsOrCreateDir(folder)
  discard existsOrCreateDir(folder / "public")

  # Create files
  writeFile(folder / pluginName & ".nim", reqCode.format(pluginName))
  writeFile(folder / "routes.nim", reqRoutes.format(pluginName))
  writeFile(folder / "public" / "js.js",
    "/* https://github.com/pragmagic/karax OR Vanilla JavaScript */\n")
  writeFile(folder / "public" / "style.css",
    "/* https://bulma.io/documentation OR https://getbootstrap.com OR clean CSS */\n")

  if readLineFromStdin("Generate optional NimWC files? (y/N): ").string.strip.toLowerAscii == "y":
    writeFile(folder / "public/js_private.js", "")
    writeFile(folder / "public/style_private.css", "")
    writeFile(folder / "html.nimf", "<!-- https://nim-lang.org/docs/filters.html -->\n")
    writeFile(folder / pluginName & ".nim.cfg",
      "# https://nim-lang.org/docs/parsecfg.html\n")

  if readLineFromStdin("Generate optional .gitignore file? (y/N): ").normalize == "y":
    writeFile(folder / ".gitattributes", "*.* linguist-language=Nim\n")
    writeFile(folder / ".gitignore", "*.c\n*.h\n*.o\n*.sql\n*.log\n*.s")

  if readLineFromStdin("Generate optional Documentation files? (y/N): ").normalize == "y":
    let ext = if readLineFromStdin("Use Markdown(MD) instead of ReSTructuredText(RST)? (y/N): ").normalize == "y": "md" else: "rst"
    writeFile(folder / "LICENSE." & ext, "See https://tldrlegal.com/licenses/browse\n")
    writeFile(folder / "CODE_OF_CONDUCT." & ext, "")
    writeFile(folder / "CONTRIBUTING." & ext, "")
    writeFile(folder / "AUTHORS." & ext, "# Authors\n\n- " & user & "\n")
    writeFile(folder / "README." & ext, "# " & pluginName & "\n")
    writeFile(folder / "CHANGELOG." & ext, "# 0.0.1\n\n- First initial version of " & pluginName & " created at " & $now())

  writeFile(folder / "plugin.json",
    pluginJson.format(capitalizeAscii(pluginName), pluginName, user, NimblePkgVersion.substr(0, 2)))
  quit("\nNimWC created a new Plugin skeleton, happy hacking, bye.\n", 0)


proc backupOldLogs(logFilePath: string): tuple[output: TaintedString, exitCode: int] =
  ## Compress all old rotated Logs.
  assert existsDir(logFilePath), "logFilePath File not found"
  assert findExe("tar").len > 0, "Tar not found"
  var files2tar: seq[string]
  for logfile in walkFiles(logFilePath / "*.log"): files2tar.add logfile
  if files2tar.len > 1:
    let cmd = cmdTar & "logs-" & replace($now(), ":", "_") & ".tar.gz " & files2tar.join" "
    result = execCmdEx(cmd)
    if result.exitCode == 0:
      for filename in files2tar: discard tryRemoveFile(filename)


proc handler() {.noconv.} =
  ## Catch ctrl+c from user
  runInLoop = false
  kill(nimwcMain)
  styledEcho(fgYellow, bgBlack, "CTRL+C Pressed, NimWC is shutting down, bye.")
  quit()

setControlCHook(handler)


proc launcherActivated(cfg: Config) =
  ## 1) Executing the main-program in a loop.
  ## 2) Each time a new compiled file is available,
  ##    the program exits the running process and starts a new
  styledEcho(fgGreen, bgBlack, $now() & ": Nim Website Creator: Launcher starting.")
  var nimwcCommand: string
  let
    args = replace(commandLineParams().join(" "), "-", "")
    userArgsRun = if args == "": "" else: " --run " & args
    appPath = getAppDir() / "nimwcpkg" / cfg.getSectionValue("Server", "appname")
  when not defined(firejail):
    nimwcCommand = appPath & userArgsRun
  else:
    let
      cpuCores = cfg.getSectionValue("firejail", "cpuCoresByNumber").parseInt
      corez = if cpuCores != 0: toSeq(0..cpuCores) else: @[]
      hostz = cfg.getSectionValue("firejail", "hostsFile").strip
      dnsz = [cfg.getSectionValue("firejail", "dns0").strip, cfg.getSectionValue("firejail", "dns1").strip,
              cfg.getSectionValue("firejail", "dns2").strip, cfg.getSectionValue("firejail", "dns3").strip]
    assert countProcessors() > cpuCores, "Dedicated CPU Cores must be less or equal to the actual CPU Cores: " & $cpuCores
    assert hostz.existsFile, "Hosts file not found: " & hostz
    let myjail = Firejail(
      noDvd:         cfg.getSectionValue("firejail", "noDvd").parseBool,
      noSound:       cfg.getSectionValue("firejail", "noSound").parseBool,
      noAutoPulse:   cfg.getSectionValue("firejail", "noAutoPulse").parseBool,
      no3d:          cfg.getSectionValue("firejail", "no3d").parseBool,
      noX:           cfg.getSectionValue("firejail", "noX").parseBool,
      noVideo:       cfg.getSectionValue("firejail", "noVideo").parseBool,
      noDbus:        cfg.getSectionValue("firejail", "noDbus").parseBool,
      noShell:       cfg.getSectionValue("firejail", "noShell").parseBool,
      noDebuggers:   cfg.getSectionValue("firejail", "noDebuggers").parseBool,
      noMachineId:   cfg.getSectionValue("firejail", "noMachineId").parseBool,
      noRoot:        cfg.getSectionValue("firejail", "noRoot").parseBool,
      noAllusers:    cfg.getSectionValue("firejail", "noAllusers").parseBool,
      noU2f:         cfg.getSectionValue("firejail", "noU2f").parseBool,
      privateTmp:    cfg.getSectionValue("firejail", "privateTmp").parseBool,
      privateCache:  cfg.getSectionValue("firejail", "privateCache").parseBool,
      privateDev:    cfg.getSectionValue("firejail", "privateDev").parseBool,
      forceEnUsUtf8: cfg.getSectionValue("firejail", "forceEnUsUtf8").parseBool,
      caps:          cfg.getSectionValue("firejail", "caps").parseBool,
      seccomp:       cfg.getSectionValue("firejail", "seccomp").parseBool,
      noTv:          cfg.getSectionValue("firejail", "noTv").parseBool,
      writables:     cfg.getSectionValue("firejail", "writables").parseBool,
      noMnt:         cfg.getSectionValue("firejail", "noMnt").parseBool,
    )
    nimwcCommand = myjail.makeCommand(
      command=appPath & userArgsRun,
      name = cfg.getSectionValue("Server", "appname"), # whitelist= @[getAppDir(), getCurrentDir()],
      maxSubProcesses = cfg.getSectionValue("firejail", "maxSubProcesses").parseInt * 1_000_000,  # 1 is Ok, 0 is Disabled, int.high max.
      maxOpenFiles = cfg.getSectionValue("firejail", "maxOpenFiles").parseInt * 1_000,        # Below 1000 NimWC may not start.
      maxFileSize = cfg.getSectionValue("firejail", "maxFileSize").parseInt * 1_000_000_000,  # Below 1Mb NimWC may not start.
      maxPendingSignals = cfg.getSectionValue("firejail", "maxPendingSignals").parseInt * 10, # 1 is Ok, 0 is Disabled, int.high max.
      timeout = cfg.getSectionValue("firejail", "timeout").parseInt,                          # 1 is Ok, 0 is Disabled, 255 max. It will actually Restart instead of Stopping.
      maxRam = cfg.getSectionValue("firejail", "maxRam").parseInt * 1_000_000_000,            # Below 1Gb NimWC may fail.
      maxCpu = cfg.getSectionValue("firejail", "maxCpu").parseInt,                            # 1 is Ok, 0 is Disabled, 255 max.
      cpuCoresByNumber = corez,                                                                # 0 is Disabled, else toSeq(0..corez)
      hostsFile = hostz,        # Optional Alternative/Fake /etc/hosts
      dnsServers = dnsz,        # Optional Alternative/Fake DNS, 4 Servers must be provided
    )

  const processOpts =
    when defined(release): {poParentStreams, poEvalCommand}
    else:                  {poParentStreams, poEvalCommand, poEchoCmd}
  nimwcMain = startProcess(nimwcCommand, options = processOpts)

  while runInLoop:
    # If nimha_main has been recompile, check for a new version
    if fileExists(appPath & "_new"):
      kill(nimwcMain)
      moveFile(appPath & "_new", appPath)

    # Loop to check if nimwc_main is running
    if not running(nimwcMain):
      # Quit if user has provided arguments
      if args.len != 0:
        styledEcho(fgYellow, bgBlack, $now() & ": User provided arguments: " & args)
        styledEcho(fgYellow, bgBlack, $now() & ": Run again without arguments, exiting.")
        quit()

      styledEcho(fgYellow, bgBlack, $now() & ": Restarting in 1 second.")
      sleep(1000)

      # Start nimha_main as process
      nimwcMain = startProcess(nimwcCommand, options = processOpts)

    sleep(2000)

  styledEcho(fgYellow, bgBlack, $now() & ": Nim Website Creator: Stopping.")
  quit()


proc startupCheck(cfg: Config) =
  ## Checking if the main-program file exists. If not it will
  ## be compiled with args and compiler options (compiler
  ## options should be specified in the *.nim.pkg)
  preconditions compileOptions.len > 0, storageEFS.len > 0, existsFile(getAppDir() & "/nimwcpkg/nimwc_main.nim")
  # Storage location. Folders are created in the module files.nim
  let
    args = replace(commandLineParams().join(" "), "-", "")
    userArgs = if args == "": "" else: " " & args
    appPath = getAppDir() / "nimwcpkg" / cfg.getSectionValue("Server", "appname")
  when not defined(ignoreefs):
    if not existsDir(storageEFS):  # Check access to EFS file system.
      quit("No access to storage in release mode. Critical.")

  # Ensure that the tables are present in the DB
  connectDb()
  generateDB(db)

  if not fileExists(appPath):
    # Ensure that the DB tables are created
    styledEcho(fgGreen, bgBlack, compile_start_msg & userArgs)
    let (output, exitCode) = execCmdEx("nim c --out:" & appPath & " " & compileOptions & " " & getAppDir() & "/nimwcpkg/nimwc_main.nim")
    if exitCode != 0:
      styledEcho(fgRed, bgBlack, compile_fail_msg & output)
      quit(exitCode)
    else:
      styledEcho(fgGreen, bgBlack, compile_ok_msg)
      when defined(release):
        if findExe"strip".len > 0: discard execCmd(cmdStrip & appPath)


#
# Argument parsing and main function calling.
#


when isMainModule:
  let cfg = loadConfig(getAppDir() / "config/config.cfg") # cfg is Config.
  connectDb() # Read config, connect database, inject it as "db" variable.
  when defined(dev): echo($compileOptions, "\n\n", $cfg)
  for keysType, keys, values in getopt():
    case keysType
    of cmdShortOption, cmdLongOption:
      case keys
      of "version": quit(NimblePkgVersion, 0)
      of "version-hash": quit(commitHash, 0)
      of "help", "fullhelp": styledEcho(fgGreen, bgBlack, doc)
      of "initplugin": pluginSkeleton() # Interactive (Asks to user).
      of "gitupdate": updateNimwc()
      of "forcebuild", "f": echo tryRemoveFile(getAppDir() / "nimwcpkg" / cfg.getSectionValue("Server", "appname"))
      of "newdb": generateDB(db)
      of "newadmin": createAdminUser(db)
      of "insertdata":
        if "bootstrap" in commandLineParams(): createStandardData(db, cssBootstrap, on)
        elif "clean" in commandLineParams():   createStandardData(db, cssClean, on)
        else:                                  createStandardData(db, cssBulma, on)
      of "vacuumdb": echo vacuumDb(db)
      of "backupdb-gpg": echo backupDb(cfg.getSectionValue("Database", when defined(postgres): "name" else: "host"))
      of "backupdb": echo backupDb(cfg.getSectionValue("Database", when defined(postgres): "name" else: "host"), checksum=false, sign=false, targz=false)
      of "backuplogs": echo backupOldLogs(splitPath(cfg.getSectionValue("Logging", when defined(release): "logfile" else: "logfiledev")).head)
    of cmdArgument:
      discard
    of cmdEnd: quit("Wrong Arguments, please see Help with: --help", 1)

    if keys.len != 0: quit("Run again with no Arguments, please see Help with: --help", 0)

  startupCheck(cfg)
  launcherActivated(cfg)
