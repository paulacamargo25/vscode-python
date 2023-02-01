/* eslint-disable @typescript-eslint/no-explicit-any */
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

import { noop } from 'lodash';
import { Uri, Event } from 'vscode';
import { IExtensionApi } from './apiTypes';
import { isTestExecution } from './common/constants';
import { IConfigurationService, Resource } from './common/types';
import { IEnvironmentVariablesProvider } from './common/variables/types';
import { getDebugpyLauncherArgs, getDebugpyPackagePath } from './debugger/extension/adapter/remoteLaunchers';
import { IInterpreterService } from './interpreter/contracts';
import { IServiceContainer, IServiceManager } from './ioc/types';
import { JupyterExtensionIntegration } from './jupyter/jupyterIntegration';
import { IDataViewerDataProvider, IJupyterUriProvider } from './jupyter/types';
import { traceError } from './logging';

export function buildApi(
    ready: Promise<void>,
    serviceManager: IServiceManager,
    serviceContainer: IServiceContainer,
): IExtensionApi {
    const configurationService = serviceContainer.get<IConfigurationService>(IConfigurationService);
    const interpreterService = serviceContainer.get<IInterpreterService>(IInterpreterService);
    serviceManager.addSingleton<JupyterExtensionIntegration>(JupyterExtensionIntegration, JupyterExtensionIntegration);
    const jupyterIntegration = serviceContainer.get<JupyterExtensionIntegration>(JupyterExtensionIntegration);
    const envService = serviceContainer.get<IEnvironmentVariablesProvider>(IEnvironmentVariablesProvider);
    const api: IExtensionApi & {
        /**
         * @deprecated Temporarily exposed for Pylance until we expose this API generally. Will be removed in an
         * iteration or two.
         */
        pylance: {
            getPythonPathVar: (resource?: Uri) => Promise<string | undefined>;
            readonly onDidEnvironmentVariablesChange: Event<Uri | undefined>;
        };
    } = {
        // 'ready' will propagate the exception, but we must log it here first.
        ready: ready.catch((ex) => {
            traceError('Failure during activation.', ex);
            return Promise.reject(ex);
        }),
        jupyter: {
            registerHooks: () => jupyterIntegration.integrateWithJupyterExtension(),
        },
        debug: {
            async getRemoteLauncherCommand(
                host: string,
                port: number,
                waitUntilDebuggerAttaches = true,
            ): Promise<string[]> {
                return getDebugpyLauncherArgs({
                    host,
                    port,
                    waitUntilDebuggerAttaches,
                });
            },
            async getDebuggerPackagePath(): Promise<string | undefined> {
                return getDebugpyPackagePath();
            },
        },
        settings: {
            onDidChangeExecutionDetails: interpreterService.onDidChangeInterpreterConfiguration,
            getExecutionDetails(resource?: Resource) {
                const {pythonPath} = configurationService.getSettings(resource);
                // If pythonPath equals an empty string, no interpreter is set.
                return { execCommand: pythonPath === '' ? undefined : [pythonPath] };
            },
            getEnvFile(workspaceFolder?: Uri) : string {
                return configurationService.getSettings(workspaceFolder).envFile
            }
        },
        // These are for backwards compatibility. Other extensions are using these APIs and we don't want
        // to force them to move to the jupyter extension ... yet.
        datascience: {
            registerRemoteServerProvider: jupyterIntegration
                ? jupyterIntegration.registerRemoteServerProvider.bind(jupyterIntegration)
                : (noop as unknown as (serverProvider: IJupyterUriProvider) => void),
            showDataViewer: jupyterIntegration
                ? jupyterIntegration.showDataViewer.bind(jupyterIntegration)
                : (noop as unknown as (dataProvider: IDataViewerDataProvider, title: string) => Promise<void>),
        },
        pylance: {
            getPythonPathVar: async (resource?: Uri) => {
                const envs = await envService.getEnvironmentVariables(resource);
                return envs.PYTHONPATH;
            },
            onDidEnvironmentVariablesChange: envService.onDidEnvironmentVariablesChange,
        },
    };

    // In test environment return the DI Container.
    if (isTestExecution()) {
        (api as any).serviceContainer = serviceContainer;
        (api as any).serviceManager = serviceManager;
    }
    return api;
}
