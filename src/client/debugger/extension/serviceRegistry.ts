// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IServiceManager } from '../../ioc/types';
import { LaunchRequestArguments } from '../types';
import { DebugEnvironmentVariablesHelper, IDebugEnvironmentVariablesService } from './configuration/resolvers/helper';
import { IDebugConfigurationResolver } from './configuration/types';
import { LaunchConfigurationResolver } from './configuration/resolvers/launch';
import { IChildProcessAttachService, IDebugSessionEventHandlers } from './hooks/types';
import { ChildProcessAttachService } from './hooks/childProcessAttachService';
import { ChildProcessAttachEventHandler } from './hooks/childProcessAttachHandler';
import { IExtensionSingleActivationService } from '../../activation/types';
import { DebugAdapterActivator } from './adapter/activator';
import { IDebugAdapterDescriptorFactory, IDebugSessionLoggingFactory, IOutdatedDebuggerPromptFactory } from './types';
import { DebugAdapterDescriptorFactory } from './adapter/factory';
import { OutdatedDebuggerPromptFactory } from './adapter/outdatedDebuggerPrompt';
import { IAttachProcessProviderFactory } from './attachQuickPick/types';
import { AttachProcessProviderFactory } from './attachQuickPick/factory';
import { DebugCommands } from './debugCommands';
import { DebugSessionLoggingFactory } from './adapter/logging';

export function registerTypes(serviceManager: IServiceManager): void {
    serviceManager.addSingleton<IChildProcessAttachService>(IChildProcessAttachService, ChildProcessAttachService);
    serviceManager.addSingleton<IDebugSessionEventHandlers>(IDebugSessionEventHandlers, ChildProcessAttachEventHandler);
    serviceManager.addSingleton<IDebugConfigurationResolver<LaunchRequestArguments>>(
        IDebugConfigurationResolver,
        LaunchConfigurationResolver,
        'launch',
    );
    serviceManager.addSingleton<IDebugEnvironmentVariablesService>(
        IDebugEnvironmentVariablesService,
        DebugEnvironmentVariablesHelper,
    );
    serviceManager.addSingleton<IExtensionSingleActivationService>(
        IExtensionSingleActivationService,
        DebugAdapterActivator,
    );
    serviceManager.addSingleton<IDebugAdapterDescriptorFactory>(
        IDebugAdapterDescriptorFactory,
        DebugAdapterDescriptorFactory,
    );
    serviceManager.addSingleton<IDebugSessionLoggingFactory>(IDebugSessionLoggingFactory, DebugSessionLoggingFactory);
    serviceManager.addSingleton<IOutdatedDebuggerPromptFactory>(
        IOutdatedDebuggerPromptFactory,
        OutdatedDebuggerPromptFactory,
    );
    serviceManager.addSingleton<IAttachProcessProviderFactory>(
        IAttachProcessProviderFactory,
        AttachProcessProviderFactory,
    );
    serviceManager.addSingleton<IExtensionSingleActivationService>(IExtensionSingleActivationService, DebugCommands);
}
