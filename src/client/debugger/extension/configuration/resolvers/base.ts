// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { injectable } from 'inversify';
import * as path from 'path';
import { CancellationToken, DebugConfiguration, Uri, WorkspaceFolder } from 'vscode';
import { PYTHON_LANGUAGE } from '../../../../common/constants';
import { IConfigurationService } from '../../../../common/types';
import { IInterpreterService } from '../../../../interpreter/contracts';
import { sendTelemetryEvent } from '../../../../telemetry';
import { EventName } from '../../../../telemetry/constants';
import { DebuggerTelemetry } from '../../../../telemetry/types';
import { AttachRequestArguments, DebugOptions, LaunchRequestArguments, PathMapping } from '../../../types';
import { PythonPathSource } from '../../types';
import { IDebugConfigurationResolver } from '../types';
import { getActiveTextEditor, resolveVariables } from '../utils/common';
import { getOSType, OSType } from '../utils/platform';
import { getWorkspaceFolder as getVSCodeWorkspaceFolder, getWorkspaceFolders } from '../utils/workspaceFolder';

@injectable()
export abstract class BaseConfigurationResolver<T extends DebugConfiguration>
    implements IDebugConfigurationResolver<T> {
    protected pythonPathSource: PythonPathSource = PythonPathSource.launchJson;

    constructor(
        protected readonly configurationService: IConfigurationService,
        protected readonly interpreterService: IInterpreterService,
    ) {}

    // This is a legacy hook used solely for backwards-compatible manual substitution
    // of ${command:python.interpreterPath} in "pythonPath", for the sake of other
    // existing implementations of resolveDebugConfiguration() that may rely on it.
    //
    // For all future config variables, expansion should be performed by VSCode itself,
    // and validation of debug configuration in derived classes should be performed in
    // resolveDebugConfigurationWithSubstitutedVariables() instead, where all variables
    // are already substituted.
    public async resolveDebugConfiguration(
        _folder: WorkspaceFolder | undefined,
        debugConfiguration: DebugConfiguration,
        _token?: CancellationToken,
    ): Promise<T | undefined> {
        return debugConfiguration as T;
    }

    public abstract resolveDebugConfigurationWithSubstitutedVariables(
        folder: WorkspaceFolder | undefined,
        debugConfiguration: DebugConfiguration,
        token?: CancellationToken,
    ): Promise<T | undefined>;

    protected getWorkspaceFolder(folder: WorkspaceFolder | undefined): Uri | undefined {
        if (folder) {
            return folder.uri;
        }
        const program = this.getProgram();
        let workspaceFolders = getWorkspaceFolders();

        if (!Array.isArray(workspaceFolders) || workspaceFolders.length === 0) {
            return program ? Uri.file(path.dirname(program)) : undefined;
        }
        if (workspaceFolders.length === 1) {
            return workspaceFolders[0].uri;
        }
        if (program) {
            const workspaceFolder = getVSCodeWorkspaceFolder(Uri.file(program));
            if (workspaceFolder) {
                return workspaceFolder.uri;
            }
        }
    }

    protected getProgram(): string | undefined {
        const activeTextEditor = getActiveTextEditor();
        if (activeTextEditor && activeTextEditor.document.languageId === PYTHON_LANGUAGE) {
            return activeTextEditor.document.fileName;
        }
    }

    protected async resolveAndUpdatePaths(
        workspaceFolder: Uri | undefined,
        debugConfiguration: LaunchRequestArguments,
    ): Promise<void> {
        this.resolveAndUpdateEnvFilePath(workspaceFolder, debugConfiguration);
        await this.resolveAndUpdatePythonPath(workspaceFolder, debugConfiguration);
    }

    protected resolveAndUpdateEnvFilePath(
        workspaceFolder: Uri | undefined,
        debugConfiguration: LaunchRequestArguments,
    ): void {
        if (!debugConfiguration) {
            return;
        }
        if (debugConfiguration.envFile && (workspaceFolder || debugConfiguration.cwd)) {
            debugConfiguration.envFile = resolveVariables(
                debugConfiguration.envFile,
                (workspaceFolder ? workspaceFolder.fsPath : undefined) || debugConfiguration.cwd,
                undefined,
            );
        }
    }

    protected async resolveAndUpdatePythonPath(
        workspaceFolder: Uri | undefined,
        debugConfiguration: LaunchRequestArguments,
    ): Promise<void> {
        if (!debugConfiguration) {
            return;
        }
        if (debugConfiguration.pythonPath === '${command:python.interpreterPath}' || !debugConfiguration.pythonPath) {
            const interpreterPath =
                (await this.interpreterService.getActiveInterpreter(workspaceFolder))?.path ??
                this.configurationService.getSettings(workspaceFolder).pythonPath;
            debugConfiguration.pythonPath = interpreterPath;
        } else {
            debugConfiguration.pythonPath = resolveVariables(
                debugConfiguration.pythonPath ? debugConfiguration.pythonPath : undefined,
                workspaceFolder?.fsPath,
                undefined,
            );
        }
        if (debugConfiguration.python === '${command:python.interpreterPath}' || !debugConfiguration.python) {
            this.pythonPathSource = PythonPathSource.settingsJson;
        } else {
            this.pythonPathSource = PythonPathSource.launchJson;
        }
        debugConfiguration.python = resolveVariables(
            debugConfiguration.python ? debugConfiguration.python : undefined,
            workspaceFolder?.fsPath,
            undefined,
        );
    }

    protected debugOption(debugOptions: DebugOptions[], debugOption: DebugOptions) {
        if (debugOptions.indexOf(debugOption) >= 0) {
            return;
        }
        debugOptions.push(debugOption);
    }

    protected isLocalHost(hostName?: string) {
        const LocalHosts = ['localhost', '127.0.0.1', '::1'];
        return hostName && LocalHosts.indexOf(hostName.toLowerCase()) >= 0 ? true : false;
    }

    protected fixUpPathMappings(
        pathMappings: PathMapping[],
        defaultLocalRoot?: string,
        defaultRemoteRoot?: string,
    ): PathMapping[] {
        if (!defaultLocalRoot) {
            return [];
        }
        if (!defaultRemoteRoot) {
            defaultRemoteRoot = defaultLocalRoot;
        }

        if (pathMappings.length === 0) {
            pathMappings = [
                {
                    localRoot: defaultLocalRoot,
                    remoteRoot: defaultRemoteRoot,
                },
            ];
        } else {
            // Expand ${workspaceFolder} variable first if necessary.
            pathMappings = pathMappings.map(({ localRoot: mappedLocalRoot, remoteRoot }) => ({
                localRoot: resolveVariables(mappedLocalRoot, defaultLocalRoot, undefined),
                // TODO: Apply to remoteRoot too?
                remoteRoot,
            }));
        }

        // If on Windows, lowercase the drive letter for path mappings.
        // TODO: Apply even if no localRoot?
        if (getOSType() == OSType.Windows) {
            // TODO: Apply to remoteRoot too?
            pathMappings = pathMappings.map(({ localRoot: windowsLocalRoot, remoteRoot }) => {
                let localRoot = windowsLocalRoot;
                if (windowsLocalRoot.match(/^[A-Z]:/)) {
                    localRoot = `${windowsLocalRoot[0].toLowerCase()}${windowsLocalRoot.substr(1)}`;
                }
                return { localRoot, remoteRoot };
            });
        }

        return pathMappings;
    }

    protected isDebuggingFastAPI(debugConfiguration: Partial<LaunchRequestArguments & AttachRequestArguments>) {
        return debugConfiguration.module && debugConfiguration.module.toUpperCase() === 'FASTAPI' ? true : false;
    }

    protected isDebuggingFlask(debugConfiguration: Partial<LaunchRequestArguments & AttachRequestArguments>) {
        return debugConfiguration.module && debugConfiguration.module.toUpperCase() === 'FLASK' ? true : false;
    }

    protected sendTelemetry(
        trigger: 'launch' | 'attach' | 'test',
        debugConfiguration: Partial<LaunchRequestArguments & AttachRequestArguments>,
    ) {
        const name = debugConfiguration.name || '';
        const moduleName = debugConfiguration.module || '';
        const telemetryProps: DebuggerTelemetry = {
            trigger,
            console: debugConfiguration.console,
            hasEnvVars: typeof debugConfiguration.env === 'object' && Object.keys(debugConfiguration.env).length > 0,
            django: !!debugConfiguration.django,
            fastapi: this.isDebuggingFastAPI(debugConfiguration),
            flask: this.isDebuggingFlask(debugConfiguration),
            hasArgs: Array.isArray(debugConfiguration.args) && debugConfiguration.args.length > 0,
            isLocalhost: this.isLocalHost(debugConfiguration.host),
            isModule: moduleName.length > 0,
            isSudo: !!debugConfiguration.sudo,
            jinja: !!debugConfiguration.jinja,
            pyramid: !!debugConfiguration.pyramid,
            stopOnEntry: !!debugConfiguration.stopOnEntry,
            showReturnValue: !!debugConfiguration.showReturnValue,
            subProcess: !!debugConfiguration.subProcess,
            watson: name.toLowerCase().indexOf('watson') >= 0,
            pyspark: name.toLowerCase().indexOf('pyspark') >= 0,
            gevent: name.toLowerCase().indexOf('gevent') >= 0,
            scrapy: moduleName.toLowerCase() === 'scrapy',
        };
        sendTelemetryEvent(EventName.DEBUGGER, undefined, telemetryProps);
    }
}
